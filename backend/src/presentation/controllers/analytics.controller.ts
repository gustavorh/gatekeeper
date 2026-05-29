import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AnalyticsService } from '../../application/services/analytics.service';
import { JwtAuthGuard } from '../middleware/jwt-auth.guard';
import { OwnershipGuard } from '../guards/ownership.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../../application/types/jwt-payload';
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
    @CurrentUser() user: JwtPayload,
  ): Promise<WorkHoursSummary> {
    return this.analyticsService.getCurrentWeekAnalytics(user.id);
  }

  /**
   * Get current month analytics for the authenticated user
   */
  @Get('work-hours/current-month')
  async getCurrentMonthAnalytics(
    @CurrentUser() user: JwtPayload,
  ): Promise<WorkHoursSummary> {
    return this.analyticsService.getCurrentMonthAnalytics(user.id);
  }

  /**
   * Get week analytics for a specific week
   */
  @Get('work-hours/week')
  async getWeekAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query() query: WorkHoursQueryDto,
  ): Promise<WorkHoursSummary> {
    if (!query.startDate) {
      throw new BadRequestException('startDate is required');
    }

    const date = new Date(query.startDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid startDate format');
    }

    return this.analyticsService.getWeekAnalytics(user.id, date);
  }

  /**
   * Get month analytics for a specific month
   */
  @Get('work-hours/month')
  async getMonthAnalytics(
    @CurrentUser() user: JwtPayload,
    @Query() query: WorkHoursQueryDto,
  ): Promise<WorkHoursSummary> {
    if (!query.startDate) {
      throw new BadRequestException('startDate is required');
    }

    const date = new Date(query.startDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid startDate format');
    }

    return this.analyticsService.getMonthAnalytics(user.id, date);
  }

  /**
   * Start lunch break for the authenticated user
   */
  @Post('lunch-break/start')
  async startLunchBreak(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.startLunchBreak(user.id);
  }

  /**
   * End lunch break for the authenticated user
   */
  @Post('lunch-break/end')
  async endLunchBreak(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.endLunchBreak(user.id);
  }

  /**
   * Get work hours analytics for a specific user (owner or admin only)
   */
  @Get('work-hours/user/:userId')
  @UseGuards(OwnershipGuard)
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
