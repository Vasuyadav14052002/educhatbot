import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // List all staff (TEACHER, SCHOOL_ADMIN)
  async getStaff(schoolId: string) {
    return this.prisma.user.findMany({
      where: {
        school_id: schoolId,
        role: { in: [UserRole.TEACHER, UserRole.SCHOOL_ADMIN] },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Create staff user
  async createStaff(schoolId: string, data: { first_name: string; last_name: string; email: string; phone?: string; role: UserRole }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    // Default password: Staff@123
    const defaultPassword = 'Staff@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 12);

    return this.prisma.user.create({
      data: {
        school_id: schoolId,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        password_hash: passwordHash,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });
  }

  // Update staff user
  async updateStaff(schoolId: string, id: string, data: { first_name?: string; last_name?: string; phone?: string; role?: UserRole; status?: UserStatus }) {
    const user = await this.prisma.user.findFirst({ where: { id, school_id: schoolId } });
    if (!user) throw new NotFoundException('Staff user not found');

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });
  }

  // Deactivate/activate user
  async setStatus(schoolId: string, id: string, status: UserStatus) {
    const user = await this.prisma.user.findFirst({ where: { id, school_id: schoolId } });
    if (!user) throw new NotFoundException('Staff user not found');

    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, status: true },
    });
  }
}
