import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';
import { ApiResponse } from '../../application/dto/response.dto';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResponseInterceptor],
    }).compile();

    interceptor = module.get<ResponseInterceptor<any>>(ResponseInterceptor);
  });

  describe('intercept', () => {
    it('should transform successful response for user profile', () => {
      const mockData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        rut: '123456789',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/users/profile',
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of(mockData),
      } as CallHandler;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result: ApiResponse<any>) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Profile retrieved successfully');
        expect(result.data).toEqual(mockData);
        expect(result.timestamp).toBeDefined();
        expect(result.endpoint).toBe('/users/profile');
      });
    });

    it('should transform successful response for login', () => {
      const mockData = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          rut: '123456789',
          email: 'test@example.com',
        },
        token: 'jwt-token',
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/auth/login',
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of(mockData),
      } as CallHandler;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result: ApiResponse<any>) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Login successful');
        expect(result.data).toEqual(mockData);
        expect(result.timestamp).toBeDefined();
        expect(result.endpoint).toBe('/auth/login');
      });
    });

    it('should transform successful response for register', () => {
      const mockData = {
        user: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          rut: '123456789',
          email: 'test@example.com',
        },
        token: 'jwt-token',
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/auth/register',
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of(mockData),
      } as CallHandler;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result: ApiResponse<any>) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Registration successful');
        expect(result.data).toEqual(mockData);
        expect(result.timestamp).toBeDefined();
        expect(result.endpoint).toBe('/auth/register');
      });
    });

    it('should use default message for unknown endpoints', () => {
      const mockData = { someData: 'value' };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/unknown/endpoint',
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of(mockData),
      } as CallHandler;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result: ApiResponse<any>) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Operation completed successfully');
        expect(result.data).toEqual(mockData);
        expect(result.timestamp).toBeDefined();
        expect(result.endpoint).toBe('/unknown/endpoint');
      });
    });

    it('should handle different HTTP methods', () => {
      const mockData = { data: 'value' };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'PUT',
            url: '/users/123',
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of(mockData),
      } as CallHandler;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result: ApiResponse<any>) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Operation completed successfully');
        expect(result.data).toEqual(mockData);
        expect(result.timestamp).toBeDefined();
        expect(result.endpoint).toBe('/users/123');
      });
    });

    it('should handle empty response data', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'DELETE',
            url: '/users/123',
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of(null),
      } as CallHandler;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result: ApiResponse<any>) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Operation completed successfully');
        expect(result.data).toBeNull();
        expect(result.timestamp).toBeDefined();
        expect(result.endpoint).toBe('/users/123');
      });
    });

    it('should handle array response data', () => {
      const mockData = [
        { id: '1', name: 'User 1' },
        { id: '2', name: 'User 2' },
      ];

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/users',
          }),
        }),
      } as ExecutionContext;

      const mockCallHandler = {
        handle: () => of(mockData),
      } as CallHandler;

      const result$ = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result$.subscribe((result: ApiResponse<any>) => {
        expect(result.success).toBe(true);
        expect(result.message).toBe('Operation completed successfully');
        expect(result.data).toEqual(mockData);
        expect(result.timestamp).toBeDefined();
        expect(result.endpoint).toBe('/users');
      });
    });
  });

  describe('getDefaultMessage', () => {
    it('should return correct message for user profile endpoint', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/users/profile',
          }),
        }),
      } as ExecutionContext;

      const message = interceptor['getDefaultMessage'](mockExecutionContext);
      expect(message).toBe('Profile retrieved successfully');
    });

    it('should return correct message for login endpoint', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/auth/login',
          }),
        }),
      } as ExecutionContext;

      const message = interceptor['getDefaultMessage'](mockExecutionContext);
      expect(message).toBe('Login successful');
    });

    it('should return correct message for register endpoint', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'POST',
            url: '/auth/register',
          }),
        }),
      } as ExecutionContext;

      const message = interceptor['getDefaultMessage'](mockExecutionContext);
      expect(message).toBe('Registration successful');
    });

    it('should return default message for unknown endpoints', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            method: 'GET',
            url: '/unknown/endpoint',
          }),
        }),
      } as ExecutionContext;

      const message = interceptor['getDefaultMessage'](mockExecutionContext);
      expect(message).toBe('Operation completed successfully');
    });
  });
});
