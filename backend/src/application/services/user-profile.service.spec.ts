import { Test, TestingModule } from '@nestjs/testing';
import { UserProfileService } from './user-profile.service';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/entities/role.entity';
import { Permission } from '../../domain/entities/permission.entity';
import { UserWithRolesResponse } from '../dto/response.dto';

// Mock the repositories
const mockUserRepository = {
  findById: jest.fn(),
};

const mockRoleRepository = {
  findUserRoles: jest.fn(),
};

const mockPermissionRepository = {
  findPermissionsByRole: jest.fn(),
};

describe('UserProfileService', () => {
  let service: UserProfileService;

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

  const mockRole: Role = {
    id: 'role-123',
    name: 'user',
    description: 'Regular user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPermission: Permission = {
    id: 'perm-123',
    name: 'read_users',
    description: 'Can read users',
    resource: 'users',
    action: 'read',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithRoles: UserWithRolesResponse = {
    id: mockUser.id,
    rut: mockUser.rut,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    isActive: mockUser.isActive,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
    roles: [
      {
        id: mockRole.id,
        name: mockRole.name,
        description: mockRole.description,
        isActive: mockRole.isActive,
        createdAt: mockRole.createdAt,
        updatedAt: mockRole.updatedAt,
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
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProfileService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IRoleRepository',
          useValue: mockRoleRepository,
        },
        {
          provide: 'IPermissionRepository',
          useValue: mockPermissionRepository,
        },
      ],
    }).compile();

    service = module.get<UserProfileService>(UserProfileService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('getUserWithRoles', () => {
    it('should return user with roles and permissions when user exists', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findUserRoles.mockResolvedValue([mockRole]);
      mockPermissionRepository.findPermissionsByRole.mockResolvedValue([
        mockPermission,
      ]);

      const result = await service.getUserWithRoles(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRoleRepository.findUserRoles).toHaveBeenCalledWith(userId);
      expect(
        mockPermissionRepository.findPermissionsByRole,
      ).toHaveBeenCalledWith(mockRole.id);

      expect(result).toEqual(mockUserWithRoles);
    });

    it('should return null when user does not exist', async () => {
      const userId = 'non-existent-user-id';

      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.getUserWithRoles(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRoleRepository.findUserRoles).not.toHaveBeenCalled();
      expect(
        mockPermissionRepository.findPermissionsByRole,
      ).not.toHaveBeenCalled();

      expect(result).toBeNull();
    });

    it('should return user with empty roles when user has no roles', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findUserRoles.mockResolvedValue([]);

      const result = await service.getUserWithRoles(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRoleRepository.findUserRoles).toHaveBeenCalledWith(userId);
      expect(
        mockPermissionRepository.findPermissionsByRole,
      ).not.toHaveBeenCalled();

      expect(result).toEqual({
        id: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        roles: [],
      });
    });

    it('should return user with roles but no permissions when role has no permissions', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findUserRoles.mockResolvedValue([mockRole]);
      mockPermissionRepository.findPermissionsByRole.mockResolvedValue([]);

      const result = await service.getUserWithRoles(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRoleRepository.findUserRoles).toHaveBeenCalledWith(userId);
      expect(
        mockPermissionRepository.findPermissionsByRole,
      ).toHaveBeenCalledWith(mockRole.id);

      expect(result).toEqual({
        id: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        roles: [
          {
            id: mockRole.id,
            name: mockRole.name,
            description: mockRole.description,
            isActive: mockRole.isActive,
            createdAt: mockRole.createdAt,
            updatedAt: mockRole.updatedAt,
            permissions: [],
          },
        ],
      });
    });

    it('should handle multiple roles with their respective permissions', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const secondRole: Role = {
        id: 'role-456',
        name: 'admin',
        description: 'Administrator',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const secondPermission: Permission = {
        id: 'perm-456',
        name: 'write_users',
        description: 'Can write users',
        resource: 'users',
        action: 'write',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findUserRoles.mockResolvedValue([
        mockRole,
        secondRole,
      ]);
      mockPermissionRepository.findPermissionsByRole
        .mockResolvedValueOnce([mockPermission]) // First role permissions
        .mockResolvedValueOnce([secondPermission]); // Second role permissions

      const result = await service.getUserWithRoles(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockRoleRepository.findUserRoles).toHaveBeenCalledWith(userId);
      expect(
        mockPermissionRepository.findPermissionsByRole,
      ).toHaveBeenCalledWith(mockRole.id);
      expect(
        mockPermissionRepository.findPermissionsByRole,
      ).toHaveBeenCalledWith(secondRole.id);

      expect(result).toEqual({
        id: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        roles: [
          {
            id: mockRole.id,
            name: mockRole.name,
            description: mockRole.description,
            isActive: mockRole.isActive,
            createdAt: mockRole.createdAt,
            updatedAt: mockRole.updatedAt,
            permissions: [mockPermission],
          },
          {
            id: secondRole.id,
            name: secondRole.name,
            description: secondRole.description,
            isActive: secondRole.isActive,
            createdAt: secondRole.createdAt,
            updatedAt: secondRole.updatedAt,
            permissions: [secondPermission],
          },
        ],
      });
    });
  });
});
