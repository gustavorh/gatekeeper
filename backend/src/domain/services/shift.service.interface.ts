import { Shift, ShiftWithUser } from '../entities/shift.entity';
import { ShiftFilters } from '../repositories/shift.repository.interface';

export interface IShiftService {
  clockIn(userId: string): Promise<Shift>;
  clockOut(userId: string): Promise<Shift>;
  getCurrentShift(userId: string): Promise<Shift | null>;
  getShiftHistory(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<{
    shifts: Shift[];
    total: number;
  }>;
  getShiftHistoryWithFilters(
    userId: string,
    filters: ShiftFilters,
    limit?: number,
    offset?: number,
  ): Promise<{
    shifts: Shift[];
    total: number;
  }>;
  validateClockIn(userId: string): Promise<boolean>;
  validateClockOut(userId: string): Promise<boolean>;
  getAllActiveShifts(
    limit?: number,
    offset?: number,
  ): Promise<{
    shifts: ShiftWithUser[];
    total: number;
  }>;
}
