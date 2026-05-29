import type { User } from '../entities/user.entity';

/**
 * Domain-level input for the login operation.
 * Mirrors the fields of LoginDto without depending on the application layer.
 */
export interface LoginData {
  rut: string;
  password: string;
}

/**
 * Domain-level input for the register operation.
 * Mirrors the fields of RegisterDto without depending on the application layer.
 */
export interface RegisterData {
  rut: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Domain-level representation of an authenticated user with a JWT.
 * The `user` field intentionally omits the password hash.
 */
export interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
}

/**
 * Contract for the authentication service.
 * All types belong to the domain layer; no application DTOs are imported here.
 */
export interface IAuthService {
  login(loginData: LoginData): Promise<AuthResult>;
  register(registerData: RegisterData): Promise<AuthResult>;
  validateToken(token: string): Promise<Omit<User, 'password'> | null>;
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hashedPassword: string): Promise<boolean>;
}
