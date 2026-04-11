import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserProfileService } from './user-profile.service';
import { User } from '../../domain/entities/user.entity';
import { Role } from '../../domain/entities/role.entity';
import { Permission } from '../../domain/entities/permission.entity';
import { AuthResponse } from '../dto/response.dto';
import { mockDatabase, mockJwtService, mockUuid } from '../../../test/setup';
import * as bcrypt from 'bcryptjs';

// Mock the repositories
const mockUserRepository = {
  findByRut: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
};

const mockRoleRepository = {
  findByName: jest.fn(),
  assignRoleToUser: jest.fn(),
};

const mockUserProfileService = {
  getUserWithRoles: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

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

  const mockUserWithRoles = {
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
        ...mockRole,
        permissions: [mockPermission],
      },
    ],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
        {
          provide: 'IRoleRepository',
          useValue: mockRoleRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserProfileService,
          useValue: mockUserProfileService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login a user with valid credentials', async () => {
      const loginDto = {
        rut: '123456785',
        password: 'password123',
      };

      mockUserRepository.findByRut.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockUserProfileService.getUserWithRoles.mockResolvedValue(
        mockUserWithRoles,
      );

      const result = await service.login(loginDto);

      expect(mockUserRepository.findByRut).toHaveBeenCalledWith('123456785');
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'password123',
        'hashedPassword',
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
      });
      expect(mockUserProfileService.getUserWithRoles).toHaveBeenCalledWith(
        mockUser.id,
      );

      expect(result).toEqual({
        user: mockUserWithRoles,
        token: 'jwt-token',
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      const loginDto = {
        rut: '123456785',
        password: 'password123',
      };

      mockUserRepository.findByRut.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findByRut).toHaveBeenCalledWith('123456785');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const loginDto = {
        rut: '123456785',
        password: 'password123',
      };

      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepository.findByRut.mockResolvedValue(inactiveUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto = {
        rut: '123456785',
        password: 'wrongpassword',
      };

      mockUserRepository.findByRut.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrongpassword',
        'hashedPassword',
      );
    });

    it('should throw UnauthorizedException when user profile is not found', async () => {
      const loginDto = {
        rut: '123456785',
        password: 'password123',
      };

      mockUserRepository.findByRut.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockUserProfileService.getUserWithRoles.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        rut: '123456785',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const newUser = { ...mockUser, ...registerDto };

      mockUserRepository.findByRut.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockUserRepository.create.mockResolvedValue(newUser);
      mockRoleRepository.findByName.mockResolvedValue(mockRole);
      mockRoleRepository.assignRoleToUser.mockResolvedValue(undefined);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockUserProfileService.getUserWithRoles.mockResolvedValue(
        mockUserWithRoles,
      );

      const result = await service.register(registerDto);

      expect(mockUserRepository.findByRut).toHaveBeenCalledWith('123456785');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'newuser@example.com',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...registerDto,
        password: 'hashedPassword',
      });
      expect(mockRoleRepository.findByName).toHaveBeenCalledWith('user');
      expect(mockRoleRepository.assignRoleToUser).toHaveBeenCalledWith(
        newUser.id,
        mockRole.id,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: newUser.id,
        rut: newUser.rut,
        email: newUser.email,
      });

      expect(result).toEqual({
        user: mockUserWithRoles,
        token: 'jwt-token',
      });
    });

    it('should throw ConflictException when user with RUT already exists', async () => {
      const registerDto = {
        rut: '123456785',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockUserRepository.findByRut.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findByRut).toHaveBeenCalledWith('123456785');
    });

    it('should throw ConflictException when user with email already exists', async () => {
      const registerDto = {
        rut: '123456785',
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockUserRepository.findByRut.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(
        'existing@example.com',
      );
    });
  });

  describe('validateToken', () => {
    it('should return user when token is valid', async () => {
      const token = 'valid-jwt-token';
      const payload = {
        sub: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await service.validateToken(token);

      expect(mockJwtService.verify).toHaveBeenCalledWith(token);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({
        id: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        isActive: mockUser.isActive,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return null when token is invalid', async () => {
      const token = 'invalid-jwt-token';

      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateToken(token);

      expect(result).toBeNull();
    });

    it('should return null when user is not found', async () => {
      const token = 'valid-jwt-token';
      const payload = {
        sub: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await service.validateToken(token);

      expect(result).toBeNull();
    });

    it('should return null when user is inactive', async () => {
      const token = 'valid-jwt-token';
      const payload = {
        sub: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
      };
      const inactiveUser = { ...mockUser, isActive: false };

      mockJwtService.verify.mockReturnValue(payload);
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      const result = await service.validateToken(token);

      expect(result).toBeNull();
    });
  });

  describe('password methods', () => {
    it('should hash password correctly', async () => {
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await service.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should compare password correctly', async () => {
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.comparePassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });
  });
});
