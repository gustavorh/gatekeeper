import { Injectable, Inject } from '@nestjs/common';
import { eq, count, and } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { v4 as uuidv4 } from 'uuid';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import {
  User,
  UserWithPassword,
  CreateUserDto,
  UpdateUserDto,
} from '../../domain/entities/user.entity';
import * as schema from '../database/schema';
import { rowToUser, rowToUserWithPassword } from './mappers/user.mapper';

const { users } = schema;

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @Inject('DATABASE') private readonly db: MySql2Database<typeof schema>,
  ) {}

  async create(user: CreateUserDto): Promise<User> {
    const userId = uuidv4();

    await this.db.insert(users).values({
      id: userId,
      rut: user.rut,
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const [newUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    return rowToUser(newUser);
  }

  async findById(id: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user ? rowToUser(user) : null;
  }

  async findByRut(rut: string): Promise<User | null> {
    const [user] = await this.db.select().from(users).where(eq(users.rut, rut));
    return user ? rowToUser(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user ? rowToUser(user) : null;
  }

  /**
   * Returns the user record including the password hash, looked up by email.
   * Only for authentication use — do not expose outside auth flow.
   */
  async findByEmailWithPassword(email: string): Promise<UserWithPassword | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user ? rowToUserWithPassword(user) : null;
  }

  /**
   * Returns the user record including the password hash, looked up by RUT.
   * Only for authentication use — do not expose outside auth flow.
   */
  async findByRutWithPassword(rut: string): Promise<UserWithPassword | null> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.rut, rut));
    return user ? rowToUserWithPassword(user) : null;
  }

  async findAll(opts?: {
    page?: number;
    limit?: number;
    onlyActive?: boolean;
  }): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const page = opts?.page ?? 1;
    const limit = opts?.limit ?? 20;
    const onlyActive = opts?.onlyActive ?? true;
    const offset = (page - 1) * limit;

    const condition = onlyActive ? eq(users.isActive, true) : undefined;

    const [countResult] = await this.db
      .select({ count: count() })
      .from(users)
      .where(condition);

    const total = Number(countResult.count);

    const rows = condition
      ? await this.db
          .select()
          .from(users)
          .where(condition)
          .limit(limit)
          .offset(offset)
      : await this.db.select().from(users).limit(limit).offset(offset);

    return { data: rows.map(rowToUser), total, page, limit };
  }

  async findAllRaw(opts?: {
    onlyActive?: boolean;
  }): Promise<User[]> {
    const onlyActive = opts?.onlyActive ?? false;
    const condition = onlyActive ? eq(users.isActive, true) : undefined;

    const rows = condition
      ? await this.db.select().from(users).where(condition)
      : await this.db.select().from(users);

    return rows.map(rowToUser);
  }

  async findByIdWithRolesAndPermissions(userId: string): Promise<{
    user: User;
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
  } | null> {
    const { roles, rolePermissions, permissions } = schema;

    const results = await this.db
      .select({
        user: users,
        role: roles,
        permission: permissions,
      })
      .from(users)
      .leftJoin(schema.userRoles, eq(schema.userRoles.userId, users.id))
      .leftJoin(roles, eq(roles.id, schema.userRoles.roleId))
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(eq(users.id, userId));

    if (results.length === 0) return null;

    const firstRow = results[0];
    if (!firstRow.user) return null;

    const user = rowToUser(firstRow.user);

    const rolesMap = new Map<
      string,
      {
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
      }
    >();

    for (const row of results) {
      if (!row.role) continue;
      const roleId = row.role.id;
      if (!rolesMap.has(roleId)) {
        rolesMap.set(roleId, {
          id: row.role.id,
          name: row.role.name,
          description: row.role.description,
          isActive: row.role.isActive,
          createdAt: row.role.createdAt,
          updatedAt: row.role.updatedAt,
          permissions: [],
        });
      }
      if (row.permission) {
        rolesMap.get(roleId)!.permissions.push({
          id: row.permission.id,
          name: row.permission.name,
          description: row.permission.description,
          resource: row.permission.resource,
          action: row.permission.action,
          isActive: row.permission.isActive,
          createdAt: row.permission.createdAt,
          updatedAt: row.permission.updatedAt,
        });
      }
    }

    return { user, roles: Array.from(rolesMap.values()) };
  }

  async update(id: string, user: UpdateUserDto): Promise<User> {
    await this.db
      .update(users)
      .set({
        ...user,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    const [updatedUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));

    return rowToUser(updatedUser);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async existsByRut(rut: string): Promise<boolean> {
    const [user] = await this.db.select().from(users).where(eq(users.rut, rut));
    return !!user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return !!user;
  }
}
