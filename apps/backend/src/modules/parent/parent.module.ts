import { Module } from '@nestjs/common';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  controllers: [ParentController],
  providers: [ParentService, RedisService],
  exports: [ParentService],
})
export class ParentModule {}
