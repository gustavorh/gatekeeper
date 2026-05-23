import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

export const REPORT_EXPORT_QUEUE = 'report-export';

export interface ReportExportJob {
  organizationId: string;
  requestedBy: string;
  startDate: string;
  endDate: string;
  format: 'csv' | 'json';
}

@Processor(REPORT_EXPORT_QUEUE)
export class ReportExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportExportProcessor.name);

  async process(job: Job<ReportExportJob>): Promise<{ url: string }> {
    const { organizationId, requestedBy, startDate, endDate, format } =
      job.data;
    this.logger.log(
      `Processing report export job ${job.id} for org ${organizationId} by ${requestedBy}`,
    );

    await job.updateProgress(10);

    // TODO: implement actual report generation — fetch shifts, format, upload to storage
    // Placeholder: simulate work
    await new Promise((r) => setTimeout(r, 100));

    await job.updateProgress(100);

    const url = `/reports/${organizationId}/${format}/${startDate}_${endDate}.${format}`;
    this.logger.log(`Report export job ${job.id} completed: ${url}`);
    return { url };
  }
}
