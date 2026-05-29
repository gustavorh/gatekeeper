import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ShiftService } from './shift.service';
import type { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { ShiftStatus } from '../../domain/entities/shift.entity';
import type { Shift } from '../../domain/entities/shift.entity';
import { SHIFT_EVENTS } from '../../domain/events/shift.events';

/**
 * The transaction callback in clockIn / clockOut executes Drizzle builder chains
 * directly (tx.select().from().where()) rather than delegating to IShiftRepository.
 * We model this by making tx.where() return the appropriate fixture per test,
 * and tx.insert().values() / tx.update().set().where() resolve without values.
 *
 * A fresh mockTx is created inside beforeEach to avoid cross-test state pollution.
 */

const makeShift = (overrides: Partial<Shift> = {}): Shift => ({
  id: 'shift-1',
  userId: 'user-1',
  clockInTime: new Date('2026-01-01T09:00:00Z'),
  status: ShiftStatus.ACTIVE,
  createdAt: new Date('2026-01-01T09:00:00Z'),
  updatedAt: new Date('2026-01-01T09:00:00Z'),
  ...overrides,
});

const makeUser = (overrides = {}) => ({
  id: 'user-1',
  rut: '123456785',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('ShiftService', () => {
  let service: ShiftService;
  let shiftRepository: jest.Mocked<IShiftRepository>;
  let userRepository: jest.Mocked<IUserRepository>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  // mockTx is rebuilt each test; clockIn/clockOut logic uses tx.select().from().where()
  // We control what .where() resolves to from within each test.
  let mockTx: {
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    insert: jest.Mock;
    values: jest.Mock;
    update: jest.Mock;
    set: jest.Mock;
  };

  let mockDb: {
    transaction: jest.Mock;
  };

  beforeEach(async () => {
    // Rebuild tx mock so individual tests can override .where resolution freely.
    mockTx = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue([]),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    mockDb = {
      transaction: jest.fn().mockImplementation(
        async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
      ),
    };

    const mockShiftRepository: Partial<jest.Mocked<IShiftRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByUserIdAndDateRange: jest.fn(),
      findActiveByUserId: jest.fn(),
      findPendingByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findWithUser: jest.fn(),
      findHistoryByUserId: jest.fn(),
      findHistoryByUserIdWithoutUser: jest.fn(),
      findHistoryByUserIdWithFilters: jest.fn(),
      countByUserId: jest.fn(),
      countByUserIdWithFilters: jest.fn(),
      findAllActiveWithUsers: jest.fn(),
      countAllActive: jest.fn(),
      findAllWithUsers: jest.fn(),
      countAll: jest.fn(),
      findAllWithUsersAndFilters: jest.fn(),
      countAllWithFilters: jest.fn(),
    };

    const mockUserRepository: Partial<jest.Mocked<IUserRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRut: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByRutWithPassword: jest.fn(),
      findAll: jest.fn(),
      findAllRaw: jest.fn(),
      findByIdWithRolesAndPermissions: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByRut: jest.fn(),
      existsByEmail: jest.fn(),
    };

    const mockEventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftService,
        {
          provide: 'IShiftRepository',
          useValue: mockShiftRepository,
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: EventEmitter2,
          useValue: mockEventEmitter,
        },
        {
          provide: 'DATABASE',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<ShiftService>(ShiftService);
    shiftRepository = module.get('IShiftRepository');
    userRepository = module.get('IUserRepository');
    eventEmitter = module.get(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── clockIn ────────────────────────────────────────────────────────────────

  describe('clockIn', () => {
    it('debería crear un turno ACTIVE cuando el usuario existe y no tiene turno activo ni pendiente', async () => {
      // Arrange
      const activeShift = makeShift();
      userRepository.findById.mockResolvedValue(makeUser());

      // First .where() call → no active shift; second .where() call → no pending shift;
      // third .where() call → returns the newly inserted shift.
      mockTx.where
        .mockResolvedValueOnce([]) // no existing ACTIVE
        .mockResolvedValueOnce([]) // no existing PENDING
        .mockResolvedValueOnce([activeShift]); // SELECT after INSERT

      // Act
      const result = await service.clockIn('user-1');

      // Assert
      expect(result).toEqual(activeShift);
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockDb.transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.insert).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SHIFT_EVENTS.CLOCKED_IN,
        expect.objectContaining({ shift: activeShift }),
      );
    });

    it('debería lanzar BadRequestException cuando el usuario ya tiene un turno ACTIVE', async () => {
      // Arrange
      const existingActive = makeShift({ status: ShiftStatus.ACTIVE });
      userRepository.findById.mockResolvedValue(makeUser());

      // First .where() resolves with an existing active shift → triggers guard.
      mockTx.where.mockResolvedValueOnce([existingActive]);

      // Act & Assert — single call; jest matches both class and message
      await expect(service.clockIn('user-1')).rejects.toThrow(
        new BadRequestException('User has an active shift'),
      );
    });

    it('debería lanzar BadRequestException cuando el usuario ya tiene un turno PENDING', async () => {
      // Arrange
      const existingPending = makeShift({ status: ShiftStatus.PENDING });
      userRepository.findById.mockResolvedValue(makeUser());

      // First .where() → no active; second .where() → has pending.
      mockTx.where
        .mockResolvedValueOnce([]) // no ACTIVE
        .mockResolvedValueOnce([existingPending]); // PENDING exists

      // Act & Assert — single call
      await expect(service.clockIn('user-1')).rejects.toThrow(
        new BadRequestException('User has a pending shift'),
      );
    });

    it('debería lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.clockIn('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException cuando el usuario existe pero está inactivo', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(makeUser({ isActive: false }));

      // Act & Assert
      await expect(service.clockIn('user-1')).rejects.toThrow(NotFoundException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('debería emitir el evento CLOCKED_IN con el turno creado', async () => {
      // Arrange
      const newShift = makeShift();
      userRepository.findById.mockResolvedValue(makeUser());
      mockTx.where
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([newShift]);

      // Act
      await service.clockIn('user-1');

      // Assert
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SHIFT_EVENTS.CLOCKED_IN,
        expect.objectContaining({ shift: newShift }),
      );
    });
  });

  // ─── clockOut ───────────────────────────────────────────────────────────────

  describe('clockOut', () => {
    it('debería actualizar el turno ACTIVE a COMPLETED con clockOutTime cuando existe un turno activo', async () => {
      // Arrange
      const clockInTime = new Date('2026-01-01T09:00:00Z');
      const clockOutTime = new Date('2026-01-01T17:00:00Z');
      const activeShift = makeShift({ clockInTime });
      const completedShift = makeShift({
        clockInTime,
        clockOutTime,
        status: ShiftStatus.COMPLETED,
      });

      userRepository.findById.mockResolvedValue(makeUser());

      // .where() is called three times inside the clockOut transaction:
      //   1. SELECT ... WHERE userId + status=ACTIVE  → finds the active shift
      //   2. UPDATE ... WHERE id = activeShift.id     → performs the update (result not read)
      //   3. SELECT ... WHERE id = activeShift.id     → returns the completed shift
      mockTx.where
        .mockResolvedValueOnce([activeShift])  // 1 — find ACTIVE
        .mockResolvedValueOnce(undefined)      // 2 — UPDATE .where (result discarded)
        .mockResolvedValueOnce([completedShift]); // 3 — SELECT after UPDATE

      // Act
      const result = await service.clockOut('user-1');

      // Assert
      expect(result.status).toBe(ShiftStatus.COMPLETED);
      expect(result.clockOutTime).toEqual(clockOutTime);
      expect(mockTx.update).toHaveBeenCalled();
      expect(mockTx.set).toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException cuando no hay turno ACTIVE para el usuario', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(makeUser());
      mockTx.where.mockResolvedValueOnce([]); // no active shift

      // Act & Assert
      await expect(service.clockOut('user-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.clockOut('user-1')).rejects.toThrow(
        'No active shift found to clock out',
      );
    });

    it('debería lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.clockOut('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException cuando el usuario está inactivo', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(makeUser({ isActive: false }));

      // Act & Assert
      await expect(service.clockOut('user-1')).rejects.toThrow(NotFoundException);
      expect(mockDb.transaction).not.toHaveBeenCalled();
    });

    it('debería emitir los eventos CLOCKED_OUT y COMPLETED al completar un turno', async () => {
      // Arrange
      const activeShift = makeShift();
      const completedShift = makeShift({
        status: ShiftStatus.COMPLETED,
        clockOutTime: new Date(),
      });

      userRepository.findById.mockResolvedValue(makeUser());
      // Three .where() calls: SELECT active, UPDATE set, SELECT completed
      mockTx.where
        .mockResolvedValueOnce([activeShift])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([completedShift]);

      // Act
      await service.clockOut('user-1');

      // Assert — two events emitted
      expect(eventEmitter.emit).toHaveBeenCalledTimes(2);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SHIFT_EVENTS.CLOCKED_OUT,
        expect.objectContaining({ shift: completedShift }),
      );
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        SHIFT_EVENTS.COMPLETED,
        expect.objectContaining({ shift: completedShift }),
      );
    });

    it('edge case: clockOut inmediatamente después de clockIn (duración 0 minutos) no debe lanzar error', async () => {
      // Arrange — clockIn and clockOut are the same timestamp
      const now = new Date();
      const activeShift = makeShift({ clockInTime: now });
      const completedShift = makeShift({
        clockInTime: now,
        clockOutTime: now,
        status: ShiftStatus.COMPLETED,
      });

      userRepository.findById.mockResolvedValue(makeUser());
      // Three .where() calls: SELECT active, UPDATE set, SELECT completed
      mockTx.where
        .mockResolvedValueOnce([activeShift])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce([completedShift]);

      // Act
      const result = await service.clockOut('user-1');

      // Assert — service completes without error even at 0-minute duration
      expect(result.status).toBe(ShiftStatus.COMPLETED);
      expect(result.clockOutTime).toEqual(now);
    });
  });

  // ─── getCurrentShift ────────────────────────────────────────────────────────

  describe('getCurrentShift', () => {
    it('debería retornar el turno ACTIVE cuando el usuario tiene uno', async () => {
      // Arrange
      const activeShift = makeShift({ status: ShiftStatus.ACTIVE });
      userRepository.findById.mockResolvedValue(makeUser());
      shiftRepository.findActiveByUserId.mockResolvedValue(activeShift);

      // Act
      const result = await service.getCurrentShift('user-1');

      // Assert
      expect(result).toEqual(activeShift);
      expect(shiftRepository.findActiveByUserId).toHaveBeenCalledWith('user-1');
      // Should not check pending if active was found
      expect(shiftRepository.findPendingByUserId).not.toHaveBeenCalled();
    });

    it('debería retornar el turno PENDING cuando no hay ACTIVE pero sí hay pendiente', async () => {
      // Arrange
      const pendingShift = makeShift({ status: ShiftStatus.PENDING });
      userRepository.findById.mockResolvedValue(makeUser());
      shiftRepository.findActiveByUserId.mockResolvedValue(null);
      shiftRepository.findPendingByUserId.mockResolvedValue(pendingShift);

      // Act
      const result = await service.getCurrentShift('user-1');

      // Assert
      expect(result).toEqual(pendingShift);
      expect(shiftRepository.findPendingByUserId).toHaveBeenCalledWith('user-1');
    });

    it('debería retornar null cuando el usuario no tiene turno activo ni pendiente', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(makeUser());
      shiftRepository.findActiveByUserId.mockResolvedValue(null);
      shiftRepository.findPendingByUserId.mockResolvedValue(null);

      // Act
      const result = await service.getCurrentShift('user-1');

      // Assert
      expect(result).toBeNull();
    });

    it('debería lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getCurrentShift('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(shiftRepository.findActiveByUserId).not.toHaveBeenCalled();
    });
  });

  // ─── getShiftHistory ────────────────────────────────────────────────────────

  describe('getShiftHistory', () => {
    it('debería retornar el historial de turnos completados para el usuario', async () => {
      // Arrange
      const completedShifts = [
        makeShift({
          id: 'shift-1',
          status: ShiftStatus.COMPLETED,
          clockOutTime: new Date(),
        }),
        makeShift({
          id: 'shift-2',
          status: ShiftStatus.COMPLETED,
          clockOutTime: new Date(),
        }),
      ];
      userRepository.findById.mockResolvedValue(makeUser());
      shiftRepository.findHistoryByUserIdWithoutUser.mockResolvedValue(
        completedShifts,
      );
      shiftRepository.countByUserId.mockResolvedValue(2);

      // Act
      const result = await service.getShiftHistory('user-1');

      // Assert
      expect(result.shifts).toEqual(completedShifts);
      expect(result.total).toBe(2);
      expect(shiftRepository.findHistoryByUserIdWithoutUser).toHaveBeenCalledWith(
        'user-1',
        10,
        0,
      );
    });

    it('debería respetar los parámetros de paginación limit y offset', async () => {
      // Arrange
      const page2Shifts = [
        makeShift({ id: 'shift-6', status: ShiftStatus.COMPLETED }),
      ];
      userRepository.findById.mockResolvedValue(makeUser());
      shiftRepository.findHistoryByUserIdWithoutUser.mockResolvedValue(
        page2Shifts,
      );
      shiftRepository.countByUserId.mockResolvedValue(10);

      // Act
      const result = await service.getShiftHistory('user-1', 5, 5);

      // Assert
      expect(
        shiftRepository.findHistoryByUserIdWithoutUser,
      ).toHaveBeenCalledWith('user-1', 5, 5);
      expect(result.total).toBe(10);
      expect(result.shifts).toHaveLength(1);
    });

    it('debería retornar un arreglo vacío cuando el usuario no tiene historial', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(makeUser());
      shiftRepository.findHistoryByUserIdWithoutUser.mockResolvedValue([]);
      shiftRepository.countByUserId.mockResolvedValue(0);

      // Act
      const result = await service.getShiftHistory('user-1');

      // Assert
      expect(result.shifts).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('debería lanzar NotFoundException cuando el usuario no existe', async () => {
      // Arrange
      userRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getShiftHistory('non-existent')).rejects.toThrow(
        NotFoundException,
      );
      expect(shiftRepository.findHistoryByUserIdWithoutUser).not.toHaveBeenCalled();
    });
  });

  // ─── validateClockIn ────────────────────────────────────────────────────────

  describe('validateClockIn', () => {
    it('debería retornar true cuando el usuario no tiene turno activo ni pendiente', async () => {
      shiftRepository.findActiveByUserId.mockResolvedValue(null);
      shiftRepository.findPendingByUserId.mockResolvedValue(null);

      const result = await service.validateClockIn('user-1');

      expect(result).toBe(true);
    });

    it('debería retornar false cuando el usuario tiene un turno ACTIVE', async () => {
      shiftRepository.findActiveByUserId.mockResolvedValue(makeShift());

      const result = await service.validateClockIn('user-1');

      expect(result).toBe(false);
      expect(shiftRepository.findPendingByUserId).not.toHaveBeenCalled();
    });

    it('debería retornar false cuando el usuario tiene un turno PENDING', async () => {
      shiftRepository.findActiveByUserId.mockResolvedValue(null);
      shiftRepository.findPendingByUserId.mockResolvedValue(
        makeShift({ status: ShiftStatus.PENDING }),
      );

      const result = await service.validateClockIn('user-1');

      expect(result).toBe(false);
    });
  });

  // ─── validateClockOut ───────────────────────────────────────────────────────

  describe('validateClockOut', () => {
    it('debería retornar true cuando el usuario tiene un turno ACTIVE', async () => {
      shiftRepository.findActiveByUserId.mockResolvedValue(makeShift());

      const result = await service.validateClockOut('user-1');

      expect(result).toBe(true);
    });

    it('debería retornar false cuando el usuario no tiene turno ACTIVE', async () => {
      shiftRepository.findActiveByUserId.mockResolvedValue(null);

      const result = await service.validateClockOut('user-1');

      expect(result).toBe(false);
    });
  });
});
