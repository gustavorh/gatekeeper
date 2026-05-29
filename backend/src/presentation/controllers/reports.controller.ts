import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  HttpException,
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
  @HttpCode(HttpStatus.NOT_IMPLEMENTED)
  @ApiOperation({
    summary: 'Enqueue a shift report export (not yet implemented)',
    description:
      'D3: Report export feature is not yet implemented. Returns 501. Tracked in audit-4 D3.',
  })
  @ApiResponse({
    status: 501,
    description: 'Not Implemented',
  })
  async enqueueExport(
    @CurrentUser() _user: { id: string; organizationId: string },
    @Body() _dto: ReportExportRequestDto,
  ): Promise<never> {
    throw new HttpException(
      'Report export not yet implemented. Tracked in audit-4 D3.',
      HttpStatus.NOT_IMPLEMENTED,
    );
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
