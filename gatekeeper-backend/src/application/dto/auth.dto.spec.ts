import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { LoginDto, RegisterDto } from './auth.dto';

describe('Auth DTOs', () => {
  describe('LoginDto', () => {
    it('should validate correct login data', async () => {
      const loginData = {
        rut: '123456785',
        password: 'password123',
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBe(0);
    });

    it('should validate RUT with hyphen', async () => {
      const loginData = {
        rut: '12345678-5',
        password: 'password123',
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBe(0);
    });

    it('should reject invalid RUT format', async () => {
      const loginData = {
        rut: '1234567',
        password: 'password123',
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });

    it('should reject empty password', async () => {
      const loginData = {
        rut: '123456785',
        password: '',
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should reject password shorter than 6 characters', async () => {
      const loginData = {
        rut: '123456785',
        password: '12345',
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should reject non-string password', async () => {
      const loginData = {
        rut: '123456785',
        password: 123456 as any,
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isString).toBeDefined();
    });

    it('should reject empty RUT', async () => {
      const loginData = {
        rut: '',
        password: 'password123',
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });
  });

  describe('RegisterDto', () => {
    it('should validate correct registration data', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBe(0);
    });

    it('should validate RUT with hyphen', async () => {
      const registerData = {
        rut: '12345678-5',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBe(0);
    });

    it('should reject invalid email format', async () => {
      const registerData = {
        rut: '123456785',
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isEmail).toBeDefined();
    });

    it('should reject empty email', async () => {
      const registerData = {
        rut: '123456785',
        email: '',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should reject password shorter than 6 characters', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: '12345',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should reject empty firstName', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: '',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should reject empty lastName', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: '',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should reject non-string firstName', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: 123 as any,
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isString).toBeDefined();
    });

    it('should reject non-string lastName', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 123 as any,
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isString).toBeDefined();
    });

    it('should reject invalid RUT format', async () => {
      const registerData = {
        rut: '1234567',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });
  });

  describe('Transformations', () => {
    it('should transform email to lowercase', () => {
      const registerData = {
        rut: '123456785',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      expect(registerDto.email).toBe('test@example.com');
    });

    it('should trim firstName', () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: '  John  ',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      expect(registerDto.firstName).toBe('John');
    });

    it('should trim lastName', () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: '  Doe  ',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      expect(registerDto.lastName).toBe('Doe');
    });

    it('should normalize RUT', () => {
      const registerData = {
        rut: '12345678-5',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      expect(registerDto.rut).toBe('123456785');
    });
  });
});
