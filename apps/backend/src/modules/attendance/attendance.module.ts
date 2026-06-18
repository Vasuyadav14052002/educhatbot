import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  controllers: [AttendanceController],
  providers: [AttendanceService, RedisService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
