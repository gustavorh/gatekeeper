import { Injectable, Inject } from '@nestjs/common';
import { IRoleRepository } from '../domain/repositories/role.repository.interface';
import { IPermissionRepository } from '../domain/repositories/permission.repository.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class InitRolesPermissions {
  constructor(
    @Inject('IRoleRepository')
    private readonly roleRepository: IRoleRepository,
    @Inject('IPermissionRepository')
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async initialize() {
    console.log('Initializing roles and permissions...');

    // Crear permisos básicos
    const permissions = [
      {
        name: 'read_users',
        description: 'Can read user information',
        resource: 'users',
        action: 'read',
      },
      {
        name: 'write_users',
        description: 'Can create and update users',
        resource: 'users',
        action: 'write',
      },
      {
        name: 'delete_users',
        description: 'Can delete users',
        resource: 'users',
        action: 'delete',
      },
      {
        name: 'read_roles',
        description: 'Can read role information',
        resource: 'roles',
        action: 'read',
      },
      {
        name: 'write_roles',
        description: 'Can create and update roles',
        resource: 'roles',
        action: 'write',
      },
      {
        name: 'read_permissions',
        description: 'Can read permission information',
        resource: 'permissions',
        action: 'read',
      },
      {
        name: 'write_permissions',
        description: 'Can create and update permissions',
        resource: 'permissions',
        action: 'write',
      },
    ];

    const createdPermissions: any[] = [];
    for (const permission of permissions) {
      const existing = await this.permissionRepository.findByName(
        permission.name,
      );
      if (!existing) {
        const created = await this.permissionRepository.create(permission);
        createdPermissions.push(created);
        console.log(`Created permission: ${permission.name}`);
      } else {
        createdPermissions.push(existing);
        console.log(`Permission already exists: ${permission.name}`);
      }
    }

    // Crear roles básicos
    const roles = [
      {
        name: 'admin',
        description: 'Administrator with full access',
      },
      {
        name: 'user',
        description: 'Regular user with basic access',
      },
      {
        name: 'manager',
        description: 'Manager with elevated access',
      },
    ];

    const createdRoles: any[] = [];
    for (const role of roles) {
      const existing = await this.roleRepository.findByName(role.name);
      if (!existing) {
        const created = await this.roleRepository.create(role);
        createdRoles.push(created);
        console.log(`Created role: ${role.name}`);
      } else {
        createdRoles.push(existing);
        console.log(`Role already exists: ${role.name}`);
      }
    }

    console.log('Roles and permissions initialization completed!');
    return { roles: createdRoles, permissions: createdPermissions };
  }
}
