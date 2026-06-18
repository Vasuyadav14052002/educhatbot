import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { SocketEvent } from '@edutrack/shared-types';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/realtime',
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  afterInit() {
    this.logger.log('✅ Socket.io gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  // ─── Room Management ────────────────────────────────────────────────────────

  @SubscribeMessage(SocketEvent.ROOM_JOIN)
  handleJoinRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.room);
    this.logger.debug(`Client ${client.id} joined room: ${data.room}`);
    return { success: true, room: data.room };
  }

  @SubscribeMessage(SocketEvent.ROOM_LEAVE)
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.room);
    return { success: true };
  }

  // ─── Event Listeners (from NestJS EventEmitter) ──────────────────────────────

  @OnEvent('attendance.updated')
  handleAttendanceUpdated(payload: {
    school_id: string;
    student_id: string;
    date: string;
    status: string;
    student_name: string;
  }) {
    // Emit to school room (all admins/teachers) and student-specific room (parent)
    this.server.to(`school:${payload.school_id}`).emit(SocketEvent.ATTENDANCE_UPDATED, payload);
    this.server.to(`student:${payload.student_id}`).emit(SocketEvent.ATTENDANCE_UPDATED, payload);
    this.logger.debug(`Attendance updated event emitted for student ${payload.student_id}`);
  }

  @OnEvent('marks.updated')
  handleMarksUpdated(payload: {
    school_id: string;
    student_id: string;
    subject_name: string;
    score: number;
    max_score: number;
    exam_name: string;
  }) {
    this.server.to(`school:${payload.school_id}`).emit(SocketEvent.MARKS_UPDATED, payload);
    this.server.to(`student:${payload.student_id}`).emit(SocketEvent.MARKS_UPDATED, payload);
  }

  @OnEvent('progress.updated')
  handleProgressUpdated(payload: { school_id: string; student_id: string }) {
    this.server.to(`student:${payload.student_id}`).emit(SocketEvent.PROGRESS_UPDATED, payload);
  }

  @OnEvent('notification.new')
  handleNewNotification(payload: { user_id: string; notification: object }) {
    this.server.to(`user:${payload.user_id}`).emit(SocketEvent.NOTIFICATION_NEW, payload.notification);
  }

  // ─── Server-side emit helpers ────────────────────────────────────────────────

  emitToRoom(room: string, event: string, payload: unknown) {
    this.server.to(room).emit(event, payload);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }
}
