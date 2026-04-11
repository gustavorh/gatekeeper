import {
  Shift,
  CreateShiftDto,
  UpdateShiftDto,
  ShiftWithUser,
  ShiftStatus,
} from '../entities/shift.entity';

export interface ShiftFilters {
  startDate?: string;
  endDate?: string;
  status?: ShiftStatus;
}

export interface IShiftRepository {
  create(createShiftDto: CreateShiftDto): Promise<Shift>;
  findById(id: string): Promise<Shift | null>;
  findByUserId(userId: string): Promise<Shift[]>;
  findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Shift[]>;
  findActiveByUserId(userId: string): Promise<Shift | null>;
  findPendingByUserId(userId: string): Promise<Shift | null>;
  update(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift>;
  delete(id: string): Promise<void>;
  findWithUser(id: string): Promise<ShiftWithUser | null>;
  findHistoryByUserId(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<ShiftWithUser[]>;
  findHistoryByUserIdWithoutUser(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Shift[]>;
  findHistoryByUserIdWithFilters(
    userId: string,
    filters: ShiftFilters,
    limit?: number,
    offset?: number,
  ): Promise<Shift[]>;
  countByUserId(userId: string): Promise<number>;
  countByUserIdWithFilters(
    userId: string,
    filters: ShiftFilters,
  ): Promise<number>;
  findAllActiveWithUsers(
    limit?: number,
    offset?: number,
  ): Promise<ShiftWithUser[]>;
  countAllActive(): Promise<number>;
  findAllWithUsers(limit?: number, offset?: number): Promise<ShiftWithUser[]>;
  countAll(): Promise<number>;
  findAllWithUsersAndFilters(
    filters: ShiftFilters,
    limit?: number,
    offset?: number,
  ): Promise<ShiftWithUser[]>;
  countAllWithFilters(filters: ShiftFilters): Promise<number>;
}
