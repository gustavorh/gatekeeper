import { ApiProperty } from '@nestjs/swagger';

export class AckResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}

export class DashboardStatsDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  activeShifts: number;

  @ApiProperty()
  totalRoles: number;

  @ApiProperty()
  totalPermissions: number;
}

export class RecentActivityDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Activity type, e.g. login, shift, role-assign' })
  type: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiProperty({ format: 'date-time' })
  timestamp: string;
}

export class TopUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  totalShifts: number;

  @ApiProperty()
  totalHours: number;
}

export class DashboardDataDto {
  @ApiProperty({ type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ type: [RecentActivityDto] })
  recentActivities: RecentActivityDto[];

  @ApiProperty({ type: [TopUserDto] })
  topUsers: TopUserDto[];
}
