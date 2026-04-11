import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { Response, Request } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  describe('catch', () => {
    it('should handle HttpException with object response', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const mockRequest = {
        url: '/auth/login',
      } as any;

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as ArgumentsHost;

      const httpException = new HttpException(
        {
          message: 'Invalid credentials',
          error: 'Unauthorized',
        },
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(httpException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
        error: 'Unauthorized',
        timestamp: expect.any(String),
        path: '/auth/login',
        details: null,
      });
    });

    it('should handle HttpException with string response', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const mockRequest = {
        url: '/auth/login',
      } as any;

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as ArgumentsHost;

      const httpException = new HttpException(
        'Invalid credentials',
        HttpStatus.UNAUTHORIZED,
      );

      filter.catch(httpException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid credentials',
        error: 'Unauthorized',
        timestamp: expect.any(String),
        path: '/auth/login',
        details: null,
      });
    });

    it('should handle non-HttpException errors', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const mockRequest = {
        url: '/auth/login',
      } as any;

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as ArgumentsHost;

      const error = new Error('Database connection failed');

      filter.catch(error, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        error: 'InternalServerError',
        timestamp: expect.any(String),
        path: '/auth/login',
        details: null,
      });
    });

    it('should handle different HTTP status codes', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const mockRequest = {
        url: '/users/123',
      } as any;

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as ArgumentsHost;

      const testCases = [
        { status: HttpStatus.BAD_REQUEST, error: 'BadRequest' },
        { status: HttpStatus.NOT_FOUND, error: 'NotFound' },
        { status: HttpStatus.CONFLICT, error: 'Conflict' },
        {
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          error: 'UnprocessableEntity',
        },
        { status: HttpStatus.FORBIDDEN, error: 'Forbidden' },
      ];

      testCases.forEach(({ status, error }) => {
        const httpException = new HttpException('Test error', status);
        filter.catch(httpException, mockHost);

        expect(mockResponse.status).toHaveBeenCalledWith(status);
        expect(mockResponse.json).toHaveBeenCalledWith({
          success: false,
          message: 'Test error',
          error,
          timestamp: expect.any(String),
          path: '/users/123',
          details: null,
        });
      });
    });

    it('should handle unknown status codes', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const mockRequest = {
        url: '/test',
      } as any;

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as ArgumentsHost;

      const httpException = new HttpException('Test error', 999);

      filter.catch(httpException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(999);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Test error',
        error: 'InternalServerError',
        timestamp: expect.any(String),
        path: '/test',
        details: null,
      });
    });

    it('should include details when provided in exception response', () => {
      const mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as any;

      const mockRequest = {
        url: '/auth/register',
      } as any;

      const mockHost = {
        switchToHttp: () => ({
          getResponse: () => mockResponse,
          getRequest: () => mockRequest,
        }),
      } as ArgumentsHost;

      const httpException = new HttpException(
        {
          message: 'Validation failed',
          error: 'BadRequest',
          details: {
            rut: 'Invalid RUT format',
            email: 'Invalid email format',
          },
        },
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(httpException, mockHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        error: 'BadRequest',
        timestamp: expect.any(String),
        path: '/auth/register',
        details: {
          rut: 'Invalid RUT format',
          email: 'Invalid email format',
        },
      });
    });
  });

  describe('getErrorType', () => {
    it('should return correct error types for known status codes', () => {
      const errorMap = {
        400: 'BadRequest',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'NotFound',
        409: 'Conflict',
        422: 'UnprocessableEntity',
        500: 'InternalServerError',
      };

      Object.entries(errorMap).forEach(([status, expectedError]) => {
        const result = filter['getErrorType'](parseInt(status));
        expect(result).toBe(expectedError);
      });
    });

    it('should return InternalServerError for unknown status codes', () => {
      expect(filter['getErrorType'](999)).toBe('InternalServerError');
      expect(filter['getErrorType'](0)).toBe('InternalServerError');
      expect(filter['getErrorType'](-1)).toBe('InternalServerError');
    });
  });
});
