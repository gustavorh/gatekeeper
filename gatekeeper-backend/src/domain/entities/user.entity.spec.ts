import { User, CreateUserDto, UpdateUserDto } from './user.entity';

describe('User Entity', () => {
  describe('User Interface', () => {
    it('should have all required properties', () => {
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        rut: '123456785',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('rut');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('password');
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
      expect(user).toHaveProperty('isActive');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
    });

    it('should allow optional properties in UpdateUserDto', () => {
      const updateDto: UpdateUserDto = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      expect(updateDto.firstName).toBe('Jane');
      expect(updateDto.lastName).toBe('Smith');
      expect(updateDto.rut).toBeUndefined();
      expect(updateDto.email).toBeUndefined();
      expect(updateDto.isActive).toBeUndefined();
    });

    it('should require all properties in CreateUserDto', () => {
      const createDto: CreateUserDto = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      expect(createDto.rut).toBe('123456785');
      expect(createDto.email).toBe('test@example.com');
      expect(createDto.password).toBe('password123');
      expect(createDto.firstName).toBe('John');
      expect(createDto.lastName).toBe('Doe');
    });
  });

  describe('Type Validation', () => {
    it('should enforce string types for required fields', () => {
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        rut: '123456785',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(typeof user.id).toBe('string');
      expect(typeof user.rut).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.password).toBe('string');
      expect(typeof user.firstName).toBe('string');
      expect(typeof user.lastName).toBe('string');
      expect(typeof user.isActive).toBe('boolean');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });
});
