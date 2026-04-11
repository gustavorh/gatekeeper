import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { IShiftService } from '../../domain/services/shift.service.interface';
import { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  Shift,
  ShiftWithUser,
  ShiftStatus,
} from '../../domain/entities/shift.entity';
import { ShiftFilters } from '../../domain/repositories/shift.repository.interface';

@Injectable()
export class ShiftService implements IShiftService {
  constructor(
    @Inject('IShiftRepository')
    private readonly shiftRepository: IShiftRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async clockIn(userId: string): Promise<Shift> {
    // Validate that user exists and is active
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    // Check if user can clock in (no active or pending shifts)
    const canClockIn = await this.validateClockIn(userId);
    if (!canClockIn) {
      throw new BadRequestException('User has an active or pending shift');
    }

    // Create new shift
    const shift = await this.shiftRepository.create({
      userId,
      clockInTime: new Date(),
    });

    // Update shift status to active
    const updatedShift = await this.shiftRepository.update(shift.id, {
      status: ShiftStatus.ACTIVE,
    });

    return updatedShift;
  }

  async clockOut(userId: string): Promise<Shift> {
    // Validate that user exists and is active
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    // Check if user can clock out (has active shift)
    const canClockOut = await this.validateClockOut(userId);
    if (!canClockOut) {
      throw new BadRequestException('No active shift found to clock out');
    }

    // Find active shift
    const activeShift = await this.shiftRepository.findActiveByUserId(userId);
    if (!activeShift) {
      throw new NotFoundException('No active shift found');
    }

    // Update shift with clock out time and mark as completed
    const updatedShift = await this.shiftRepository.update(activeShift.id, {
      clockOutTime: new Date(),
      status: ShiftStatus.COMPLETED,
    });

    return updatedShift;
  }

  async getCurrentShift(userId: string): Promise<Shift | null> {
    // Validate that user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get active shift
    const activeShift = await this.shiftRepository.findActiveByUserId(userId);
    if (activeShift) {
      return activeShift;
    }

    // If no active shift, check for pending shift
    const pendingShift = await this.shiftRepository.findPendingByUserId(userId);
    return pendingShift;
  }

  async getShiftHistory(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ shifts: Shift[]; total: number }> {
    // Validate that user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get shift history without user information
    const shifts = await this.shiftRepository.findHistoryByUserIdWithoutUser(
      userId,
      limit,
      offset,
    );

    // Get total count
    const total = await this.shiftRepository.countByUserId(userId);

    return { shifts, total };
  }

  async getShiftHistoryWithFilters(
    userId: string,
    filters: ShiftFilters,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ shifts: Shift[]; total: number }> {
    // Validate that user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get shift history with filters
    const shifts = await this.shiftRepository.findHistoryByUserIdWithFilters(
      userId,
      filters,
      limit,
      offset,
    );

    // Get total count with filters
    const total = await this.shiftRepository.countByUserIdWithFilters(
      userId,
      filters,
    );

    return { shifts, total };
  }

  async getAllActiveShifts(
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ shifts: ShiftWithUser[]; total: number }> {
    // Get all active shifts with user information
    const shifts = await this.shiftRepository.findAllActiveWithUsers(
      limit,
      offset,
    );

    // Get total count of active shifts
    const total = await this.shiftRepository.countAllActive();

    return { shifts, total };
  }

  async validateClockIn(userId: string): Promise<boolean> {
    // Check for active shift
    const activeShift = await this.shiftRepository.findActiveByUserId(userId);
    if (activeShift) {
      return false;
    }

    // Check for pending shift
    const pendingShift = await this.shiftRepository.findPendingByUserId(userId);
    if (pendingShift) {
      return false;
    }

    return true;
  }

  async validateClockOut(userId: string): Promise<boolean> {
    // Check for active shift
    const activeShift = await this.shiftRepository.findActiveByUserId(userId);
    return !!activeShift;
  }

  async getAllShifts(
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ shifts: ShiftWithUser[]; total: number }> {
    // Get all shifts with user information
    const shifts = await this.shiftRepository.findAllWithUsers(limit, offset);

    // Get total count of all shifts
    const total = await this.shiftRepository.countAll();

    return { shifts, total };
  }

  async getAllShiftsWithFilters(
    filters: ShiftFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ shifts: ShiftWithUser[]; total: number }> {
    // Get all shifts with user information and filters
    const shifts = await this.shiftRepository.findAllWithUsersAndFilters(
      filters,
      limit,
      offset,
    );

    // Get total count with filters
    const total = await this.shiftRepository.countAllWithFilters(filters);

    return { shifts, total };
  }
}
