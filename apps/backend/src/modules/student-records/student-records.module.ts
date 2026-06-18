import { Module } from '@nestjs/common';
import { StudentRecordsController } from './student-records.controller';
import { StudentRecordsService } from './student-records.service';

@Module({
  controllers: [StudentRecordsController],
  providers: [StudentRecordsService],
  exports: [StudentRecordsService],
})
export class StudentRecordsModule {}
