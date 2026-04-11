import { Test } from '@nestjs/testing';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '3306';
  process.env.DB_USER = 'test';
  process.env.DB_PASSWORD = 'test';
  process.env.DB_NAME = 'gatekeeper_test';
});

// Global test utilities
export const createTestingModule = async (imports: any[]) => {
  return Test.createTestingModule({
    imports,
  }).compile();
};

// Mock database for unit tests
export const mockDatabase = {
  insert: jest.fn(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
};

// Mock JWT service
export const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
  verifyAsync: jest.fn(),
};

// Mock bcrypt
export const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

// Mock UUID
export const mockUuid = {
  v4: jest.fn(),
};

// Mock modules
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));
