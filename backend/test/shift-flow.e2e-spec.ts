/**
 * E2E test: critical shift flow — login → clockIn → clockOut
 *
 * Strategy: import the real AppModule but override all DB-touching providers
 * with jest mocks so the test is self-contained (no MySQL needed).  This keeps
 * the full HTTP pipeline active:
 *   ConfigModule → ThrottlerGuard → JwtAuthGuard → ShiftController → ShiftService
 *
 * All repository interfaces are replaced with jest.fn() doubles that return the
 * fixtures declared below.  The 'DATABASE' token gets a mock that runs the
 * transaction callback synchronously through a chainable tx double.
 */

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request = require('supertest');
import { App } from 'supertest/types';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { ShiftStatus } from '../src/domain/entities/shift.entity';
import { CACHE_SERVICE } from '../src/application/interfaces/cache.service.interface';

// Mock bcryptjs at module level so it's available before AppModule initializes.
// The unit-test setup.ts (setupFilesAfterEnv) is not loaded by the E2E jest config,
// so we set up the mock here explicitly.
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashed'),
  compare: jest.fn(),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const USER_ID = 'e2e-user-001';
const USER_RUT = '123456785';

const mockUser = {
  id: USER_ID,
  rut: USER_RUT,
  email: 'e2e@example.com',
  firstName: 'E2E',
  lastName: 'User',
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

const mockUserWithPassword = {
  ...mockUser,
  password: '$2b$10$fixedHashForTestingPurposes123456789012',
};

const mockUserWithRoles = {
  ...mockUser,
  roles: [
    {
      id: 'role-user',
      name: 'user',
      description: 'Regular user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissions: [],
    },
  ],
};

const makeShift = (overrides = {}) => ({
  id: 'shift-e2e-001',
  userId: USER_ID,
  clockInTime: new Date('2026-01-01T09:00:00Z'),
  status: ShiftStatus.ACTIVE,
  createdAt: new Date('2026-01-01T09:00:00Z'),
  updatedAt: new Date('2026-01-01T09:00:00Z'),
  ...overrides,
});

// ─── DB transaction mock ──────────────────────────────────────────────────────
//
// clockIn uses:
//   tx.select().from().where()  × 2  (check ACTIVE, check PENDING)
//   tx.insert().values()              (insert new shift)
//   tx.select().from().where()        (re-read new shift)
//
// clockOut uses:
//   tx.select().from().where()        (find ACTIVE)
//   tx.update().set().where()         (update to COMPLETED — result discarded)
//   tx.select().from().where()        (re-read updated shift)
//
// We expose a mutable `txWhereResults` array that each test case pushes values
// into.  Each call to tx.where() shifts the first element off that array, so
// tests can declare exact sequences.

let txWhereResults: Array<unknown[]> = [];

const mockTx = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockImplementation(() =>
    Promise.resolve(txWhereResults.shift() ?? []),
  ),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};

const mockDb = {
  transaction: jest.fn().mockImplementation(
    async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx),
  ),
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue([]),
};

// ─── Repository mocks ─────────────────────────────────────────────────────────

const mockUserRepository = {
  findById: jest.fn(),
  findByRut: jest.fn(),
  findByEmail: jest.fn(),
  findByRutWithPassword: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findByIdWithRolesAndPermissions: jest.fn(),
  findAll: jest.fn(),
  findAllRaw: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  existsByRut: jest.fn(),
  existsByEmail: jest.fn(),
};

const mockRoleRepository = {
  findById: jest.fn(),
  findByName: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  assignRoleToUser: jest.fn(),
  findUserRoles: jest.fn(),
  findUserRolesBatch: jest.fn(),
  removeRoleFromUser: jest.fn(),
  removeAllUserRoles: jest.fn(),
};

const mockShiftRepository = {
  create: jest.fn(),
  findById: jest.fn(),
  findByUserId: jest.fn(),
  findByUserIdAndDateRange: jest.fn(),
  findActiveByUserId: jest.fn(),
  findPendingByUserId: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findWithUser: jest.fn(),
  findHistoryByUserId: jest.fn(),
  findHistoryByUserIdWithoutUser: jest.fn(),
  findHistoryByUserIdWithFilters: jest.fn(),
  countByUserId: jest.fn(),
  countByUserIdWithFilters: jest.fn(),
  findAllActiveWithUsers: jest.fn(),
  countAllActive: jest.fn(),
  findAllWithUsers: jest.fn(),
  countAll: jest.fn(),
  findAllWithUsersAndFilters: jest.fn(),
  countAllWithFilters: jest.fn(),
};

const mockPermissionRepository = {
  findById: jest.fn(),
  findByName: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findPermissionsByRole: jest.fn(),
};

const mockCache = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  del: jest.fn().mockResolvedValue(undefined),
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('Shift flow (E2E)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Override database provider — avoids any real MySQL connection
      .overrideProvider('DATABASE')
      .useValue(mockDb)
      .overrideProvider('CONNECTION')
      .useValue({ end: jest.fn().mockResolvedValue(undefined) })
      // Override repository tokens
      .overrideProvider('IUserRepository')
      .useValue(mockUserRepository)
      .overrideProvider('IRoleRepository')
      .useValue(mockRoleRepository)
      .overrideProvider('IShiftRepository')
      .useValue(mockShiftRepository)
      .overrideProvider('IPermissionRepository')
      .useValue(mockPermissionRepository)
      // Override cache
      .overrideProvider(CACHE_SERVICE)
      .useValue(mockCache)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset all mocks between tests
    jest.clearAllMocks();
    txWhereResults = [];
    mockCache.get.mockResolvedValue(null);

    // Default user resolution used by JwtAuthGuard for authenticated requests
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockRoleRepository.findUserRoles.mockResolvedValue([
      { id: 'role-user', name: 'user' },
    ]);
  });

  // ─── POST /auth/login ─────────────────────────────────────────────────────

  describe('POST /auth/login', () => {
    it('debería retornar JWT y datos de usuario cuando las credenciales son válidas', async () => {
      // Arrange
      mockUserRepository.findByRutWithPassword.mockResolvedValue(
        mockUserWithPassword,
      );
      mockUserRepository.findByIdWithRolesAndPermissions.mockResolvedValue({
        user: mockUser,
        roles: [
          {
            id: 'role-user',
            name: 'user',
            description: 'Regular user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [],
          },
        ],
      });

      // bcryptjs.compare is mocked at the top of this file
      const bcrypt = require('bcryptjs') as { compare: jest.Mock };
      bcrypt.compare.mockResolvedValue(true);

      // Act
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ rut: USER_RUT, password: 'Password123!' })
        .expect(200);

      // Assert — ResponseInterceptor wraps in { success, data, message }
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.id).toBe(USER_ID);

      // Persist token for subsequent tests
      authToken = response.body.data.token;
    });

    it('debería retornar 401 cuando las credenciales son inválidas', async () => {
      // Arrange — password format passes DTO validation (≥12 chars, upper, lower, digit)
      // but bcrypt.compare returns false (wrong password)
      const bcrypt = require('bcryptjs') as { compare: jest.Mock };
      mockUserRepository.findByRutWithPassword.mockResolvedValue(
        mockUserWithPassword,
      );
      bcrypt.compare.mockResolvedValue(false);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ rut: USER_RUT, password: 'WrongPassword1!' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debería retornar 401 cuando el usuario no existe en base de datos', async () => {
      // Arrange — user not found → AuthService throws UnauthorizedException
      // Note: a RUT that passes DTO validation (format is correct) but doesn't
      // match any record in the mocked repository.
      mockUserRepository.findByRutWithPassword.mockResolvedValue(null);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ rut: USER_RUT, password: 'Password123!' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ─── POST /shifts/clock-in ────────────────────────────────────────────────

  describe('POST /shifts/clock-in', () => {
    beforeEach(() => {
      // Generate a valid JWT for these tests
      authToken = jwtService.sign({
        sub: USER_ID,
        rut: USER_RUT,
        email: mockUser.email,
        organizationId: 'gatekeeper-default',
      });
    });

    it('debería retornar turno ACTIVE cuando no hay turno activo previo', async () => {
      // Arrange
      const newShift = makeShift();
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // tx.where sequence for clockIn:
      //   call 1: SELECT for ACTIVE   → [] (none)
      //   call 2: SELECT for PENDING  → [] (none)
      //   call 3: SELECT after INSERT → [newShift]
      txWhereResults = [[], [], [newShift]];

      // Act
      const response = await request(app.getHttpServer())
        .post('/shifts/clock-in')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ShiftStatus.ACTIVE);
      expect(response.body.data.userId).toBe(USER_ID);
    });

    it('debería retornar 400 cuando el usuario ya tiene un turno ACTIVE (doble clock-in)', async () => {
      // Arrange
      const existingActiveShift = makeShift({ status: ShiftStatus.ACTIVE });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // tx.where call 1: finds existing ACTIVE → triggers BadRequestException
      txWhereResults = [[existingActiveShift]];

      // Act
      const response = await request(app.getHttpServer())
        .post('/shifts/clock-in')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      // Assert
      expect(response.body.success).toBe(false);
    });

    it('debería retornar 401 cuando no se envía token JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/shifts/clock-in')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debería retornar 401 cuando el usuario del JWT no existe en BD (JwtAuthGuard rechaza primero)', async () => {
      // Arrange — JwtAuthGuard calls userRepository.findById and throws 401
      // when the user record is missing; ShiftService.clockIn is never reached.
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const response = await request(app.getHttpServer())
        .post('/shifts/clock-in')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ─── POST /shifts/clock-out ───────────────────────────────────────────────

  describe('POST /shifts/clock-out', () => {
    beforeEach(() => {
      authToken = jwtService.sign({
        sub: USER_ID,
        rut: USER_RUT,
        email: mockUser.email,
        organizationId: 'gatekeeper-default',
      });
    });

    it('debería retornar turno COMPLETED con clockOutTime cuando hay un turno ACTIVE', async () => {
      // Arrange
      const clockOutTime = new Date('2026-01-01T17:00:00Z');
      const activeShift = makeShift();
      const completedShift = makeShift({
        status: ShiftStatus.COMPLETED,
        clockOutTime,
      });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // tx.where sequence for clockOut:
      //   call 1: SELECT for ACTIVE   → [activeShift]
      //   call 2: UPDATE .where()     → undefined (result discarded)
      //   call 3: SELECT after UPDATE → [completedShift]
      txWhereResults = [[activeShift], undefined as unknown as unknown[], [completedShift]];

      // Act
      const response = await request(app.getHttpServer())
        .post('/shifts/clock-out')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ShiftStatus.COMPLETED);
      expect(response.body.data.clockOutTime).toBeDefined();
    });

    it('debería retornar 400 cuando no hay turno ACTIVE para el usuario', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(mockUser);

      // tx.where call 1: no active shift found
      txWhereResults = [[]];

      // Act
      const response = await request(app.getHttpServer())
        .post('/shifts/clock-out')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('debería retornar 401 cuando no se envía token JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/shifts/clock-out')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ─── GET /shifts/current ──────────────────────────────────────────────────

  describe('GET /shifts/current', () => {
    beforeEach(() => {
      authToken = jwtService.sign({
        sub: USER_ID,
        rut: USER_RUT,
        email: mockUser.email,
        organizationId: 'gatekeeper-default',
      });
    });

    it('debería retornar el turno ACTIVE cuando el usuario lo tiene', async () => {
      // Arrange
      const activeShift = makeShift();
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockShiftRepository.findActiveByUserId.mockResolvedValue(activeShift);

      // Act
      const response = await request(app.getHttpServer())
        .get('/shifts/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(ShiftStatus.ACTIVE);
    });

    it('debería retornar null en data después de que el usuario hizo clockOut (sin turno activo)', async () => {
      // Arrange — after a completed clockOut, no active or pending shift
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockShiftRepository.findActiveByUserId.mockResolvedValue(null);
      mockShiftRepository.findPendingByUserId.mockResolvedValue(null);

      // Act
      const response = await request(app.getHttpServer())
        .get('/shifts/current')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert — data should be null (no active/pending shift)
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeNull();
    });

    it('debería retornar 401 cuando no se envía token JWT', async () => {
      const response = await request(app.getHttpServer())
        .get('/shifts/current')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // ─── Flujo completo: login → clockIn → clockOut ───────────────────────────

  describe('Flujo crítico completo', () => {
    it('debería completar el ciclo login → clockIn → clockOut correctamente', async () => {
      // ── Step 1: Login ──
      const bcrypt = require('bcryptjs') as { compare: jest.Mock };
      bcrypt.compare.mockResolvedValue(true);
      mockUserRepository.findByRutWithPassword.mockResolvedValue(
        mockUserWithPassword,
      );
      mockUserRepository.findByIdWithRolesAndPermissions.mockResolvedValue({
        user: mockUser,
        roles: [
          {
            id: 'role-user',
            name: 'user',
            description: 'Regular user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            permissions: [],
          },
        ],
      });

      const loginResp = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ rut: USER_RUT, password: 'Password123!' })
        .expect(200);

      expect(loginResp.body.data).toHaveProperty('token');
      const token = loginResp.body.data.token as string;

      // Reset for authenticated requests
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRoleRepository.findUserRoles.mockResolvedValue([
        { id: 'role-user', name: 'user' },
      ]);

      // ── Step 2: Clock-in ──
      const clockInShift = makeShift();
      txWhereResults = [[], [], [clockInShift]];

      const clockInResp = await request(app.getHttpServer())
        .post('/shifts/clock-in')
        .set('Authorization', `Bearer ${token}`)
        .expect(201);

      expect(clockInResp.body.data.status).toBe(ShiftStatus.ACTIVE);

      // ── Step 3: Clock-out ──
      const completedShift = makeShift({
        status: ShiftStatus.COMPLETED,
        clockOutTime: new Date(),
      });
      txWhereResults = [[clockInShift], undefined as unknown as unknown[], [completedShift]];

      const clockOutResp = await request(app.getHttpServer())
        .post('/shifts/clock-out')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(clockOutResp.body.data.status).toBe(ShiftStatus.COMPLETED);
      expect(clockOutResp.body.data.clockOutTime).toBeDefined();

      // ── Step 4: Verify getCurrentShift returns null after clockOut ──
      mockShiftRepository.findActiveByUserId.mockResolvedValue(null);
      mockShiftRepository.findPendingByUserId.mockResolvedValue(null);

      const currentResp = await request(app.getHttpServer())
        .get('/shifts/current')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(currentResp.body.data).toBeNull();
    });
  });
});
