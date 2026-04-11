import {
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
} from '../entities/permission.entity';

export interface IPermissionRepository {
  create(permission: CreatePermissionDto): Promise<Permission>;
  findById(id: string): Promise<Permission | null>;
  findByName(name: string): Promise<Permission | null>;
  findByResourceAndAction(
    resource: string,
    action: string,
  ): Promise<Permission | null>;
  findAll(): Promise<Permission[]>;
  update(id: string, permission: UpdatePermissionDto): Promise<Permission>;
  delete(id: string): Promise<void>;
  findPermissionsByRole(roleId: string): Promise<Permission[]>;
}
