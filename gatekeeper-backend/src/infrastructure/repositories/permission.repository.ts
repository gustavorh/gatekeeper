import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { IPermissionRepository } from '../../domain/repositories/permission.repository.interface';
import {
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../../domain/entities/permission.entity';
import { permissions, rolePermissions } from '../database/schema';

@Injectable()
export class PermissionRepository implements IPermissionRepository {
  constructor(@Inject('DATABASE') private readonly db: any) {}

  async create(permission: CreatePermissionDto): Promise<Permission> {
    const permissionId = uuidv4();

    await this.db.insert(permissions).values({
      id: permissionId,
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
    });

    // Obtener el permiso creado
    const [newPermission] = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionId));

    return newPermission;
  }

  async findById(id: string): Promise<Permission | null> {
    const [permission] = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id));
    return permission || null;
  }

  async findByName(name: string): Promise<Permission | null> {
    const [permission] = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.name, name));
    return permission || null;
  }

  async findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null> {
    const [permission] = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.resource, resource))
      .where(eq(permissions.action, action));
    return permission || null;
  }

  async findAll(): Promise<Permission[]> {
    return await this.db.select().from(permissions);
  }

  async update(
    id: string,
    permission: UpdatePermissionDto,
  ): Promise<Permission> {
    await this.db
      .update(permissions)
      .set({
        ...permission,
        updatedAt: new Date(),
      })
      .where(eq(permissions.id, id));

    // Obtener el permiso actualizado
    const [updatedPermission] = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, id));

    return updatedPermission;
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(permissions).where(eq(permissions.id, id));
  }

  async findPermissionsByRole(roleId: string): Promise<Permission[]> {
    // Obtener permisos asociados a un rol específico
    const rolePermissionsResult = await this.db
      .select({
        permissionId: rolePermissions.permissionId,
      })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    if (rolePermissionsResult.length === 0) {
      return [];
    }

    const permissionIds = rolePermissionsResult.map((rp) => rp.permissionId);

    // Obtener los detalles de los permisos usando IN clause
    const permissionsResult = await this.db
      .select()
      .from(permissions)
      .where(eq(permissions.id, permissionIds));

    return permissionsResult;
  }
}
