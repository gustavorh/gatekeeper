import { Role, CreateRoleDto, UpdateRoleDto } from '../entities/role.entity';

export interface IRoleRepository {
  create(role: CreateRoleDto): Promise<Role>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
  update(id: string, role: UpdateRoleDto): Promise<Role>;
  delete(id: string): Promise<void>;
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  removeRoleFromUser(userId: string, roleId: string): Promise<void>;
  removeAllUserRoles(userId: string): Promise<void>;
  findUserRoles(userId: string): Promise<Role[]>;
}
