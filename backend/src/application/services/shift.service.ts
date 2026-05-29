import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { IShiftService } from '../../domain/services/shift.service.interface';
import { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  Shift,
  ShiftWithUser,
  ShiftStatus,
} from '../../domain/entities/shift.entity';
import { ShiftFilters } from '../../domain/repositories/shift.repository.interface';
import {
  SHIFT_EVENTS,
  ShiftClockedInEvent,
  ShiftClockedOutEvent,
  ShiftCompletedEvent,
} from '../../domain/events/shift.events';
import { shifts } from '../../infrastructure/database/schema';

@Injectable()
export class ShiftService implements IShiftService {
  constructor(
    @Inject('IShiftRepository')
    private readonly shiftRepository: IShiftRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject('DATABASE')
    private readonly db: MySql2Database,
  ) {}

  async clockIn(userId: string): Promise<Shift> {
    // Validate that user exists and is active (before opening transaction)
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    const updatedShift = await this.db.transaction(async (tx) => {
      // Within transaction: verify no active or pending shift exists
      const [existingActive] = await tx
        .select()
        .from(shifts)
        .where(
          and(eq(shifts.userId, userId), eq(shifts.status, ShiftStatus.ACTIVE)),
        );
      if (existingActive) {
        throw new BadRequestException('User has an active shift');
      }

      const [existingPending] = await tx
        .select()
        .from(shifts)
        .where(
          and(
            eq(shifts.userId, userId),
            eq(shifts.status, ShiftStatus.PENDING),
          ),
        );
      if (existingPending) {
        throw new BadRequestException('User has a pending shift');
      }

      // Insert new shift directly as ACTIVE (atomic create + activate)
      const shiftId = uuidv4();
      const now = new Date();
      await tx.insert(shifts).values({
        id: shiftId,
        userId,
        clockInTime: now,
        status: ShiftStatus.ACTIVE,
      });

      const [newShift] = await tx
        .select()
        .from(shifts)
        .where(eq(shifts.id, shiftId));

      return newShift as Shift;
    });

    this.eventEmitter.emit(
      SHIFT_EVENTS.CLOCKED_IN,
      new ShiftClockedInEvent(updatedShift),
    );

    return updatedShift;
  }

  async clockOut(userId: string): Promise<Shift> {
    // Validate that user exists and is active (before opening transaction)
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    const completedShift = await this.db.transaction(async (tx) => {
      // Within transaction: find the active shift
      const [activeShift] = await tx
        .select()
        .from(shifts)
        .where(
          and(eq(shifts.userId, userId), eq(shifts.status, ShiftStatus.ACTIVE)),
        );

      if (!activeShift) {
        throw new BadRequestException('No active shift found to clock out');
      }

      const clockOutTime = new Date();

      // Update shift atomically
      await tx
        .update(shifts)
        .set({
          clockOutTime,
          status: ShiftStatus.COMPLETED,
          updatedAt: clockOutTime,
        })
        .where(eq(shifts.id, activeShift.id));

      const [updatedShift] = await tx
        .select()
        .from(shifts)
        .where(eq(shifts.id, activeShift.id));

      return updatedShift as Shift;
    });

    this.eventEmitter.emit(
      SHIFT_EVENTS.CLOCKED_OUT,
      new ShiftClockedOutEvent(completedShift),
    );
    this.eventEmitter.emit(
      SHIFT_EVENTS.COMPLETED,
      new ShiftCompletedEvent(completedShift),
    );

    return completedShift;
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
