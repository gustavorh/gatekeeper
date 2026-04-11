import {
  mysqlTable,
  text,
  timestamp,
  boolean,
  varchar,
  int,
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

export const userRoles = mysqlTable('user_roles', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  roleId: varchar('role_id', { length: 36 })
    .notNull()
    .references(() => roles.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const rolePermissions = mysqlTable('role_permissions', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  roleId: varchar('role_id', { length: 36 })
    .notNull()
    .references(() => roles.id),
  permissionId: varchar('permission_id', { length: 36 })
    .notNull()
    .references(() => permissions.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shifts = mysqlTable('shifts', {
  id: varchar('id', { length: 36 }).primaryKey().notNull(),
  userId: varchar('user_id', { length: 36 })
    .notNull()
    .references(() => users.id),
  clockInTime: timestamp('clock_in_time').notNull(),
  clockOutTime: timestamp('clock_out_time'),
  lunchStartTime: timestamp('lunch_start_time'),
  lunchEndTime: timestamp('lunch_end_time'),
  status: mysqlEnum('status', ['pending', 'active', 'completed'])
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
