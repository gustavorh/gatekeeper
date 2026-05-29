import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import type { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import { CACHE_SERVICE } from '../interfaces/cache.service.interface';
import {
  CreateUserAdminDto,
  CreateRoleAdminDto,
  CreatePermissionAdminDto,
} from '../dto/admin.dto';

describe('AdminService', () => {
  let service: AdminService;
  let userRepository: jest.Mocked<IUserRepository>;
  let roleRepository: jest.Mocked<IRoleRepository>;
  let permissionRepository: jest.Mocked<IPermissionRepository>;

  const mockUser = {
    id: 'user-1',
    rut: '123456785',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDefaultRole = {
    id: 'user-role-id',
    name: 'user',
    description: 'Regular user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Mock a Drizzle transaction that executes the callback immediately
  const mockTx = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockResolvedValue([mockUser]),
  };
  const mockDb = {
    transaction: jest.fn().mockImplementation(
      async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
    ),
    // getDashboardData uses direct db.select chains
    select: jest.fn().mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue([{ count: 0 }]),
      }),
    }),
  };

  const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
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

    const mockRoleRepository: Partial<jest.Mocked<IRoleRepository>> = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      assignRoleToUser: jest.fn(),
      findUserRoles: jest.fn(),
      findUserRolesBatch: jest.fn(),
      removeRoleFromUser: jest.fn(),
      removeAllUserRoles: jest.fn(),
    };

    const mockPermissionRepository: Partial<
      jest.Mocked<IPermissionRepository>
    > = {
      create: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findPermissionsByRole: jest.fn(),
    };

    // Reset db mock between tests
    mockTx.where.mockResolvedValue([mockUser]);
    mockTx.insert.mockReturnThis();
    mockTx.values.mockReturnThis();
    mockTx.select.mockReturnThis();
    mockTx.from.mockReturnThis();
    mockDb.transaction.mockImplementation(
      async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
    );

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
          provide: CACHE_SERVICE,
          useValue: mockCache,
        },
        {
          provide: 'DATABASE',
          useValue: mockDb,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    userRepository = module.get('IUserRepository');
    roleRepository = module.get('IRoleRepository');
    permissionRepository = module.get('IPermissionRepository');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    const createUserDto: CreateUserAdminDto = {
      rut: '123456785',
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      roleIds: ['role-1'],
    };

    it('should create a user successfully', async () => {
      userRepository.findByRut.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue(mockDefaultRole);
      roleRepository.findById.mockResolvedValue({
        id: 'role-1',
        name: 'admin',
        description: 'Admin role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.createUser(createUserDto);

      expect(result).toEqual(mockUser);
      expect(userRepository.findByRut).toHaveBeenCalledWith('123456785');
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(roleRepository.findByName).toHaveBeenCalledWith('user');
      expect(mockDb.transaction).toHaveBeenCalled();
    });

    it('should throw ConflictException if user with RUT already exists', async () => {
      userRepository.findByRut.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findByRut).toHaveBeenCalledWith('123456785');
    });

    it('should throw ConflictException if user with email already exists', async () => {
      userRepository.findByRut.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if default user role not found', async () => {
      userRepository.findByRut.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue(null);

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(roleRepository.findByName).toHaveBeenCalledWith('user');
    });

    it('should throw BadRequestException if additional role ID does not exist', async () => {
      userRepository.findByRut.mockResolvedValue(null);
      userRepository.findByEmail.mockResolvedValue(null);
      roleRepository.findByName.mockResolvedValue(mockDefaultRole);
      roleRepository.findById.mockResolvedValue(null); // role-1 not found

      await expect(service.createUser(createUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getUserById', () => {
    it('should return user if found', async () => {
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
    it('should throw BadRequestException if role with name already exists', async () => {
      const createRoleDto: CreateRoleAdminDto = {
        name: 'manager',
        description: 'Manager role',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    });

    it('should throw BadRequestException if permission with name already exists', async () => {
      const createPermissionDto: CreatePermissionAdminDto = {
        name: 'read_users',
        description: 'Can read users',
        resource: 'users',
        action: 'read',
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      permissionRepository.findByName.mockResolvedValue({} as any);

      await expect(
        service.createPermission(createPermissionDto),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
