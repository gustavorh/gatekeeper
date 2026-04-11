export enum ShiftStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
}

export interface Shift {
  id: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  lunchStartTime?: Date;
  lunchEndTime?: Date;
  status: ShiftStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShiftDto {
  userId: string;
  clockInTime: Date;
}

export interface UpdateShiftDto {
  clockOutTime?: Date;
  lunchStartTime?: Date;
  lunchEndTime?: Date;
  status?: ShiftStatus;
}

export interface ShiftWithUser {
  id: string;
  userId: string;
  clockInTime: Date;
  clockOutTime?: Date;
  lunchStartTime?: Date;
  lunchEndTime?: Date;
  status: ShiftStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    rut: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// Analytics interfaces
export interface WorkHoursAnalytics {
  totalWorkedHours: number;
  totalLunchTime: number;
  totalBreakTime: number;
  averageWorkedHoursPerDay: number;
  averageLunchTimePerDay: number;
  period: 'week' | 'month';
  startDate: Date;
  endDate: Date;
  shifts: Shift[];
}

export interface DailyWorkHours {
  date: string;
  workedHours: number;
  lunchTime: number;
  breakTime: number;
  clockInTime: Date;
  clockOutTime?: Date;
  lunchStartTime?: Date;
  lunchEndTime?: Date;
}

export interface WorkHoursSummary {
  totalWorkedHours: number;
  totalLunchTime: number;
  totalBreakTime: number;
  daysWorked: number;
  averageWorkedHoursPerDay: number;
  averageLunchTimePerDay: number;
  period: 'week' | 'month';
  startDate: Date;
  endDate: Date;
  dailyBreakdown: DailyWorkHours[];
}
