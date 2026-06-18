import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { RedisService } from '../../common/redis/redis.service';

@Module({
  controllers: [StudentController],
  providers: [StudentService, RedisService],
  exports: [StudentService],
})
export class StudentModule {}
