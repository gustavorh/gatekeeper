import { Role, CreateRoleDto, UpdateRoleDto } from './role.entity';

describe('Role Entity', () => {
  describe('Role Interface', () => {
    it('should have all required properties', () => {
      const role: Role = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'admin',
        description: 'Administrator role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(role).toHaveProperty('id');
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('description');
      expect(role).toHaveProperty('isActive');
      expect(role).toHaveProperty('createdAt');
      expect(role).toHaveProperty('updatedAt');
    });

    it('should allow optional properties in UpdateRoleDto', () => {
      const updateDto: UpdateRoleDto = {
        name: 'user',
        description: 'Regular user role',
      };

      expect(updateDto.name).toBe('user');
      expect(updateDto.description).toBe('Regular user role');
      expect(updateDto.isActive).toBeUndefined();
    });

    it('should require all properties in CreateRoleDto', () => {
      const createDto: CreateRoleDto = {
        name: 'manager',
        description: 'Manager role',
      };

      expect(createDto.name).toBe('manager');
      expect(createDto.description).toBe('Manager role');
    });
  });

  describe('Type Validation', () => {
    it('should enforce correct types for all fields', () => {
      const role: Role = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'admin',
        description: 'Administrator role',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(typeof role.id).toBe('string');
      expect(typeof role.name).toBe('string');
      expect(typeof role.description).toBe('string');
      expect(typeof role.isActive).toBe('boolean');
      expect(role.createdAt).toBeInstanceOf(Date);
      expect(role.updatedAt).toBeInstanceOf(Date);
    });
  });
});
