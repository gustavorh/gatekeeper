import {
  Injectable,
  Inject,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, count, gte } from 'drizzle-orm';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import type { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import type { ICacheService } from '../interfaces/cache.service.interface';
import { CACHE_SERVICE } from '../interfaces/cache.service.interface';
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
import * as schema from '../../infrastructure/database/schema';

const {
  users: usersTable,
  roles: rolesTable,
  rolePermissions,
  userRoles: userRolesTable,
  shifts: shiftsTable,
} = schema;

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
    @Inject(CACHE_SERVICE)
    private readonly cache: ICacheService,
    @Inject('DATABASE')
    private readonly db: MySql2Database<typeof schema>,
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

    // P1-2 + C4: SQL-level pagination with isActive filter
    // Search still needs in-memory filter until full-text index is added
    if (search) {
      // With a search term, fetch active users without SQL pagination first
      // (search across text fields; acceptable for small-to-medium datasets)
      const allActive = await this.userRepository.findAllRaw({ onlyActive: true });
      const filtered = allActive.filter(
        (user) =>
          user.firstName.toLowerCase().includes(search.toLowerCase()) ||
          user.lastName.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          user.rut.includes(search),
      );
      const total = filtered.length;
      const offset = (page - 1) * limit;
      const paginatedUsers = filtered.slice(offset, offset + limit);

      return this._attachRolesToUsers(paginatedUsers, total, page, limit);
    }

    // No search: fully SQL-paginated
    const { data: paginatedUsers, total } = await this.userRepository.findAll({
      page,
      limit,
      onlyActive: true,
    });

    return this._attachRolesToUsers(paginatedUsers, total, page, limit);
  }

  /** C5: batch-load roles for all users in one query, then attach permissions. */
  private async _attachRolesToUsers(
    users: User[],
    total: number,
    page: number,
    limit: number,
  ): Promise<UserListWithRolesResponse> {
    if (users.length === 0) return { users: [], total, page, limit };

    const userIds = users.map((u) => u.id);

    // C5: single batch query for all roles
    const rolesMap = await this.roleRepository.findUserRolesBatch(userIds);

    // For each role, fetch permissions (still one query per role — acceptable
    // since role count is small and bounded; full JOIN optimization tracked as A5)
    const usersWithRoles = await Promise.all(
      users.map(async (user) => {
        const userRoles = rolesMap.get(user.id) ?? [];
        const rolesWithPermissions = await Promise.all(
          userRoles.map(async (role) => {
            const permissions =
              await this.permissionRepository.findPermissionsByRole(role.id);
            return { ...role, permissions };
          }),
        );
        return { ...user, roles: rolesWithPermissions };
      }),
    );

    return { users: usersWithRoles, total, page, limit };
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
  // C5: single JOIN query replaces N+1
  async getUserWithRoles(userId: string): Promise<{
    id: string;
    rut: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    roles: Array<{
      id: string;
      name: string;
      description: string;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      permissions: Array<{
        id: string;
        name: string;
        description: string;
        resource: string;
        action: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
      }>;
    }>;
  }> {
    const result =
      await this.userRepository.findByIdWithRolesAndPermissions(userId);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return { ...result.user, roles: result.roles };
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

  // Dashboard Data — D2: real queries replacing mock data
  async getDashboardData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // KPI 1: total active users
    const [totalUsersResult] = await this.db
      .select({ count: count() })
      .from(usersTable)
      .where(eq(usersTable.isActive, true));
    const totalUsers = Number(totalUsersResult.count);

    // KPI 2: active shifts right now
    const [activeShiftsResult] = await this.db
      .select({ count: count() })
      .from(shiftsTable)
      .where(eq(shiftsTable.status, 'active'));
    const activeShifts = Number(activeShiftsResult.count);

    // KPI 3: shifts that clocked in today
    const [todayClockInsResult] = await this.db
      .select({ count: count() })
      .from(shiftsTable)
      .where(gte(shiftsTable.clockInTime, today));
    const todayClockIns = Number(todayClockInsResult.count);

    // KPI 4: total roles and permissions counts
    const allRoles = await this.roleRepository.findAll();
    const allPermissions = await this.permissionRepository.findAll();

    return {
      stats: {
        totalUsers,
        activeShifts,
        todayClockIns,
        totalRoles: allRoles.length,
        totalPermissions: allPermissions.length,
      },
    };
  }
}
