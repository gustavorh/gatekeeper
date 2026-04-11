import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from '../../application/services/admin.service';
import { AdminAuthGuard } from '../middleware/admin-auth.guard';
import { PaginationDto } from '../../application/dto/admin.dto';

describe('AdminController', () => {
  let controller: AdminController;
  let service: AdminService;

  const mockAdminService = {
    getUsers: jest.fn(),
    createUser: jest.fn(),
    getUserById: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    createRole: jest.fn(),
    getRoles: jest.fn(),
    getRoleById: jest.fn(),
    updateRole: jest.fn(),
    deleteRole: jest.fn(),
    createPermission: jest.fn(),
    getPermissions: jest.fn(),
    getPermissionById: jest.fn(),
    updatePermission: jest.fn(),
    deletePermission: jest.fn(),
    getUserWithRoles: jest.fn(),
    getRoleWithPermissions: jest.fn(),
    getDashboardData: jest.fn(),
  };

  const mockAdminAuthGuard = {
    canActivate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
      ],
    })
      .overrideGuard(AdminAuthGuard)
      .useValue(mockAdminAuthGuard)
      .compile();

    controller = module.get<AdminController>(AdminController);
    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUsers', () => {
    it('should return users with roles and permissions', async () => {
      const mockPaginationDto: PaginationDto = {
        page: 1,
        limit: 10,
        search: '',
      };

      const mockResponse = {
        users: [
          {
            id: '1',
            rut: '12345678-9',
            email: 'test@example.com',
            firstName: 'John',
            lastName: 'Doe',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            roles: [
              {
                id: '1',
                name: 'admin',
                description: 'Administrator role',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                permissions: [
                  {
                    id: '1',
                    name: 'VIEW',
                    description: 'View permission',
                    resource: 'users',
                    action: 'read',
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                ],
              },
            ],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      mockAdminService.getUsers.mockResolvedValue(mockResponse);

      const result = await controller.getUsers(mockPaginationDto);

      expect(result).toEqual(mockResponse);
      expect(service.getUsers).toHaveBeenCalledWith(mockPaginationDto);
      expect(result.users[0].roles).toBeDefined();
      expect(result.users[0].roles[0].permissions).toBeDefined();
      expect(result.users[0].roles[0].name).toBe('admin');
      expect(result.users[0].roles[0].permissions[0].name).toBe('VIEW');
    });
  });
});
