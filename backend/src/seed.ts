import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

import { AppModule } from './app.module';
import { AuthService } from './application/services/auth.service';
import type { IPermissionRepository } from './domain/repositories/permission.repository.interface';
import type { IRoleRepository } from './domain/repositories/role.repository.interface';
import type { IUserRepository } from './domain/repositories/user.repository.interface';
import {
  rolePermissions,
  userRoles,
} from './infrastructure/database/schema';

const PERMISSIONS = [
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
] as const;

const ROLES = [
  { name: 'admin', description: 'Administrator with full access' },
  { name: 'manager', description: 'Manager with elevated access' },
  { name: 'user', description: 'Regular user with basic access' },
] as const;

const ROLE_PERMISSION_MAP: Record<string, readonly string[]> = {
  admin: PERMISSIONS.map((p) => p.name),
  manager: ['read_users', 'read_roles', 'read_permissions'],
  user: [],
};

async function seed(): Promise<void> {
  const logger = new Logger('Seeder');
  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: false,
    logger: ['error', 'warn', 'log'],
  });

  try {
    const db = app.get<any>('DATABASE');
    const userRepo = app.get<IUserRepository>('IUserRepository');
    const roleRepo = app.get<IRoleRepository>('IRoleRepository');
    const permRepo = app.get<IPermissionRepository>('IPermissionRepository');
    const authService = app.get(AuthService);

    logger.log('Seeding permissions…');
    const permByName = new Map<string, { id: string }>();
    for (const p of PERMISSIONS) {
      const existing = await permRepo.findByName(p.name);
      if (existing) {
        permByName.set(p.name, existing);
      } else {
        const created = await permRepo.create(p);
        permByName.set(p.name, created);
        logger.log(`  + ${p.name}`);
      }
    }

    logger.log('Seeding roles…');
    const roleByName = new Map<string, { id: string }>();
    for (const r of ROLES) {
      const existing = await roleRepo.findByName(r.name);
      if (existing) {
        roleByName.set(r.name, existing);
      } else {
        const created = await roleRepo.create(r);
        roleByName.set(r.name, created);
        logger.log(`  + ${r.name}`);
      }
    }

    logger.log('Seeding role_permissions…');
    for (const [roleName, permNames] of Object.entries(ROLE_PERMISSION_MAP)) {
      const role = roleByName.get(roleName);
      if (!role) continue;
      for (const permName of permNames) {
        const permission = permByName.get(permName);
        if (!permission) continue;
        const [existing] = await db
          .select()
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, role.id),
              eq(rolePermissions.permissionId, permission.id),
            ),
          )
          .limit(1);
        if (!existing) {
          await db.insert(rolePermissions).values({
            id: uuidv4(),
            roleId: role.id,
            permissionId: permission.id,
          });
          logger.log(`  + ${roleName} ↔ ${permName}`);
        }
      }
    }

    const adminRut = process.env.SEED_ADMIN_RUT ?? '111111111';
    const adminEmail =
      process.env.SEED_ADMIN_EMAIL ?? 'admin@gatekeeper.local';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234';
    const adminFirstName = process.env.SEED_ADMIN_FIRST_NAME ?? 'Admin';
    const adminLastName = process.env.SEED_ADMIN_LAST_NAME ?? 'Gatekeeper';

    logger.log('Seeding admin user…');
    let adminUser = await userRepo.findByEmail(adminEmail);
    if (!adminUser) {
      const hashedPassword = await authService.hashPassword(adminPassword);
      adminUser = await userRepo.create({
        rut: adminRut,
        email: adminEmail,
        password: hashedPassword,
        firstName: adminFirstName,
        lastName: adminLastName,
      });
      logger.log(`  + ${adminEmail}`);
    } else {
      logger.log(`  = ${adminEmail} (already exists)`);
    }

    const adminRole = roleByName.get('admin');
    if (adminRole) {
      const [existingLink] = await db
        .select()
        .from(userRoles)
        .where(
          and(
            eq(userRoles.userId, adminUser.id),
            eq(userRoles.roleId, adminRole.id),
          ),
        )
        .limit(1);
      if (!existingLink) {
        await roleRepo.assignRoleToUser(adminUser.id, adminRole.id);
        logger.log(`  + ${adminEmail} ↔ admin role`);
      }
    }

    logger.log('');
    logger.log('Seed completado. Credenciales del admin:');
    logger.log(`  RUT:      ${adminRut}`);
    logger.log(`  Email:    ${adminEmail}`);
    logger.log(`  Password: ${adminPassword}`);
  } finally {
    await app.close();
  }
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
