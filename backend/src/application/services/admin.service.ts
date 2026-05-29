import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import { User, UpdateUserDto } from '../../domain/entities/user.entity';
import { Role, UpdateRoleDto } from '../../domain/entities/role.entity';
import {
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../../domain/entities/permission.entity';
import {
  CreateUserAdminDto,
  UpdateUserAdminDto,
  CreateRoleAdminDto,
  UpdateRoleAdminDto,
  CreatePermissionAdminDto,
  UpdatePermissionAdminDto,
  PaginationDto,
  RoleListResponse,
  PermissionListResponse,
  UserListWithRolesResponse,
} from '../dto/admin.dto';
import { eq } from 'drizzle-orm';
import {
  users as usersTable,
  roles as rolesTable,
  rolePermissions,
  userRoles as userRolesTable,
} from '../../infrastructure/database/schema';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    @Inject('DATABASE')
    private readonly db: MySql2Database,
  ) {}

  private async invalidateUserCache(userId: string): Promise<void> {
    await this.cache.del(`user:${userId}:withRoles`);
  }

  // User Management
  async createUser(createUserDto: CreateUserAdminDto): Promise<User> {
    // Pre-flight uniqueness checks outside transaction to give clear error messages
    const existingByRut = await this.userRepository.findByRut(
      createUserDto.rut,
    );
    if (existingByRut) {
      throw new ConflictException('User with this RUT already exists');
    }

    const existingByEmail = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (existingByEmail) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate that the default "user" role exists before opening transaction
    const defaultRole = await this.roleRepository.findByName('user');
    if (!defaultRole) {
      throw new NotFoundException('Default "user" role not found');
    }

    // Validate additional role IDs before opening transaction
    const additionalRoleIds: string[] = [];
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      for (const roleId of createUserDto.roleIds) {
        const role = await this.roleRepository.findById(roleId);
        if (!role) {
          throw new BadRequestException(
            `Role with id "${roleId}" does not exist`,
          );
        }
        additionalRoleIds.push(roleId);
      }
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.db.transaction(async (tx) => {
      // Insert user
      const userId = uuidv4();
      await tx.insert(usersTable).values({
        id: userId,
        rut: createUserDto.rut,
        email: createUserDto.email,
        password: hashedPassword,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      });

      // Assign default "user" role
      await tx.insert(userRolesTable).values({
        id: uuidv4(),
        userId,
        roleId: defaultRole.id,
      });

      // Assign any additional roles (skip default if duplicated)
      for (const roleId of additionalRoleIds) {
        if (roleId !== defaultRole.id) {
          await tx.insert(userRolesTable).values({
            id: uuidv4(),
            userId,
            roleId,
          });
        }
      }

      // Read back the created user
      const [newUser] = await tx
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId));

      if (!newUser) {
        throw new BadRequestException('User creation failed unexpectedly');
      }

      return newUser;
    });
  }

  async getUsers(
    paginationDto: PaginationDto,
  ): Promise<UserListWithRolesResponse> {
    const { page = 1, limit = 10, search } = paginationDto;
    const offset = (page - 1) * limit;

    // For now, we'll get all users and filter in memory
    // In a real implementation, you'd want to implement pagination in the repository
    const allUsers = await this.userRepository.findAll();

    let filteredUsers = allUsers;

    if (search) {
      filteredUsers = allUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(search.toLowerCase()) ||
          user.lastName.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.rut.includes(search),
      );
    }

    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    // Get users with their roles and permissions
    const usersWithRoles = await Promise.all(
      paginatedUsers.map(async (user) => {
        const userRoles = await this.roleRepository.findUserRoles(user.id);
        const rolesWithPermissions = await Promise.all(
          userRoles.map(async (role) => {
            const permissions =
              await this.permissionRepository.findPermissionsByRole(role.id);
            return {
              ...role,
              permissions,
            };
          }),
        );

        return {
          ...user,
          roles: rolesWithPermissions,
        };
      }),
    );

    return {
      users: usersWithRoles,
      total,
      page,
      limit,
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserAdminDto,
  ): Promise<User> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check for conflicts if updating RUT or email
    if (updateUserDto.rut && updateUserDto.rut !== existingUser.rut) {
      const existingUserByRut = await this.userRepository.findByRut(
        updateUserDto.rut,
      );
      if (existingUserByRut) {
        throw new BadRequestException('User with this RUT already exists');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const existingUserByEmail = await this.userRepository.findByEmail(
        updateUserDto.email,
      );
      if (existingUserByEmail) {
        throw new BadRequestException('User with this email already exists');
      }
    }

    // Update user
    const updateData: UpdateUserDto = {
      rut: updateUserDto.rut,
      email: updateUserDto.email,
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      isActive: updateUserDto.isActive,
    };

    const updatedUser = await this.userRepository.update(id, updateData);

    // Update roles if provided
    if (updateUserDto.roleIds) {
      // Get current user roles
      const currentUserRoles = await this.roleRepository.findUserRoles(id);
      const currentRoleIds = currentUserRoles.map((role) => role.id);
      const newRoleIds = updateUserDto.roleIds;

      // Remove roles that are no longer in the new list
      for (const currentRoleId of currentRoleIds) {
        if (!newRoleIds.includes(currentRoleId)) {
          await this.roleRepository.removeRoleFromUser(id, currentRoleId);
        }
      }

      // Add new roles that are not already assigned
      for (const newRoleId of newRoleIds) {
        if (!currentRoleIds.includes(newRoleId)) {
          await this.roleRepository.assignRoleToUser(id, newRoleId);
        }
      }
    }

    await this.invalidateUserCache(id);

    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const existingUser = await this.userRepository.findById(id);
    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    await this.invalidateUserCache(id);

    // First, delete all user_roles records associated with the user
    await this.roleRepository.removeAllUserRoles(id);

    // Then, delete the user record
    await this.userRepository.delete(id);
  }

  // Role Management
  async createRole(createRoleDto: CreateRoleAdminDto): Promise<Role> {
    const existingRole = await this.roleRepository.findByName(
      createRoleDto.name,
    );
    if (existingRole) {
      throw new BadRequestException('Role with this name already exists');
    }

    // Validate all permission IDs upfront before opening the transaction
    if (createRoleDto.permissionIds && createRoleDto.permissionIds.length > 0) {
      for (const permissionId of createRoleDto.permissionIds) {
        const permission =
          await this.permissionRepository.findById(permissionId);
        if (!permission) {
          throw new BadRequestException(
            `Permission with id "${permissionId}" does not exist`,
          );
        }
      }
    }

    return this.db.transaction(async (tx) => {
      const roleId = uuidv4();

      // Insert the new role inside the transaction
      await tx.insert(rolesTable).values({
        id: roleId,
        name: createRoleDto.name,
        description: createRoleDto.description ?? '',
      });

      // Insert role_permissions rows
      if (
        createRoleDto.permissionIds &&
        createRoleDto.permissionIds.length > 0
      ) {
        const rpRows = createRoleDto.permissionIds.map((permissionId) => ({
          id: uuidv4(),
          roleId,
          permissionId,
        }));
        await tx.insert(rolePermissions).values(rpRows);
      }

      // Return the newly created role by reading it back through the repository
      // (repository uses its own db reference; we call it after commit)
      const newRole = await this.roleRepository.findById(roleId);
      if (!newRole) {
        throw new BadRequestException('Role creation failed unexpectedly');
      }
      return newRole;
    });
  }

  async getRoles(paginationDto: PaginationDto): Promise<RoleListResponse> {
    const { page = 1, limit = 10, search } = paginationDto;
    const offset = (page - 1) * limit;

    const allRoles = await this.roleRepository.findAll();

    let filteredRoles = allRoles;

    if (search) {
      filteredRoles = allRoles.filter(
        (role) =>
          role.name.toLowerCase().includes(search.toLowerCase()) ||
          role.description.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const total = filteredRoles.length;
    const roles = filteredRoles.slice(offset, offset + limit);

    return {
      roles,
      total,
      page,
      limit,
    };
  }

  async getRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async updateRole(
    id: string,
    updateRoleDto: UpdateRoleAdminDto,
  ): Promise<Role> {
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const existingRoleByName = await this.roleRepository.findByName(
        updateRoleDto.name,
      );
      if (existingRoleByName) {
        throw new BadRequestException('Role with this name already exists');
      }
    }

    const updateData: UpdateRoleDto = {
      name: updateRoleDto.name,
      description: updateRoleDto.description,
      isActive: updateRoleDto.isActive,
    };

    const updatedRole = await this.roleRepository.update(id, updateData);

    // Update permissions if provided
    if (updateRoleDto.permissionIds) {
      // Note: You might need to implement permission assignment logic
      // For now, we'll just update the role
    }

    return updatedRole;
  }

  async deleteRole(id: string): Promise<void> {
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    await this.roleRepository.delete(id);
  }

  // Permission Management
  async createPermission(
    createPermissionDto: CreatePermissionAdminDto,
  ): Promise<Permission> {
    const existingPermission = await this.permissionRepository.findByName(
      createPermissionDto.name,
    );
    if (existingPermission) {
      throw new BadRequestException('Permission with this name already exists');
    }

    const permissionData: CreatePermissionDto = {
      name: createPermissionDto.name,
      description: createPermissionDto.description,
      resource: createPermissionDto.resource,
      action: createPermissionDto.action,
    };

    const permission = await this.permissionRepository.create(permissionData);
    return permission;
  }

  async getPermissions(
    paginationDto: PaginationDto,
  ): Promise<PermissionListResponse> {
    const { page = 1, limit = 10, search } = paginationDto;
    const offset = (page - 1) * limit;

    const allPermissions = await this.permissionRepository.findAll();

    let filteredPermissions = allPermissions;

    if (search) {
      filteredPermissions = allPermissions.filter(
        (permission) =>
          permission.name.toLowerCase().includes(search.toLowerCase()) ||
          permission.description.toLowerCase().includes(search.toLowerCase()) ||
          permission.resource.toLowerCase().includes(search.toLowerCase()) ||
          permission.action.toLowerCase().includes(search.toLowerCase()),
      );
    }

    const total = filteredPermissions.length;
    const permissions = filteredPermissions.slice(offset, offset + limit);

    return {
      permissions,
      total,
      page,
      limit,
    };
  }

  async getPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }
    return permission;
  }

  async updatePermission(
    id: string,
    updatePermissionDto: UpdatePermissionAdminDto,
  ): Promise<Permission> {
    const existingPermission = await this.permissionRepository.findById(id);
    if (!existingPermission) {
      throw new NotFoundException('Permission not found');
    }

    if (
      updatePermissionDto.name &&
      updatePermissionDto.name !== existingPermission.name
    ) {
      const existingPermissionByName =
        await this.permissionRepository.findByName(updatePermissionDto.name);
      if (existingPermissionByName) {
        throw new BadRequestException(
          'Permission with this name already exists',
        );
      }
    }

    const updateData: UpdatePermissionDto = {
      name: updatePermissionDto.name,
      description: updatePermissionDto.description,
      resource: updatePermissionDto.resource,
      action: updatePermissionDto.action,
      isActive: updatePermissionDto.isActive,
    };

    const updatedPermission = await this.permissionRepository.update(
      id,
      updateData,
    );
    return updatedPermission;
  }

  async deletePermission(id: string): Promise<void> {
    const existingPermission = await this.permissionRepository.findById(id);
    if (!existingPermission) {
      throw new NotFoundException('Permission not found');
    }

    await this.permissionRepository.delete(id);
  }

  // Additional admin operations
  async getUserWithRoles(userId: string): Promise<any> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userRoles = await this.roleRepository.findUserRoles(userId);
    const rolesWithPermissions = await Promise.all(
      userRoles.map(async (role) => {
        const permissions =
          await this.permissionRepository.findPermissionsByRole(role.id);
        return {
          ...role,
          permissions,
        };
      }),
    );

    return {
      ...user,
      roles: rolesWithPermissions,
    };
  }

  async getRoleWithPermissions(roleId: string): Promise<any> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permissions =
      await this.permissionRepository.findPermissionsByRole(roleId);
    return {
      ...role,
      permissions,
    };
  }

  // Dashboard Data
  async getDashboardData() {
    try {
      // Get basic statistics
      const allUsers = await this.userRepository.findAll();
      const allRoles = await this.roleRepository.findAll();
      const allPermissions = await this.permissionRepository.findAll();

      // Calculate active users (users with recent activity - simplified for now)
      const activeUsers = allUsers.filter((user) => user.isActive).length;

      // For now, we'll return mock data for shifts since we don't have shift repository
      // In a real implementation, you'd inject the shift repository
      const totalShifts = 0; // Mock data
      const activeShifts = 0; // Mock data

      // Mock recent activities
      const recentActivities = [
        {
          id: '1',
          type: 'user_created',
          description: 'Nuevo usuario registrado',
          userId: '1',
          userName: 'Usuario Ejemplo',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'shift_created',
          description: 'Nuevo turno iniciado',
          userId: '1',
          userName: 'Usuario Ejemplo',
          timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        },
      ];

      // Mock top users
      const topUsers = [
        {
          id: '1',
          name: 'Usuario Ejemplo',
          totalShifts: 15,
          totalHours: 120.5,
        },
        {
          id: '2',
          name: 'Otro Usuario',
          totalShifts: 12,
          totalHours: 96.0,
        },
      ];

      return {
        success: true,
        message: 'Dashboard data retrieved successfully',
        data: {
          stats: {
            totalUsers: allUsers.length,
            activeUsers,
            totalShifts,
            activeShifts,
            totalRoles: allRoles.length,
            totalPermissions: allPermissions.length,
          },
          recentActivities,
          topUsers,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException({
        message: 'Failed to retrieve dashboard data',
        error: message,
      });
    }
  }
}
