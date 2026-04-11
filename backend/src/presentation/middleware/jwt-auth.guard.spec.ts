import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../../domain/entities/user.entity';

// Mock the repositories
const mockUserRepository = {
  findById: jest.fn(),
};

const mockJwtService = {
  verifyAsync: jest.fn(),
};

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
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

  const mockExecutionContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
        user: undefined,
      }),
    }),
  } as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when token is valid and user exists', async () => {
      const payload = {
        sub: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-jwt-token',
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      const contextWithoutToken = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
            user: undefined,
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithoutToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token format is invalid', async () => {
      const contextWithInvalidToken = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              authorization: 'InvalidTokenFormat',
            },
            user: undefined,
          }),
        }),
      } as ExecutionContext;

      await expect(guard.canActivate(contextWithInvalidToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-jwt-token',
      );
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload = {
        sub: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const payload = {
        sub: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
      };

      const inactiveUser = { ...mockUser, isActive: false };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockUserRepository.findById.mockResolvedValue(inactiveUser);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should set user in request when authentication succeeds', async () => {
      const payload = {
        sub: mockUser.id,
        rut: mockUser.rut,
        email: mockUser.email,
      };

      const request = {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
        user: undefined,
      };

      const context = {
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as ExecutionContext;

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(mockUser);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const request = {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      };

      const token = guard['extractTokenFromHeader'](request as any);
      expect(token).toBe('valid-jwt-token');
    });

    it('should return undefined for non-Bearer tokens', () => {
      const request = {
        headers: {
          authorization: 'Basic dXNlcjpwYXNz',
        },
      };

      const token = guard['extractTokenFromHeader'](request as any);
      expect(token).toBeUndefined();
    });

    it('should return undefined when no authorization header', () => {
      const request = {
        headers: {},
      };

      const token = guard['extractTokenFromHeader'](request as any);
      expect(token).toBeUndefined();
    });

    it('should return undefined when authorization header is undefined', () => {
      const request = {
        headers: {
          authorization: undefined,
        },
      };

      const token = guard['extractTokenFromHeader'](request as any);
      expect(token).toBeUndefined();
    });

    it('should handle malformed authorization header', () => {
      const request = {
        headers: {
          authorization: 'Bearer',
        },
      };

      const token = guard['extractTokenFromHeader'](request as any);
      expect(token).toBeUndefined();
    });
  });
});
