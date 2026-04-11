# Testing Strategy

This document outlines the comprehensive testing strategy implemented for the NestJS backend application, following Clean Architecture principles.

## Testing Architecture

The testing structure follows the same layered architecture as the application:

```
backend/
├── src/
│   ├── domain/           # Domain layer tests
│   │   ├── entities/     # Entity interface tests
│   │   └── repositories/ # Repository interface tests
│   ├── application/      # Application layer tests
│   │   ├── services/     # Service tests
│   │   └── dto/         # DTO validation tests
│   ├── infrastructure/   # Infrastructure layer tests
│   │   └── repositories/ # Repository implementation tests
│   ├── presentation/     # Presentation layer tests
│   │   ├── controllers/  # Controller tests
│   │   ├── middleware/   # Guard tests
│   │   ├── interceptors/ # Interceptor tests
│   │   └── filters/     # Exception filter tests
│   └── utils/           # Utility function tests
├── test/                # Test setup and utilities
└── coverage/           # Coverage reports
```

## Test Categories

### 1. Unit Tests

- **Domain Layer**: Entity interfaces, repository interfaces
- **Application Layer**: Services, DTOs, validation logic
- **Infrastructure Layer**: Repository implementations
- **Presentation Layer**: Controllers, guards, interceptors, filters
- **Utilities**: Helper functions, validators

### 2. Integration Tests

- Service integration with repositories
- Controller integration with services
- Database operations

### 3. End-to-End Tests

- Complete API endpoint testing
- Authentication flows
- Database integration

## Running Tests

### All Tests

```bash
npm run test:all
```

### Unit Tests Only

```bash
npm run test:unit
```

### Integration Tests Only

```bash
npm run test:integration
```

### End-to-End Tests Only

```bash
npm run test:e2e
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage Report

```bash
npm run test:cov
```

## Test Configuration

### Jest Configuration

- **Root Directory**: `src/`
- **Test Pattern**: `*.spec.ts`
- **Coverage Threshold**: 80% for all metrics
- **Setup File**: `test/setup.ts`

### Coverage Exclusions

- Module files (`*.module.ts`)
- Index files (`index.ts`)
- DTOs (`*.dto.ts`)
- Entities (`*.entity.ts`)
- Interfaces (`*.interface.ts`)
- Main application file (`main.ts`)

## Test Structure

### Domain Layer Tests

```typescript
// Example: user.entity.spec.ts
describe('User Entity', () => {
  describe('User Interface', () => {
    it('should have all required properties', () => {
      // Test interface structure
    });
  });
});
```

### Application Layer Tests

```typescript
// Example: auth.service.spec.ts
describe('AuthService', () => {
  describe('login', () => {
    it('should successfully login a user', async () => {
      // Test service method
    });
  });
});
```

### Infrastructure Layer Tests

```typescript
// Example: user.repository.spec.ts
describe('UserRepository', () => {
  describe('create', () => {
    it('should create a new user successfully', async () => {
      // Test repository method
    });
  });
});
```

### Presentation Layer Tests

```typescript
// Example: auth.controller.spec.ts
describe('AuthController', () => {
  describe('login', () => {
    it('should successfully login a user', async () => {
      // Test controller method
    });
  });
});
```

## Mocking Strategy

### Database Mocking

```typescript
export const mockDatabase = {
  insert: jest.fn(),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  // ... other methods
};
```

### Service Mocking

```typescript
const mockAuthService = {
  login: jest.fn(),
  register: jest.fn(),
};
```

### Repository Mocking

```typescript
const mockUserRepository = {
  findByRut: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  // ... other methods
};
```

## Test Utilities

### Test Setup

```typescript
// test/setup.ts
export const createTestingModule = async (imports: any[]) => {
  return Test.createTestingModule({
    imports,
  }).compile();
};
```

### Mock Factories

```typescript
export const createMockUser = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  rut: '123456789',
  email: 'test@example.com',
  // ... default properties
  ...overrides,
});
```

## Validation Testing

### DTO Validation

```typescript
describe('Auth DTOs', () => {
  it('should validate correct login data', async () => {
    const loginData = { rut: '123456789', password: 'password123' };
    const loginDto = plainToClass(LoginDto, loginData);
    const errors = await validate(loginDto);
    expect(errors.length).toBe(0);
  });
});
```

### Custom Decorator Testing

```typescript
describe('IsRut Decorator', () => {
  it('should validate correct RUT format', async () => {
    const testData = { rut: '123456789' };
    const testObject = plainToClass(TestClass, testData);
    const errors = await validate(testObject);
    expect(errors.length).toBe(0);
  });
});
```

## Error Testing

### Exception Testing

```typescript
it('should throw UnauthorizedException when user does not exist', async () => {
  mockUserRepository.findByRut.mockResolvedValue(null);
  await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
});
```

### Validation Error Testing

```typescript
it('should reject invalid RUT format', async () => {
  const loginData = { rut: '1234567', password: 'password123' };
  const loginDto = plainToClass(LoginDto, loginData);
  const errors = await validate(loginDto);
  expect(errors.length).toBeGreaterThan(0);
});
```

## Coverage Goals

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Best Practices

### 1. Test Organization

- Group related tests using `describe` blocks
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)

### 2. Mocking

- Mock external dependencies
- Use factory functions for test data
- Reset mocks between tests

### 3. Assertions

- Test both success and failure cases
- Verify method calls and their parameters
- Test error messages and status codes

### 4. Test Data

- Use realistic test data
- Create reusable mock objects
- Test edge cases and boundary conditions

## Continuous Integration

The testing setup is designed to work with CI/CD pipelines:

```yaml
# Example CI configuration
- name: Run unit tests
  run: npm run test:unit

- name: Run integration tests
  run: npm run test:integration

- name: Generate coverage report
  run: npm run test:cov
```

## Debugging Tests

### Debug Mode

```bash
npm run test:debug
```

### Watch Mode with Coverage

```bash
npm run test:watch -- --coverage
```

### Specific Test File

```bash
npm test -- auth.service.spec.ts
```

## Test Maintenance

### Adding New Tests

1. Create test file with `.spec.ts` extension
2. Follow existing naming conventions
3. Use appropriate mocking strategies
4. Add to relevant test categories

### Updating Tests

1. Update mocks when interfaces change
2. Maintain test data consistency
3. Update assertions for new behavior
4. Ensure backward compatibility

### Test Documentation

- Document complex test scenarios
- Explain mock setup for complex cases
- Keep test data examples up to date
- Document test utilities and helpers

This testing strategy ensures comprehensive coverage of all application layers while maintaining code quality and reliability.
