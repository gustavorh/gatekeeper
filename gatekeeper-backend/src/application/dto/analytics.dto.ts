import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export class WorkHoursQueryDto {
  @IsEnum(['week', 'month'])
  period: 'week' | 'month';

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class UserWorkHoursQueryDto {
  @IsEnum(['week', 'month'])
  period: 'week' | 'month';

  @IsOptional()
  @IsDateString()
  startDate?: string;
}

export class LunchBreakResponseDto {
  id: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  lunchStartTime?: Date;
  lunchEndTime?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
