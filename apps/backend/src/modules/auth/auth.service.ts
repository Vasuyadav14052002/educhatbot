import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { AuthTokens, JwtPayload } from '@edutrack/shared-types';
import { UserRole } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  // ─── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto, ipAddress?: string): Promise<AuthTokens & { user: object }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { school: { select: { id: true, name: true, status: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check account lock
    if (user.locked_until && user.locked_until > new Date()) {
      const minutesLeft = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Account locked due to too many failed attempts. Try again in ${minutesLeft} minutes.`,
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id, user.failed_login_attempts);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user, dto.device_info, ipAddress);

    // Audit log
    await this.createAuditLog(user.id, user.school_id, 'LOGIN', ipAddress);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        school_id: user.school_id,
        school: user.school,
        avatar_url: user.avatar_url,
      },
    };
  }

  // ─── Register ────────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthTokens & { user: object }> {
    // Check email uniqueness
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // Validate school exists for non-super-admin
    if (dto.role !== UserRole.SUPER_ADMIN && dto.school_id) {
      const school = await this.prisma.school.findUnique({
        where: { id: dto.school_id },
      });
      if (!school) {
        throw new BadRequestException('School not found');
      }
    }

    const password_hash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        password_hash,
        phone: dto.phone,
        role: dto.role,
        school_id: dto.school_id,
      },
    });

    const tokens = await this.generateTokens(user, undefined, undefined);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        school_id: user.school_id,
      },
    };
  }

  // ─── Refresh Tokens ──────────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string, ipAddress?: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: true },
    });

    if (!storedToken || storedToken.revoked_at || storedToken.expires_at < new Date()) {
      // Detect token reuse — revoke all tokens for this user
      if (storedToken?.user_id) {
        await this.prisma.refreshToken.updateMany({
          where: { user_id: storedToken.user_id },
          data: { revoked_at: new Date() },
        });
        this.logger.warn(`Token reuse detected for user ${storedToken.user_id}`);
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked_at: new Date() },
    });

    // Generate new token pair
    return this.generateTokens(storedToken.user, undefined, ipAddress);
  }

  // ─── Logout ──────────────────────────────────────────────────────────────────

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { token_hash: tokenHash, user_id: userId },
        data: { revoked_at: new Date() },
      });
    }
    await this.createAuditLog(userId, null, 'LOGOUT');
  }

  // ─── OTP ────────────────────────────────────────────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = this.redisService.otpKey(phone);
    await this.redisService.set(key, otp, 300); // 5 minutes

    // In production: send via SMS (Twilio/AWS SNS)
    this.logger.log(`OTP for ${phone}: ${otp} (dev mode)`);

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const key = this.redisService.otpKey(phone);
    const storedOtp = await this.redisService.get(key);

    if (!storedOtp || storedOtp !== otp) {
      return false;
    }

    await this.redisService.del(key);
    return true;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private async generateTokens(
    user: { id: string; email: string; role: UserRole; school_id?: string | null },
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as unknown as import('@edutrack/shared-types').UserRole,
      school_id: user.school_id ?? undefined,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') || '15m',
      }),
      this.generateRefreshToken(),
    ]);

    // Store hashed refresh token in DB
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token_hash: tokenHash,
        device_info: deviceInfo,
        ip_address: ipAddress,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }

  private generateRefreshToken(): string {
    return randomBytes(64).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async handleFailedLogin(userId: string, currentAttempts: number): Promise<void> {
    const newAttempts = currentAttempts + 1;
    const shouldLock = newAttempts >= this.MAX_FAILED_ATTEMPTS;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failed_login_attempts: newAttempts,
        locked_until: shouldLock
          ? new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60 * 1000)
          : null,
      },
    });

    if (shouldLock) {
      this.logger.warn(`Account locked after ${newAttempts} failed attempts: ${userId}`);
    }
  }

  private async createAuditLog(
    userId: string,
    schoolId: string | null | undefined,
    action: 'LOGIN' | 'LOGOUT',
    ipAddress?: string,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        user_id: userId,
        school_id: schoolId ?? undefined,
        action,
        entity_type: 'User',
        entity_id: userId,
        ip_address: ipAddress,
      },
    });
  }
}
