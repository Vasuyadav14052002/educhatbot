import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import * as admin from 'firebase-admin';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private firebaseApp: admin.app.App | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      const projectId = this.configService.get('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');

      if (projectId && privateKey && clientEmail) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
        });
        this.logger.log('✅ Firebase Admin initialized');
      } else {
        this.logger.warn('⚠️  Firebase not configured — push notifications disabled');
      }
    } catch (err) {
      this.logger.error('Firebase init failed', err);
    }
  }

  // ─── Send Notification ───────────────────────────────────────────────────────

  async sendNotification(params: {
    userId: string;
    schoolId: string;
    title: string;
    message: string;
    type: NotificationType;
    data?: Record<string, unknown>;
    fcmToken?: string;
  }) {
    // Save in-app notification
    const notification = await this.prisma.notification.create({
      data: {
        user_id: params.userId,
        school_id: params.schoolId,
        title: params.title,
        message: params.message,
        type: params.type,
        data: (params.data as any) ?? {},
        sent_via: params.fcmToken ? ['IN_APP', 'PUSH'] : ['IN_APP'],
      },
    });

    // Send FCM push notification
    if (params.fcmToken && this.firebaseApp) {
      await this.sendFCMPush(params.fcmToken, params.title, params.message, params.data);
    }

    return notification;
  }

  // ─── Bulk Notification (school-wide announcement) ────────────────────────────

  async broadcastToSchool(
    schoolId: string,
    title: string,
    message: string,
    type: NotificationType,
    senderId: string,
  ) {
    const users = await this.prisma.user.findMany({
      where: { school_id: schoolId, status: 'ACTIVE' },
      select: { id: true },
    });

    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        user_id: u.id,
        school_id: schoolId,
        title,
        message,
        type,
        sent_via: ['IN_APP'],
      })),
    });

    this.logger.log(`Broadcast sent to ${users.length} users in school ${schoolId}`);
    return { sent_to: users.length };
  }

  // ─── Attendance Notification ─────────────────────────────────────────────────

  async notifyAttendanceMarked(params: {
    studentId: string;
    studentName: string;
    schoolId: string;
    status: string;
    date: string;
  }) {
    const parentRelations = await this.prisma.parentStudentRelation.findMany({
      where: { student_id: params.studentId, can_receive_notifications: true },
      include: { parent: true },
    });

    const statusEmoji = params.status === 'PRESENT' ? '✅' : params.status === 'ABSENT' ? '❌' : '⚠️';

    for (const relation of parentRelations) {
      await this.sendNotification({
        userId: relation.parent_user_id,
        schoolId: params.schoolId,
        title: `${statusEmoji} Attendance Update`,
        message: `${params.studentName} was marked ${params.status.toLowerCase()} on ${params.date}`,
        type: NotificationType.ATTENDANCE_MARKED,
        data: { student_id: params.studentId, status: params.status, date: params.date },
      });
    }
  }

  // ─── Get User Notifications ──────────────────────────────────────────────────

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { user_id: userId } }),
    ]);

    const unreadCount = await this.prisma.notification.count({
      where: { user_id: userId, is_read: false },
    });

    return { notifications, total, unread_count: unreadCount, page, limit };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId, user_id: userId },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true, read_at: new Date() },
    });
  }

  // ─── FCM Push ────────────────────────────────────────────────────────────────

  private async sendFCMPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ) {
    if (!this.firebaseApp) return;

    try {
      await admin.messaging(this.firebaseApp).send({
        token,
        notification: { title, body },
        data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : {},
        android: { priority: 'high', notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' } },
        apns: { payload: { aps: { sound: 'default', badge: 1 } } },
      });
    } catch (err) {
      this.logger.error(`FCM push failed for token ${token.substring(0, 20)}...`, err);
    }
  }
}
