import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import {
  CreateUserAdminDto,
  CreateRoleAdminDto,
  CreatePermissionAdminDto,
} from '../dto/admin.dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: jest.Mocked<IUserRepository>;
  let roleRepository: jest.Mocked<IRoleRepository>;
  let permissionRepository: jest.Mocked<IPermissionRepository>;
  let authService: AuthService;

  beforeEach(async () => {
    const mockUserRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRut: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      existsByRut: jest.fn(),
      existsByEmail: jest.fn(),
    };

    const mockRoleRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      assignRoleToUser: jest.fn(),
      findUserRoles: jest.fn(),
    };

    const mockPermissionRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findByResourceAndAction: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findPermissionsByRole: jest.fn(),
    };

    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      validateToken: jest.fn(),
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
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
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get('IUserRepository');
    roleRepository = module.get('IRoleRepository');
    permissionRepository = module.get('IPermissionRepository');
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const createUserDto: CreateUserAdminDto = {
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        roleIds: ['role-1'],
      };

      const mockUser = {
        id: 'user-1',
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAuthResponse = {
        user: {
          id: 'user-1',
          rut: '12345678-9',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          roles: [],
        },
        token: 'mock-token',
      };

      const mockUserRole = {
        id: 'user-role-id',
        name: 'user',
        description: 'Regular user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCurrentUserRoles = [
        {
          id: 'user-role-id',
          name: 'user',
          description: 'Regular user',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      authService.register = jest.fn().mockResolvedValue(mockAuthResponse);
      userRepository.findById.mockResolvedValue(mockUser);
      roleRepository.findByName.mockResolvedValue(mockUserRole);
      roleRepository.findUserRoles.mockResolvedValue(mockCurrentUserRoles);
      roleRepository.assignRoleToUser.mockResolvedValue();

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(authService.register).toHaveBeenCalledWith({
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(roleRepository.findByName).toHaveBeenCalledWith('user');
      expect(roleRepository.findUserRoles).toHaveBeenCalledWith('user-1');
      // Should not assign role-1 since it's not in the current roles
      expect(roleRepository.assignRoleToUser).toHaveBeenCalledWith(
        'user-1',
        'role-1',
      );
    });

    it('should throw BadRequestException if user with RUT already exists', async () => {
      const createUserDto: CreateUserAdminDto = {
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      authService.register = jest
        .fn()
        .mockRejectedValue(
          new BadRequestException('User with this RUT already exists'),
        );

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if user with email already exists', async () => {
      const createUserDto: CreateUserAdminDto = {
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      authService.register = jest
        .fn()
        .mockRejectedValue(
          new BadRequestException('User with this email already exists'),
        );

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if default user role not found', async () => {
      const createUserDto: CreateUserAdminDto = {
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockAuthResponse = {
        user: {
          id: 'user-1',
          rut: '12345678-9',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          roles: [],
        },
        token: 'mock-token',
      };

      const mockUser = {
        id: 'user-1',
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      authService.register = jest.fn().mockResolvedValue(mockAuthResponse);
      userRepository.findById.mockResolvedValue(mockUser);
      roleRepository.findByName.mockResolvedValue(null); // User role not found

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(roleRepository.findByName).toHaveBeenCalledWith('user');
    });

    it('should not assign duplicate roles when role is already assigned', async () => {
      const createUserDto: CreateUserAdminDto = {
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        roleIds: ['user-role-id'], // This role is already assigned
      };

      const mockUser = {
        id: 'user-1',
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAuthResponse = {
        user: {
          id: 'user-1',
          rut: '12345678-9',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          roles: [],
        },
        token: 'mock-token',
      };

      const mockUserRole = {
        id: 'user-role-id',
        name: 'user',
        description: 'Regular user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCurrentUserRoles = [
        {
          id: 'user-role-id',
          name: 'user',
          description: 'Regular user',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      authService.register = jest.fn().mockResolvedValue(mockAuthResponse);
      userRepository.findById.mockResolvedValue(mockUser);
      roleRepository.findByName.mockResolvedValue(mockUserRole);
      roleRepository.findUserRoles.mockResolvedValue(mockCurrentUserRoles);
      roleRepository.assignRoleToUser.mockResolvedValue();

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(authService.register).toHaveBeenCalledWith({
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
      expect(roleRepository.findByName).toHaveBeenCalledWith('user');
      expect(roleRepository.findUserRoles).toHaveBeenCalledWith('user-1');
      // Should not call assignRoleToUser since the role is already assigned
      expect(roleRepository.assignRoleToUser).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
      const mockUser = {
        id: 'user-1',
        rut: '12345678-9',
        email: 'test@example.com',
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await service.getUserById('user-1');

      expect(result).toEqual(mockUser);
      expect(userRepository.findById).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserById('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createRole', () => {
    it('should create a role successfully', async () => {
      const createRoleDto: CreateRoleAdminDto = {
        name: 'manager',
        description: 'Manager role',
        permissionIds: ['permission-1'],
      };

      const mockRole = {
        id: 'role-1',
        name: 'manager',
        description: 'Manager role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roleRepository.findByName.mockResolvedValue(null);
      roleRepository.create.mockResolvedValue(mockRole);

      const result = await service.createRole(createRoleDto);

      expect(result).toEqual(mockRole);
      expect(roleRepository.findByName).toHaveBeenCalledWith('manager');
      expect(roleRepository.create).toHaveBeenCalledWith({
        name: 'manager',
        description: 'Manager role',
      });
    });

    it('should throw BadRequestException if role with name already exists', async () => {
      const createRoleDto: CreateRoleAdminDto = {
        name: 'manager',
        description: 'Manager role',
      };

      roleRepository.findByName.mockResolvedValue({} as any);

      await expect(service.createRole(createRoleDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createPermission', () => {
    it('should create a permission successfully', async () => {
      const createPermissionDto: CreatePermissionAdminDto = {
        name: 'read_users',
        description: 'Can read users',
        resource: 'users',
        action: 'read',
      };

      const mockPermission = {
        id: 'permission-1',
        name: 'read_users',
        description: 'Can read users',
        resource: 'users',
        action: 'read',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      permissionRepository.findByName.mockResolvedValue(null);
      permissionRepository.create.mockResolvedValue(mockPermission);

      const result = await service.createPermission(createPermissionDto);

      expect(result).toEqual(mockPermission);
      expect(permissionRepository.findByName).toHaveBeenCalledWith(
        'read_users',
      );
      expect(permissionRepository.create).toHaveBeenCalledWith({
        name: 'read_users',
        description: 'Can read users',
        resource: 'users',
        action: 'read',
      });
    });

    it('should throw BadRequestException if permission with name already exists', async () => {
      const createPermissionDto: CreatePermissionAdminDto = {
        name: 'read_users',
        description: 'Can read users',
        resource: 'users',
        action: 'read',
      };

      permissionRepository.findByName.mockResolvedValue({} as any);

      await expect(
        service.createPermission(createPermissionDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
