// Module stubs for Phase 1 core modules
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';

// ─── School Module ────────────────────────────────────────────────────────────
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SchoolService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.school.findMany({
      select: { id: true, name: true, code: true, email: true, status: true, subscription_plan: true, created_at: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.school.findUnique({ where: { id } });
  }

  async create(data: { name: string; code: string; email: string; address?: string; phone?: string }) {
    return this.prisma.school.create({ data });
  }

  async update(id: string, data: Partial<{ name: string; address: string; phone: string; logo_url: string }>) {
    return this.prisma.school.update({ where: { id }, data });
  }
}
