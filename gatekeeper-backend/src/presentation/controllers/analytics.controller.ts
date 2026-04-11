import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from '../../application/services/analytics.service';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { WorkHoursSummary } from '../../domain/entities/shift.entity';
import {
  WorkHoursQueryDto,
  UserWorkHoursQueryDto,
} from '../../application/dto/analytics.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * Get current week analytics for the authenticated user
   */
  @Get('work-hours/current-week')
  async getCurrentWeekAnalytics(
    @Request() req: any,
  ): Promise<WorkHoursSummary> {
    return this.analyticsService.getCurrentWeekAnalytics(req.user.id);
  }

  /**
   * Get current month analytics for the authenticated user
   */
  @Get('work-hours/current-month')
  async getCurrentMonthAnalytics(
    @Request() req: any,
  ): Promise<WorkHoursSummary> {
    return this.analyticsService.getCurrentMonthAnalytics(req.user.id);
  }

  /**
   * Get week analytics for a specific week
   */
  @Get('work-hours/week')
  async getWeekAnalytics(
    @Request() req: any,
    @Query() query: WorkHoursQueryDto,
  ): Promise<WorkHoursSummary> {
    if (!query.startDate) {
      throw new BadRequestException('startDate is required');
    }

    const date = new Date(query.startDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid startDate format');
    }

    return this.analyticsService.getWeekAnalytics(req.user.id, date);
  }

  /**
   * Get month analytics for a specific month
   */
  @Get('work-hours/month')
  async getMonthAnalytics(
    @Request() req: any,
    @Query() query: WorkHoursQueryDto,
  ): Promise<WorkHoursSummary> {
    if (!query.startDate) {
      throw new BadRequestException('startDate is required');
    }

    const date = new Date(query.startDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid startDate format');
    }

    return this.analyticsService.getMonthAnalytics(req.user.id, date);
  }

  /**
   * Start lunch break for the authenticated user
   */
  @Post('lunch-break/start')
  async startLunchBreak(@Request() req: any) {
    return this.analyticsService.startLunchBreak(req.user.id);
  }

  /**
   * End lunch break for the authenticated user
   */
  @Post('lunch-break/end')
  async endLunchBreak(@Request() req: any) {
    return this.analyticsService.endLunchBreak(req.user.id);
  }

  /**
   * Get work hours analytics for a specific user (admin only)
   */
  @Get('work-hours/user/:userId')
  async getUserWorkHoursAnalytics(
    @Param('userId') userId: string,
    @Query() query: UserWorkHoursQueryDto,
  ): Promise<WorkHoursSummary> {
    if (!query.period || !['week', 'month'].includes(query.period)) {
      throw new BadRequestException('period must be "week" or "month"');
    }

    const date = query.startDate ? new Date(query.startDate) : undefined;
    if (query.startDate && isNaN(date!.getTime())) {
      throw new BadRequestException('Invalid startDate format');
    }

    return this.analyticsService.getWorkHoursAnalytics(
      userId,
      query.period,
      date,
    );
  }
}
