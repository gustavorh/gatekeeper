/**
 * Public user entity — no password field.
 * This is what flows up to the application and presentation layers.
 */
export interface User {
  id: string;
  rut: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Internal-only user record with password hash.
 * Only used in auth flows (login / change-password).
 * Must never be returned to controllers or serialized in responses.
 */
export interface UserWithPassword extends User {
  password: string;
}

export interface CreateUserDto {
  rut: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserDto {
  rut?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}
