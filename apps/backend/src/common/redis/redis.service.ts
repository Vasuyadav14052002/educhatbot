import {
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';
import { REDIS_CLIENT } from './redis.module';
import type { RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: RedisClientType) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setEx(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async delPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(keys);
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  async exists(key: string): Promise<boolean> {
    const count = await this.redis.exists(key);
    return count > 0;
  }

  // ─── Cache Helpers ───────────────────────────────────────────────────────

  kpiKey(schoolId: string, role: string, date: string): string {
    return `kpi:${schoolId}:${role}:${date}`;
  }

  attendanceKey(schoolId: string, studentId: string, yearId: string): string {
    return `attendance:${schoolId}:${studentId}:${yearId}`;
  }

  studentKey(schoolId: string, studentId: string): string {
    return `student:${schoolId}:${studentId}`;
  }

  otpKey(phone: string): string {
    return `otp:${phone}`;
  }

  rateLimitKey(ip: string, endpoint: string): string {
    return `ratelimit:${ip}:${endpoint}`;
  }

  sessionKey(userId: string, tokenId: string): string {
    return `session:${userId}:${tokenId}`;
  }

  // ─── School Cache Invalidation ───────────────────────────────────────────

  async invalidateSchoolCache(schoolId: string): Promise<void> {
    await this.delPattern(`*:${schoolId}:*`);
    await this.delPattern(`kpi:${schoolId}:*`);
    this.logger.debug(`Invalidated cache for school ${schoolId}`);
  }

  async invalidateStudentCache(schoolId: string, studentId: string): Promise<void> {
    await this.del(this.studentKey(schoolId, studentId));
    await this.delPattern(`attendance:${schoolId}:${studentId}:*`);
    await this.delPattern(`kpi:${schoolId}:*`);
  }
}
