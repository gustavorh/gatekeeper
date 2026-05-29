import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsString, IsIn, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { AdminAuthGuard } from '../middleware/admin-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import {
  REPORT_EXPORT_QUEUE,
  ReportExportJob,
} from '../../application/queues/report-export.processor';

class ReportExportRequestDto {
  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-01-31' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ enum: ['csv', 'json'], default: 'csv' })
  @IsIn(['csv', 'json'])
  format: 'csv' | 'json';
}

@ApiTags('admin')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, AdminAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(
    @InjectQueue(REPORT_EXPORT_QUEUE) private readonly exportQueue: Queue,
  ) {}

  @Post('export')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Enqueue a shift report export',
    description:
      'Enqueues an async report export job. Poll GET /admin/reports/jobs/:jobId for status.',
  })
  @ApiResponse({
    status: 202,
    description: 'Job enqueued',
    schema: {
      properties: {
        jobId: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async enqueueExport(
    @CurrentUser() user: { id: string; organizationId: string },
    @Body() dto: ReportExportRequestDto,
  ): Promise<{ jobId: string; message: string }> {
    const payload: ReportExportJob = {
      organizationId: user.organizationId,
      requestedBy: user.id,
      startDate: dto.startDate,
      endDate: dto.endDate,
      format: dto.format,
    };
    const job = await this.exportQueue.add('export', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    });
    return { jobId: String(job.id), message: 'Export job enqueued' };
  }

  @Get('jobs/:jobId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get report export job status',
    description: 'Poll this endpoint to check if the export job is done.',
  })
  @ApiResponse({
    status: 200,
    schema: {
      properties: {
        id: { type: 'string' },
        state: {
          type: 'string',
          enum: ['waiting', 'active', 'completed', 'failed'],
        },
        progress: { type: 'number' },
        result: { type: 'object', nullable: true },
      },
    },
  })
  async getJobStatus(
    @Param('jobId') jobId: string,
  ): Promise<{ id: string; state: string; progress: number; result: unknown }> {
    const job = await this.exportQueue.getJob(jobId);
    if (!job) {
      return { id: jobId, state: 'not_found', progress: 0, result: null };
    }
    const state = await job.getState();
    return {
      id: String(job.id),
      state,
      progress: job.progress as number,
      result: job.returnvalue ?? null,
    };
  }
}
