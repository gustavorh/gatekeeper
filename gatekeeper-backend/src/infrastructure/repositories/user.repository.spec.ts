import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
} from '../../domain/entities/user.entity';
import { mockDatabase } from '../../../test/setup';
import * as uuid from 'uuid';

describe('UserRepository', () => {
  let repository: UserRepository;
  let db: any;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    rut: '123456785',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateUserDto: CreateUserDto = {
    rut: '123456785',
    email: 'test@example.com',
    password: 'hashedPassword',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: 'DATABASE',
          useValue: mockDatabase,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    db = module.get('DATABASE');

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      (uuid.v4 as jest.Mock).mockReturnValue(userId);
      db.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await repository.create(mockCreateUserDto);

      expect(uuid.v4).toHaveBeenCalled();
      expect(db.insert).toHaveBeenCalled();
      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await repository.findById(mockUser.id);

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findById('non-existent-id');

      expect(db.select).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findByRut', () => {
    it('should find user by RUT successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await repository.findByRut(mockUser.rut);

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user with RUT is not found', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findByRut('non-existent-rut');

      expect(db.select).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await repository.findByEmail(mockUser.email);

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should return null when user with email is not found', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.findByEmail('non-existent@email.com');

      expect(db.select).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const mockUsers = [mockUser];
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue(mockUsers),
      });

      const result = await repository.findAll();

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should return empty array when no users exist', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockResolvedValue([]),
      });

      const result = await repository.findAll();

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const updatedUser = { ...mockUser, ...updateDto };

      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      });
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([updatedUser]),
        }),
      });

      const result = await repository.update(mockUser.id, updateDto);

      expect(db.update).toHaveBeenCalled();
      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await repository.delete(mockUser.id);

      expect(db.delete).toHaveBeenCalled();
    });
  });

  describe('existsByRut', () => {
    it('should return true when user with RUT exists', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await repository.existsByRut(mockUser.rut);

      expect(db.select).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when user with RUT does not exist', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.existsByRut('non-existent-rut');

      expect(db.select).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('existsByEmail', () => {
    it('should return true when user with email exists', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await repository.existsByEmail(mockUser.email);

      expect(db.select).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when user with email does not exist', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.existsByEmail('non-existent@email.com');

      expect(db.select).toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
