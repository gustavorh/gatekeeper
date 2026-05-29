import {
  mysqlTable,
  text,
  timestamp,
  boolean,
  varchar,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';
import { mysqlEnum } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  rut: varchar('rut', { length: 9 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const roles = mysqlTable('roles', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const permissions = mysqlTable('permissions', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description').notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// C1: composite UNIQUE index to prevent duplicate role assignments
// C2: ON DELETE CASCADE so removing a user/role cleans up junction rows
export const userRoles = mysqlTable(
  'user_roles',
  {
    id: varchar('id', { length: 36 }).primaryKey().notNull(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: varchar('role_id', { length: 36 })
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userRoleUnique: uniqueIndex('user_roles_unique').on(
      table.userId,
      table.roleId,
    ),
  }),
);

// C1: composite UNIQUE index to prevent duplicate permission assignments
// C2: ON DELETE CASCADE so removing a role/permission cleans up junction rows
export const rolePermissions = mysqlTable(
  'role_permissions',
  {
    id: varchar('id', { length: 36 }).primaryKey().notNull(),
    roleId: varchar('role_id', { length: 36 })
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: varchar('permission_id', { length: 36 })
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    rolePermissionUnique: uniqueIndex('role_permissions_unique').on(
      table.roleId,
      table.permissionId,
    ),
  }),
);

// C2: ON DELETE CASCADE so removing a user cleans up their shifts
// C3 / P1-3: indexes on userId, status, composite (userId, status), and createdAt
export const shifts = mysqlTable(
  'shifts',
  {
    id: varchar('id', { length: 36 }).primaryKey().notNull(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    clockInTime: timestamp('clock_in_time').notNull(),
    clockOutTime: timestamp('clock_out_time'),
    lunchStartTime: timestamp('lunch_start_time'),
    lunchEndTime: timestamp('lunch_end_time'),
    status: mysqlEnum('status', ['pending', 'active', 'completed'])
      .notNull()
      .default('pending'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('shifts_user_id_idx').on(table.userId),
    statusIdx: index('shifts_status_idx').on(table.status),
    userStatusIdx: index('shifts_user_status_idx').on(
      table.userId,
      table.status,
    ),
    createdAtIdx: index('shifts_created_at_idx').on(table.createdAt),
  }),
);
