import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { IShiftRepository } from '../../domain/repositories/shift.repository.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { ShiftStatus } from '../../domain/entities/shift.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let shiftRepository: jest.Mocked<IShiftRepository>;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUser = {
    id: 'user-1',
    rut: '12345678-9',
    email: 'test@example.com',
    password: 'hashedpassword',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockShifts = [
    {
      id: 'shift-1',
      userId: 'user-1',
      clockInTime: new Date('2024-01-15T08:00:00Z'),
      clockOutTime: new Date('2024-01-15T17:00:00Z'),
      lunchStartTime: new Date('2024-01-15T12:00:00Z'),
      lunchEndTime: new Date('2024-01-15T13:00:00Z'),
      status: ShiftStatus.COMPLETED,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'shift-2',
      userId: 'user-1',
      clockInTime: new Date('2024-01-16T08:00:00Z'),
      clockOutTime: new Date('2024-01-16T17:00:00Z'),
      lunchStartTime: new Date('2024-01-16T12:00:00Z'),
      lunchEndTime: new Date('2024-01-16T13:00:00Z'),
      status: ShiftStatus.COMPLETED,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: 'IShiftRepository',
          useValue: {
            findByUserIdAndDateRange: jest.fn(),
            findActiveByUserId: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: 'IUserRepository',
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    shiftRepository = module.get('IShiftRepository');
    userRepository = module.get('IUserRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWorkHoursAnalytics', () => {
    it('should calculate work hours analytics correctly', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      shiftRepository.findByUserIdAndDateRange.mockResolvedValue(mockShifts);

      const result = await service.getWorkHoursAnalytics('user-1', 'week');

      expect(result.totalWorkedHours).toBeCloseTo(18, 1); // ~9 hours per day * 2 days (excluding lunch)
      expect(result.totalLunchTime).toBe(2); // 1 hour per day * 2 days
      expect(result.daysWorked).toBe(2);
      expect(result.averageWorkedHoursPerDay).toBeCloseTo(9, 1);
      expect(result.averageLunchTimePerDay).toBe(1);
      expect(result.period).toBe('week');
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(
        service.getWorkHoursAnalytics('user-1', 'week'),
      ).rejects.toThrow('User not found');
    });
  });

  describe('startLunchBreak', () => {
    it('should start lunch break successfully', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      shiftRepository.findActiveByUserId.mockResolvedValue(mockShifts[0]);
      shiftRepository.update.mockResolvedValue({
        ...mockShifts[0],
        lunchStartTime: new Date(),
      });

      const result = await service.startLunchBreak('user-1');

      expect(shiftRepository.update).toHaveBeenCalledWith(mockShifts[0].id, {
        lunchStartTime: expect.any(Date),
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.startLunchBreak('user-1')).rejects.toThrow(
        'User not found',
      );
    });

    it('should throw NotFoundException when no active shift found', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      shiftRepository.findActiveByUserId.mockResolvedValue(null);

      await expect(service.startLunchBreak('user-1')).rejects.toThrow(
        'No active shift found',
      );
    });
  });

  describe('endLunchBreak', () => {
    it('should end lunch break successfully', async () => {
      const shiftWithLunchStart = {
        ...mockShifts[0],
        lunchStartTime: new Date('2024-01-15T12:00:00Z'),
      };

      userRepository.findById.mockResolvedValue(mockUser);
      shiftRepository.findActiveByUserId.mockResolvedValue(shiftWithLunchStart);
      shiftRepository.update.mockResolvedValue({
        ...shiftWithLunchStart,
        lunchEndTime: new Date(),
      });

      const result = await service.endLunchBreak('user-1');

      expect(shiftRepository.update).toHaveBeenCalledWith(
        shiftWithLunchStart.id,
        {
          lunchEndTime: expect.any(Date),
        },
      );
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when no lunch break started', async () => {
      const shiftWithoutLunchStart = {
        ...mockShifts[0],
        lunchStartTime: undefined,
      };

      userRepository.findById.mockResolvedValue(mockUser);
      shiftRepository.findActiveByUserId.mockResolvedValue(
        shiftWithoutLunchStart,
      );

      await expect(service.endLunchBreak('user-1')).rejects.toThrow(
        'No lunch break started',
      );
    });
  });

  describe('getCurrentWeekAnalytics', () => {
    it('should return current week analytics', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      shiftRepository.findByUserIdAndDateRange.mockResolvedValue(mockShifts);

      const result = await service.getCurrentWeekAnalytics('user-1');

      expect(result.period).toBe('week');
      expect(result.totalWorkedHours).toBeCloseTo(18, 1); // ~9 hours per day * 2 days (excluding lunch)
    });
  });

  describe('getCurrentMonthAnalytics', () => {
    it('should return current month analytics', async () => {
      userRepository.findById.mockResolvedValue(mockUser);
      shiftRepository.findByUserIdAndDateRange.mockResolvedValue(mockShifts);

      const result = await service.getCurrentMonthAnalytics('user-1');

      expect(result.period).toBe('month');
      expect(result.totalWorkedHours).toBeCloseTo(18, 1); // ~9 hours per day * 2 days (excluding lunch)
    });
  });
});
