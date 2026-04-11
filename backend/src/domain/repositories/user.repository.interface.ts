import { User, CreateUserDto, UpdateUserDto } from '../entities/user.entity';

export interface IUserRepository {
  create(user: CreateUserDto): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByRut(rut: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  update(id: string, user: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
  existsByRut(rut: string): Promise<boolean>;
  existsByEmail(email: string): Promise<boolean>;
}
