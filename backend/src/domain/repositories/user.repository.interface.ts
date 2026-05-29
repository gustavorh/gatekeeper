import type { User, UserWithPassword, CreateUserDto, UpdateUserDto } from '../entities/user.entity';

export interface FindAllOptions {
  page?: number;
  limit?: number;
  onlyActive?: boolean;
}

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface IUserRepository {
  create(user: CreateUserDto): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByRut(rut: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /**
   * Returns user record including password hash, looked up by email.
   * Only for auth flows — do not expose outside of auth layer.
   */
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  /**
   * Returns user record including password hash, looked up by RUT.
   * Only for auth flows — do not expose outside of auth layer.
   */
  findByRutWithPassword(rut: string): Promise<UserWithPassword | null>;
  /**
   * Paginated, optionally filtered list of users.
   */
  findAll(opts?: FindAllOptions): Promise<PaginatedUsers>;
  /**
   * Non-paginated list for in-memory aggregation or small datasets.
   */
  findAllRaw(opts?: { onlyActive?: boolean }): Promise<User[]>;
  findByIdWithRolesAndPermissions(userId: string): Promise<{
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
  } | null>;
  update(id: string, user: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
  existsByRut(rut: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}
