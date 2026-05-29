import type { InferSelectModel } from 'drizzle-orm';
import type { User, UserWithPassword } from '../../../domain/entities/user.entity';
import type { users } from '../../database/schema';

type UserRow = InferSelectModel<typeof users>;

/**
 * Maps a Drizzle row to the public User entity (no password field).
 * Use in all repository methods that return data to the application layer.
 */
export function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    rut: row.rut,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Maps a Drizzle row to UserWithPassword.
 * Only for use in auth flows that need to verify the password hash.
 * Must never be returned to controllers or serialized in responses.
 */
export function rowToUserWithPassword(row: UserRow): UserWithPassword {
  return {
    id: row.id,
    rut: row.rut,
    email: row.email,
    password: row.password,
    firstName: row.firstName,
    lastName: row.lastName,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
