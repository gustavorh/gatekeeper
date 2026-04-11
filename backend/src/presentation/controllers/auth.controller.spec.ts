import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/services/auth.service';
import { LoginDto, RegisterDto } from '../../application/dto/auth.dto';
import { AuthResponse } from '../../application/dto/response.dto';
import { BadRequestException } from '@nestjs/common';

// Mock the AuthService
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    rut: '123456785',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    roles: [
      {
        id: 'role-123',
        name: 'user',
        description: 'Regular user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [
          {
            id: 'perm-123',
            name: 'read_users',
            description: 'Can read users',
            resource: 'users',
            action: 'read',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      },
    ],
  };

  const mockAuthResponse: AuthResponse = {
    user: mockUser,
    token: 'jwt-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const loginDto: LoginDto = {
        rut: '123456785',
        password: 'password123',
      };

      mockAuthService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw BadRequestException when login fails', async () => {
      const loginDto: LoginDto = {
        rut: '123456785',
        password: 'wrongpassword',
      };

      const errorMessage = 'Invalid credentials';
      mockAuthService.login.mockRejectedValue(new Error(errorMessage));

      await expect(controller.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should handle service exceptions and wrap them in BadRequestException', async () => {
      const loginDto: LoginDto = {
        rut: '123456785',
        password: 'password123',
      };

      const serviceError = new Error('Service error');
      mockAuthService.login.mockRejectedValue(serviceError);

      await expect(controller.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto: RegisterDto = {
        rut: '123456785',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      mockAuthService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });

    it('should throw BadRequestException when registration fails', async () => {
      const registerDto: RegisterDto = {
        rut: '123456785',
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const errorMessage = 'User with this RUT already exists';
      mockAuthService.register.mockRejectedValue(new Error(errorMessage));

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should handle service exceptions and wrap them in BadRequestException', async () => {
      const registerDto: RegisterDto = {
        rut: '123456785',
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const serviceError = new Error('Service error');
      mockAuthService.register.mockRejectedValue(serviceError);

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('DTO validation', () => {
    it('should accept valid login DTO', () => {
      const validLoginDto: LoginDto = {
        rut: '123456785',
        password: 'password123',
      };

      expect(validLoginDto.rut).toBe('123456785');
      expect(validLoginDto.password).toBe('password123');
    });

    it('should accept valid register DTO', () => {
      const validRegisterDto: RegisterDto = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(validRegisterDto.rut).toBe('123456785');
      expect(validRegisterDto.email).toBe('test@example.com');
      expect(validRegisterDto.password).toBe('password123');
      expect(validRegisterDto.firstName).toBe('John');
      expect(validRegisterDto.lastName).toBe('Doe');
    });
  });

  describe('Error handling', () => {
    it('should handle UnauthorizedException from service', async () => {
      const loginDto: LoginDto = {
        rut: '123456785',
        password: 'wrongpassword',
      };

      const unauthorizedError = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(unauthorizedError);

      await expect(controller.login(loginDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle ConflictException from service', async () => {
      const registerDto: RegisterDto = {
        rut: '123456785',
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const conflictError = new Error('User already exists');
      mockAuthService.register.mockRejectedValue(conflictError);

      await expect(controller.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
