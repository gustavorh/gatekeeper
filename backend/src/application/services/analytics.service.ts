import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  WorkHoursSummary,
  DailyWorkHours,
  Shift,
} from '../../domain/entities/shift.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @Inject('IShiftRepository')
    private readonly shiftRepository: IShiftRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Calculate work hours analytics for a specific period
   */
  async getWorkHoursAnalytics(
    userId: string,
    period: 'week' | 'month',
    startDate?: Date,
  ): Promise<WorkHoursSummary> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Calculate date range
    const { start, end } = this.calculateDateRange(period, startDate);

    // Get shifts for the period
    const shifts = await this.shiftRepository.findByUserIdAndDateRange(
      userId,
      start,
      end,
    );

    // Calculate analytics
    const dailyBreakdown = this.calculateDailyBreakdown(shifts);
    const summary = this.calculateSummary(dailyBreakdown, period, start, end);

    return summary;
  }

  /**
   * Start lunch break for a user
   */
  async startLunchBreak(userId: string): Promise<Shift> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find active shift
    const activeShift = await this.shiftRepository.findActiveByUserId(userId);
    if (!activeShift) {
      throw new NotFoundException('No active shift found');
    }

    // Update shift with lunch start time
    const updatedShift = await this.shiftRepository.update(activeShift.id, {
      lunchStartTime: new Date(),
    });

    return updatedShift;
  }

  /**
   * End lunch break for a user
   */
  async endLunchBreak(userId: string): Promise<Shift> {
    // Validate user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find active shift
    const activeShift = await this.shiftRepository.findActiveByUserId(userId);
    if (!activeShift) {
      throw new NotFoundException('No active shift found');
    }

    if (!activeShift.lunchStartTime) {
      throw new NotFoundException('No lunch break started');
    }

    // Update shift with lunch end time
    const updatedShift = await this.shiftRepository.update(activeShift.id, {
      lunchEndTime: new Date(),
    });

    return updatedShift;
  }

  /**
   * Get current week analytics for a user
   */
  async getCurrentWeekAnalytics(userId: string): Promise<WorkHoursSummary> {
    return this.getWorkHoursAnalytics(userId, 'week');
  }

  /**
   * Get current month analytics for a user
   */
  async getCurrentMonthAnalytics(userId: string): Promise<WorkHoursSummary> {
    return this.getWorkHoursAnalytics(userId, 'month');
  }

  /**
   * Get analytics for a specific week
   */
  async getWeekAnalytics(
    userId: string,
    startDate: Date,
  ): Promise<WorkHoursSummary> {
    return this.getWorkHoursAnalytics(userId, 'week', startDate);
  }

  /**
   * Get analytics for a specific month
   */
  async getMonthAnalytics(
    userId: string,
    startDate: Date,
  ): Promise<WorkHoursSummary> {
    return this.getWorkHoursAnalytics(userId, 'month', startDate);
  }

  /**
   * Calculate date range based on period
   */
  private calculateDateRange(
    period: 'week' | 'month',
    startDate?: Date,
  ): { start: Date; end: Date } {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (period === 'week') {
      // Start of current week (Monday)
      start = startDate || this.getStartOfWeek(now);
      end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else {
      // Start of current month
      start = startDate || this.getStartOfMonth(now);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of the month
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  /**
   * Get start of week (Monday)
   */
  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get start of month
   */
  private getStartOfMonth(date: Date): Date {
    const start = new Date(date);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Calculate daily breakdown from shifts
   */
  private calculateDailyBreakdown(shifts: Shift[]): DailyWorkHours[] {
    const dailyMap = new Map<string, DailyWorkHours>();

    for (const shift of shifts) {
      if (!shift.clockOutTime) continue; // Skip incomplete shifts

      const dateKey = shift.clockInTime.toISOString().split('T')[0];
      const workedHours = this.calculateWorkedHours(shift);
      const lunchTime = this.calculateLunchTime(shift);
      const breakTime = this.calculateBreakTime(shift);

      if (dailyMap.has(dateKey)) {
        const existing = dailyMap.get(dateKey)!;
        existing.workedHours += workedHours;
        existing.lunchTime += lunchTime;
        existing.breakTime += breakTime;
      } else {
        dailyMap.set(dateKey, {
          date: dateKey,
          workedHours,
          lunchTime,
          breakTime,
          clockInTime: shift.clockInTime,
          clockOutTime: shift.clockOutTime,
          lunchStartTime: shift.lunchStartTime,
          lunchEndTime: shift.lunchEndTime,
        });
      }
    }

    return Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  /**
   * Calculate worked hours for a shift
   */
  private calculateWorkedHours(shift: Shift): number {
    if (!shift.clockOutTime) return 0;

    const totalTime =
      shift.clockOutTime.getTime() - shift.clockInTime.getTime();
    const lunchTime = this.calculateLunchTime(shift);

    return (totalTime - lunchTime) / (1000 * 60 * 60); // Convert to hours
  }

  /**
   * Calculate lunch time for a shift
   */
  private calculateLunchTime(shift: Shift): number {
    if (!shift.lunchStartTime || !shift.lunchEndTime) return 0;

    return (
      (shift.lunchEndTime.getTime() - shift.lunchStartTime.getTime()) /
      (1000 * 60 * 60)
    );
  }

  /**
   * Calculate break time (excluding lunch) for a shift
   */
  private calculateBreakTime(shift: Shift): number {
    // This could be expanded to track other types of breaks
    // For now, return 0 as we're only tracking lunch breaks
    return 0;
  }

  /**
   * Calculate summary from daily breakdown
   */
  private calculateSummary(
    dailyBreakdown: DailyWorkHours[],
    period: 'week' | 'month',
    startDate: Date,
    endDate: Date,
  ): WorkHoursSummary {
    const totalWorkedHours = dailyBreakdown.reduce(
      (sum, day) => sum + day.workedHours,
      0,
    );
    const totalLunchTime = dailyBreakdown.reduce(
      (sum, day) => sum + day.lunchTime,
      0,
    );
    const totalBreakTime = dailyBreakdown.reduce(
      (sum, day) => sum + day.breakTime,
      0,
    );
    const daysWorked = dailyBreakdown.length;

    return {
      totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
      totalLunchTime: Math.round(totalLunchTime * 100) / 100,
      totalBreakTime: Math.round(totalBreakTime * 100) / 100,
      daysWorked,
      averageWorkedHoursPerDay:
        daysWorked > 0
          ? Math.round((totalWorkedHours / daysWorked) * 100) / 100
          : 0,
      averageLunchTimePerDay:
        daysWorked > 0
          ? Math.round((totalLunchTime / daysWorked) * 100) / 100
          : 0,
      period,
      startDate,
      endDate,
      dailyBreakdown,
    };
  }
}
