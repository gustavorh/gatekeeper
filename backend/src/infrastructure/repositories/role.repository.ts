import { Injectable, Inject } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { v4 as uuidv4 } from 'uuid';
import { IRoleRepository } from '../../domain/repositories/role.repository.interface';
import {
  Role,
  CreateRoleDto,
  UpdateRoleDto,
} from '../../domain/entities/role.entity';
import * as schema from '../database/schema';

const { roles, userRoles } = schema;

@Injectable()
export class RoleRepository implements IRoleRepository {
  constructor(
    @Inject('DATABASE') private readonly db: MySql2Database<typeof schema>,
  ) {}

  async create(role: CreateRoleDto): Promise<Role> {
    const roleId = uuidv4();

    await this.db.insert(roles).values({
      id: roleId,
      name: role.name,
      description: role.description,
    });

    // Obtener el rol creado
    const [newRole] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId));

    return newRole;
  }

  async findById(id: string): Promise<Role | null> {
    const [role] = await this.db.select().from(roles).where(eq(roles.id, id));
    return role || null;
  }

  async findByName(name: string): Promise<Role | null> {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.name, name));
    return role || null;
  }

  async findAll(): Promise<Role[]> {
    return await this.db.select().from(roles);
  }

  async update(id: string, role: UpdateRoleDto): Promise<Role> {
    await this.db
      .update(roles)
      .set({
        ...role,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id));

    // Obtener el rol actualizado
    const [updatedRole] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id));

    return updatedRole;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(roles).where(eq(roles.id, id));
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const userRoleId = uuidv4();

    await this.db.insert(userRoles).values({
      id: userRoleId,
      userId,
      roleId,
    });
  }

  async findUserRoles(userId: string): Promise<Role[]> {
    const results = await this.db
      .select({
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isActive: roles.isActive,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return results;
  }

  /**
   * Batch-loads roles for multiple users in a single query.
   * Returns a map of userId → Role[].
   */
  async findUserRolesBatch(
    userIds: string[],
  ): Promise<Map<string, Role[]>> {
    if (userIds.length === 0) return new Map();

    const results = await this.db
      .select({
        userId: userRoles.userId,
        id: roles.id,
        name: roles.name,
        description: roles.description,
        isActive: roles.isActive,
        createdAt: roles.createdAt,
        updatedAt: roles.updatedAt,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(userRoles.userId, userIds));

    const map = new Map<string, Role[]>();
    for (const row of results) {
      const { userId, ...role } = row;
      if (!map.has(userId)) map.set(userId, []);
      map.get(userId)!.push(role as Role);
    }
    return map;
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));
  }

  async removeAllUserRoles(userId: string): Promise<void> {
    await this.db.delete(userRoles).where(eq(userRoles.userId, userId));
  }
}
