import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

// Core Modules
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { SchoolModule } from './modules/school/school.module';
import { AcademicYearModule } from './modules/academic-year/academic-year.module';
import { ClassModule } from './modules/class/class.module';
import { SubjectModule } from './modules/subject/subject.module';
import { UserModule } from './modules/user/user.module';
import { StudentModule } from './modules/student/student.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { MarksModule } from './modules/marks/marks.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ParticipationModule } from './modules/participation/participation.module';
import { NotificationModule } from './modules/notification/notification.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { ParentModule } from './modules/parent/parent.module';
import { StudentRecordsModule } from './modules/student-records/student-records.module';
import { TeacherProfileModule } from './modules/teacher-profile/teacher-profile.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    // ─── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '.env'] }),

    // ─── Cache ───────────────────────────────────────────────────────────────
    CacheModule.register({ isGlobal: true }),

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'default',
            ttl: config.get('THROTTLE_TTL_SECONDS', 60) * 1000,
            limit: config.get('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // ─── Events ───────────────────────────────────────────────────────────────
    EventEmitterModule.forRoot({ wildcard: false, delimiter: '.', newListener: false, removeListener: false, maxListeners: 20, verboseMemoryLeak: true, ignoreErrors: false }),

    // ─── Cron Jobs ────────────────────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Infrastructure ───────────────────────────────────────────────────────
    PrismaModule,
    RedisModule,

    // ─── Features ─────────────────────────────────────────────────────────────
    AuthModule,
    SchoolModule,
    AcademicYearModule,
    ClassModule,
    SubjectModule,
    UserModule,
    StudentModule,
    AttendanceModule,
    MarksModule,
    ProgressModule,
    ParticipationModule,
    NotificationModule,
    AnalyticsModule,
    RealtimeModule,
    ParentModule,
    StudentRecordsModule,
    TeacherProfileModule,
    DashboardModule,
  ],
})
export class AppModule {}
