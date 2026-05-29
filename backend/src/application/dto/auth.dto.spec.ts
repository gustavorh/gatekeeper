import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { LoginDto, RegisterDto } from './auth.dto';

// B3 compliant password: ≥12 chars, at least one uppercase, one lowercase, one digit
const VALID_PASSWORD = 'SecurePass123!';

describe('Auth DTOs', () => {
  describe('LoginDto', () => {
    it('should validate correct login data', async () => {
      const loginData = {
        rut: '123456785',
        password: VALID_PASSWORD,
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBe(0);
    });

    it('should validate RUT with hyphen', async () => {
      const loginData = {
        rut: '12345678-5',
        password: VALID_PASSWORD,
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBe(0);
    });

    it('should reject invalid RUT format', async () => {
      const loginData = {
        rut: '1234567',
        password: VALID_PASSWORD,
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

    it('should reject password shorter than 12 characters', async () => {
      const loginData = {
        rut: '123456785',
        password: 'Short1!',
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should reject password without uppercase letter', async () => {
      const loginData = {
        rut: '123456785',
        password: 'nouppercase123!',
      };

      const loginDto = plainToClass(LoginDto, loginData);
      const errors = await validate(loginDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should reject non-string password', async () => {
      const loginData = {
        rut: '123456785',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isNotEmpty).toBeDefined();
    });

    it('should reject password shorter than 12 characters', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'Short1!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.minLength).toBeDefined();
    });

    it('should reject password without complexity requirements', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: 'alllowercase1234',
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      const errors = await validate(registerDto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.matches).toBeDefined();
    });

    it('should reject empty firstName', async () => {
      const registerData = {
        rut: '123456785',
        email: 'test@example.com',
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
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
        password: VALID_PASSWORD,
        firstName: 'John',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
        firstName: 'John',
        lastName: 'Doe',
      };

      const registerDto = plainToClass(RegisterDto, registerData);
      expect(registerDto.rut).toBe('123456785');
    });
  });
});
