import { Injectable, Inject } from '@nestjs/common';
import { shifts, users } from '../database/schema';
import { eq, and, desc, asc, sql, gte, lte } from 'drizzle-orm';
import {
  IShiftRepository,
  ShiftFilters,
} from '../../domain/repositories/shift.repository.interface';
import {
  Shift,
  CreateShiftDto,
  UpdateShiftDto,
  ShiftWithUser,
  ShiftStatus,
} from '../../domain/entities/shift.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ShiftRepository implements IShiftRepository {
  constructor(@Inject('DATABASE') private readonly db: any) {}

  async create(createShiftDto: CreateShiftDto): Promise<Shift> {
    const shiftId = uuidv4();

    await this.db.insert(shifts).values({
      id: shiftId,
      userId: createShiftDto.userId,
      clockInTime: createShiftDto.clockInTime,
      status: ShiftStatus.PENDING,
    });

    // Get the created shift
    const [shift] = await this.db
      .select()
      .from(shifts)
      .where(eq(shifts.id, shiftId));

    return shift as Shift;
  }

  async findById(id: string): Promise<Shift | null> {
    const [shift] = await this.db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id));

    return (shift as Shift) || null;
  }

  async findByUserId(userId: string): Promise<Shift[]> {
    const results = await this.db
      .select()
      .from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.createdAt));

    return results as Shift[];
  }

  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Shift[]> {
    const results = await this.db
      .select()
      .from(shifts)
      .where(
        and(
          eq(shifts.userId, userId),
          gte(shifts.clockInTime, startDate),
          lte(shifts.clockInTime, endDate),
        ),
      )
      .orderBy(desc(shifts.clockInTime));

    return results as Shift[];
  }

  async findActiveByUserId(userId: string): Promise<Shift | null> {
    const [shift] = await this.db
      .select()
      .from(shifts)
      .where(
        and(eq(shifts.userId, userId), eq(shifts.status, ShiftStatus.ACTIVE)),
      );

    return (shift as Shift) || null;
  }

  async findPendingByUserId(userId: string): Promise<Shift | null> {
    const [shift] = await this.db
      .select()
      .from(shifts)
      .where(
        and(eq(shifts.userId, userId), eq(shifts.status, ShiftStatus.PENDING)),
      );

    return (shift as Shift) || null;
  }

  async update(id: string, updateShiftDto: UpdateShiftDto): Promise<Shift> {
    await this.db
      .update(shifts)
      .set({
        ...updateShiftDto,
        updatedAt: new Date(),
      })
      .where(eq(shifts.id, id));

    // Get the updated shift
    const [shift] = await this.db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id));

    return shift as Shift;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(shifts).where(eq(shifts.id, id));
  }

  async findWithUser(id: string): Promise<ShiftWithUser | null> {
    const [result] = await this.db
      .select({
        id: shifts.id,
        userId: shifts.userId,
        clockInTime: shifts.clockInTime,
        clockOutTime: shifts.clockOutTime,
        lunchStartTime: shifts.lunchStartTime,
        lunchEndTime: shifts.lunchEndTime,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        user: {
          id: users.id,
          rut: users.rut,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.userId, users.id))
      .where(eq(shifts.id, id));

    return (result as ShiftWithUser) || null;
  }

  async findHistoryByUserId(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<ShiftWithUser[]> {
    const results = await this.db
      .select({
        id: shifts.id,
        userId: shifts.userId,
        clockInTime: shifts.clockInTime,
        clockOutTime: shifts.clockOutTime,
        lunchStartTime: shifts.lunchStartTime,
        lunchEndTime: shifts.lunchEndTime,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        user: {
          id: users.id,
          rut: users.rut,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.userId, users.id))
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.createdAt))
      .limit(limit)
      .offset(offset);

    return results as ShiftWithUser[];
  }

  async findHistoryByUserIdWithoutUser(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Shift[]> {
    const results = await this.db
      .select({
        id: shifts.id,
        userId: shifts.userId,
        clockInTime: shifts.clockInTime,
        clockOutTime: shifts.clockOutTime,
        lunchStartTime: shifts.lunchStartTime,
        lunchEndTime: shifts.lunchEndTime,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
      })
      .from(shifts)
      .where(eq(shifts.userId, userId))
      .orderBy(desc(shifts.createdAt))
      .limit(limit)
      .offset(offset);

    return results as Shift[];
  }

  async findHistoryByUserIdWithFilters(
    userId: string,
    filters: ShiftFilters,
    limit: number = 10,
    offset: number = 0,
  ): Promise<Shift[]> {
    const conditions = [eq(shifts.userId, userId)];

    // Add date range filters
    if (filters.startDate) {
      conditions.push(gte(shifts.createdAt, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      // Add one day to include the end date
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(shifts.createdAt, endDate));
    }

    // Add status filter
    if (filters.status) {
      conditions.push(eq(shifts.status, filters.status));
    }

    const results = await this.db
      .select({
        id: shifts.id,
        userId: shifts.userId,
        clockInTime: shifts.clockInTime,
        clockOutTime: shifts.clockOutTime,
        lunchStartTime: shifts.lunchStartTime,
        lunchEndTime: shifts.lunchEndTime,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
      })
      .from(shifts)
      .where(and(...conditions))
      .orderBy(desc(shifts.createdAt))
      .limit(limit)
      .offset(offset);

    return results as Shift[];
  }

  async countByUserId(userId: string): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(shifts)
      .where(eq(shifts.userId, userId));

    return result.count;
  }

  async countByUserIdWithFilters(
    userId: string,
    filters: ShiftFilters,
  ): Promise<number> {
    const conditions = [eq(shifts.userId, userId)];

    // Add date range filters
    if (filters.startDate) {
      conditions.push(gte(shifts.createdAt, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      // Add one day to include the end date
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(shifts.createdAt, endDate));
    }

    // Add status filter
    if (filters.status) {
      conditions.push(eq(shifts.status, filters.status));
    }

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(shifts)
      .where(and(...conditions));

    return result.count;
  }

  async findAllActiveWithUsers(
    limit: number = 50,
    offset: number = 0,
  ): Promise<ShiftWithUser[]> {
    const results = await this.db
      .select({
        id: shifts.id,
        userId: shifts.userId,
        clockInTime: shifts.clockInTime,
        clockOutTime: shifts.clockOutTime,
        lunchStartTime: shifts.lunchStartTime,
        lunchEndTime: shifts.lunchEndTime,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        user: {
          id: users.id,
          rut: users.rut,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.userId, users.id))
      .where(eq(shifts.status, ShiftStatus.ACTIVE))
      .orderBy(desc(shifts.clockInTime))
      .limit(limit)
      .offset(offset);

    return results as ShiftWithUser[];
  }

  async countAllActive(): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(shifts)
      .where(eq(shifts.status, ShiftStatus.ACTIVE));

    return result.count;
  }

  async findAllWithUsers(
    limit: number = 50,
    offset: number = 0,
  ): Promise<ShiftWithUser[]> {
    const results = await this.db
      .select({
        id: shifts.id,
        userId: shifts.userId,
        clockInTime: shifts.clockInTime,
        clockOutTime: shifts.clockOutTime,
        lunchStartTime: shifts.lunchStartTime,
        lunchEndTime: shifts.lunchEndTime,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        user: {
          id: users.id,
          rut: users.rut,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.userId, users.id))
      .orderBy(desc(shifts.createdAt))
      .limit(limit)
      .offset(offset);

    return results as ShiftWithUser[];
  }

  async countAll(): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(shifts);

    return result.count;
  }

  async findAllWithUsersAndFilters(
    filters: ShiftFilters,
    limit: number = 50,
    offset: number = 0,
  ): Promise<ShiftWithUser[]> {
    const conditions: any[] = [];

    // Add date range filters
    if (filters.startDate) {
      conditions.push(gte(shifts.createdAt, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      // Add one day to include the end date
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(shifts.createdAt, endDate));
    }

    // Add status filter
    if (filters.status) {
      conditions.push(eq(shifts.status, filters.status));
    }

    const results = await this.db
      .select({
        id: shifts.id,
        userId: shifts.userId,
        clockInTime: shifts.clockInTime,
        clockOutTime: shifts.clockOutTime,
        lunchStartTime: shifts.lunchStartTime,
        lunchEndTime: shifts.lunchEndTime,
        status: shifts.status,
        createdAt: shifts.createdAt,
        updatedAt: shifts.updatedAt,
        user: {
          id: users.id,
          rut: users.rut,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(shifts)
      .innerJoin(users, eq(shifts.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(shifts.createdAt))
      .limit(limit)
      .offset(offset);

    return results as ShiftWithUser[];
  }

  async countAllWithFilters(filters: ShiftFilters): Promise<number> {
    const conditions: any[] = [];

    // Add date range filters
    if (filters.startDate) {
      conditions.push(gte(shifts.createdAt, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      // Add one day to include the end date
      const endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1);
      conditions.push(lte(shifts.createdAt, endDate));
    }

    // Add status filter
    if (filters.status) {
      conditions.push(eq(shifts.status, filters.status));
    }

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(shifts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.count;
  }
}
