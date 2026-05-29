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
    // D3: Report export is not yet implemented. Fail the job explicitly so
    // callers polling GET /admin/reports/jobs/:jobId see state='failed'
    // instead of a fake completed URL.
    this.logger.warn(
      `Report export job ${job.id} rejected: feature not implemented yet. Tracked in audit-4 D3.`,
    );
    throw new Error(
      'Report export not implemented yet. Tracked in audit-4 D3.',
    );
  }
}
