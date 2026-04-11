import {
  Permission,
  CreatePermissionDto,
  UpdatePermissionDto,
} from './permission.entity';

describe('Permission Entity', () => {
  describe('Permission Interface', () => {
    it('should have all required properties', () => {
      const permission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'read_users',
        description: 'Can read user information',
        resource: 'users',
        action: 'read',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(permission).toHaveProperty('id');
      expect(permission).toHaveProperty('name');
      expect(permission).toHaveProperty('description');
      expect(permission).toHaveProperty('resource');
      expect(permission).toHaveProperty('action');
      expect(permission).toHaveProperty('isActive');
      expect(permission).toHaveProperty('createdAt');
      expect(permission).toHaveProperty('updatedAt');
    });

    it('should allow optional properties in UpdatePermissionDto', () => {
      const updateDto: UpdatePermissionDto = {
        name: 'write_users',
        description: 'Can write user information',
        resource: 'users',
        action: 'write',
      };

      expect(updateDto.name).toBe('write_users');
      expect(updateDto.description).toBe('Can write user information');
      expect(updateDto.resource).toBe('users');
      expect(updateDto.action).toBe('write');
      expect(updateDto.isActive).toBeUndefined();
    });

    it('should require all properties in CreatePermissionDto', () => {
      const createDto: CreatePermissionDto = {
        name: 'delete_users',
        description: 'Can delete users',
        resource: 'users',
        action: 'delete',
      };

      expect(createDto.name).toBe('delete_users');
      expect(createDto.description).toBe('Can delete users');
      expect(createDto.resource).toBe('users');
      expect(createDto.action).toBe('delete');
    });
  });

  describe('Type Validation', () => {
    it('should enforce correct types for all fields', () => {
      const permission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'read_users',
        description: 'Can read user information',
        resource: 'users',
        action: 'read',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(typeof permission.id).toBe('string');
      expect(typeof permission.name).toBe('string');
      expect(typeof permission.description).toBe('string');
      expect(typeof permission.resource).toBe('string');
      expect(typeof permission.action).toBe('string');
      expect(typeof permission.isActive).toBe('boolean');
      expect(permission.createdAt).toBeInstanceOf(Date);
      expect(permission.updatedAt).toBeInstanceOf(Date);
    });
  });
});
