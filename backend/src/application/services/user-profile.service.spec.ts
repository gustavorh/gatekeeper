import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileService } from './user-profile.service';
import type { User } from '../../domain/entities/user.entity';
import type { Role } from '../../domain/entities/role.entity';
import type { Permission } from '../../domain/entities/permission.entity';
import type { UserWithRolesResponse } from '../dto/response.dto';
import { CACHE_SERVICE } from '../interfaces/cache.service.interface';

// Shared fixtures
const createdAt = new Date('2024-01-01');
const updatedAt = new Date('2024-01-02');

const mockUser: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  rut: '123456785',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  createdAt,
  updatedAt,
};

const mockRole: Role = {
  id: 'role-123',
  name: 'user',
  description: 'Regular user',
  isActive: true,
  createdAt,
  updatedAt,
};

const mockPermission: Permission = {
  id: 'perm-123',
  name: 'read_users',
  description: 'Can read users',
  resource: 'users',
  action: 'read',
  isActive: true,
  createdAt,
  updatedAt,
};

// IUserRepository mock — only the methods used by UserProfileService
const mockUserRepository = {
  findById: jest.fn(),
  findByIdWithRolesAndPermissions: jest.fn(),
  update: jest.fn(),
  existsByEmail: jest.fn(),
};

// ICacheService mock
const mockCacheService = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};

describe('UserProfileService', () => {
  let service: UserProfileService;

  const buildJoinResult = (roles: typeof mockRole[] = [mockRole]) => ({
    user: mockUser,
    roles: roles.map((role) => ({
      ...role,
      permissions: [mockPermission],
    })),
  });

  const expectedResponse = (
    roles: typeof mockRole[] = [mockRole],
  ): UserWithRolesResponse => ({
    id: mockUser.id,
    rut: mockUser.rut,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    isActive: mockUser.isActive,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: [
        {
          id: mockPermission.id,
          name: mockPermission.name,
          description: mockPermission.description,
          resource: mockPermission.resource,
          action: mockPermission.action,
          isActive: mockPermission.isActive,
          createdAt: mockPermission.createdAt,
          updatedAt: mockPermission.updatedAt,
        },
      ],
    })),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: CACHE_SERVICE,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);
    jest.clearAllMocks();
  });

  describe('getUserWithRoles', () => {
    it('should return cached response when cache hit', async () => {
      const userId = mockUser.id;
      const cached = expectedResponse();
      mockCacheService.get.mockResolvedValue(cached);

      const result = await service.getUserWithRoles(userId);

      expect(mockCacheService.get).toHaveBeenCalledWith(
        `user:${userId}:withRoles`,
      );
      expect(mockUserRepository.findByIdWithRolesAndPermissions).not.toHaveBeenCalled();
      expect(result).toEqual(cached);
    });

    it('should query DB on cache miss and populate cache', async () => {
      const userId = mockUser.id;
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.findByIdWithRolesAndPermissions.mockResolvedValue(
        buildJoinResult(),
      );
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getUserWithRoles(userId);

      expect(mockUserRepository.findByIdWithRolesAndPermissions).toHaveBeenCalledWith(
        userId,
      );
      expect(mockCacheService.set).toHaveBeenCalledWith(
        `user:${userId}:withRoles`,
        expect.objectContaining({ id: userId }),
        expect.any(Number),
      );
      expect(result).toEqual(expectedResponse());
    });

    it('should return null when user does not exist', async () => {
      const userId = 'non-existent-user-id';
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.findByIdWithRolesAndPermissions.mockResolvedValue(null);

      const result = await service.getUserWithRoles(userId);

      expect(result).toBeNull();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should return user with empty roles when user has no roles', async () => {
      const userId = mockUser.id;
      mockCacheService.get.mockResolvedValue(null);
      mockUserRepository.findByIdWithRolesAndPermissions.mockResolvedValue({
        user: mockUser,
        roles: [],
      });
      mockCacheService.set.mockResolvedValue(undefined);

      const result = await service.getUserWithRoles(userId);

      expect(result).toEqual({
        ...expectedResponse([]),
        roles: [],
      });
    });
  });

  describe('invalidateUserCache', () => {
    it('should call cache.del with the correct key', async () => {
      const userId = mockUser.id;
      mockCacheService.del.mockResolvedValue(undefined);

      await service.invalidateUserCache(userId);

      expect(mockCacheService.del).toHaveBeenCalledWith(
        `user:${userId}:withRoles`,
      );
    });
  });
});
