import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Soft-delete helper: use this pattern to exclude deleted records
   * Usage: prisma.$extends(withSoftDelete())
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('cleanDatabase is not allowed in production!');
    }
    const tableNames = [
      'audit_logs', 'notifications', 'reports', 'media_files', 'events',
      'participation', 'student_progress', 'marks', 'exams', 'attendance',
      'student_promotions', 'parent_student_relations', 'students',
      'teacher_subjects', 'class_subjects', 'subjects', 'classes',
      'refresh_tokens', 'users', 'terms', 'academic_years', 'schools',
    ];
    for (const tableName of tableNames) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    }
  }
}
