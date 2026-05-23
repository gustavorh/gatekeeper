import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import {
  REPORT_EXPORT_QUEUE,
  ReportExportProcessor,
} from '../queues/report-export.processor';
import { ReportsController } from '../../presentation/controllers/reports.controller';
import { AdminModule } from './admin.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: REPORT_EXPORT_QUEUE }),
    AdminModule,
  ],
  controllers: [ReportsController],
  providers: [ReportExportProcessor],
})
export class ReportsModule {}
