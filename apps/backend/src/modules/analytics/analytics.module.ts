import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, RedisService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
