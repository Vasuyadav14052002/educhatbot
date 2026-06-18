import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  controllers: [ProgressController],
  providers: [ProgressService, RedisService],
  exports: [ProgressService],
})
export class ProgressModule {}
