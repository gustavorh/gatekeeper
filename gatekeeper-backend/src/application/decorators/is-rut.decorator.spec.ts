import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { IsRut } from './is-rut.decorator';

// Test class to validate the decorator
class TestClass {
  @IsRut()
  rut: string;
}

describe('IsRut Decorator', () => {
  describe('Validation', () => {
    it('should validate correct RUT format without hyphen', async () => {
      const testData = {
        rut: '123456785',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBe(0);
    });

    it('should validate correct RUT format with hyphen', async () => {
      const testData = {
        rut: '12345678-5',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBe(0);
    });

    it('should validate RUT with K verification digit', async () => {
      const testData = {
        rut: '12345670K',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBe(0);
    });

    it('should validate RUT with lowercase k verification digit', async () => {
      const testData = {
        rut: '12345670k',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBe(0);
    });

    it('should reject RUT that is too short', async () => {
      const testData = {
        rut: '1234567',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });

    it('should reject RUT that is too long', async () => {
      const testData = {
        rut: '1234567890',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });

    it('should reject RUT with invalid format', async () => {
      const testData = {
        rut: '12345678-X',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });

    it('should reject empty RUT', async () => {
      const testData = {
        rut: '',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });

    it('should reject RUT with only spaces', async () => {
      const testData = {
        rut: '   ',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });

    it('should reject non-string values', async () => {
      const testData = {
        rut: 123456789 as any,
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });

    it('should reject null values', async () => {
      const testData = {
        rut: null as any,
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });

    it('should reject undefined values', async () => {
      const testData = {
        rut: undefined as any,
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBeDefined();
    });
  });

  describe('Error Messages', () => {
    it('should provide appropriate error message for non-string value', async () => {
      const testData = {
        rut: 123456789 as any,
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors[0].constraints?.isRut).toContain('must be a string');
    });

    it('should provide appropriate error message for empty value', async () => {
      const testData = {
        rut: '',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors[0].constraints?.isRut).toContain('cannot be empty');
    });

    it('should provide appropriate error message for invalid format', async () => {
      const testData = {
        rut: '1234567',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors[0].constraints?.isRut).toContain('valid format');
    });

    it('should provide appropriate error message for invalid checksum', async () => {
      const testData = {
        rut: '123456788', // Invalid checksum
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors[0].constraints?.isRut).toContain('verification digit');
    });
  });

  describe('Custom Validation Options', () => {
    class TestClassWithCustomMessage {
      @IsRut({
        message: 'Custom RUT validation error message',
      })
      rut: string;
    }

    it('should use custom error message', async () => {
      const testData = {
        rut: '1234567',
      };

      const testObject = plainToClass(TestClassWithCustomMessage, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isRut).toBe(
        'Custom RUT validation error message',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle RUT with spaces around it', async () => {
      const testData = {
        rut: ' 123456785 ',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBe(0);
    });

    it('should handle RUT with dots', async () => {
      const testData = {
        rut: '12.345.678-5',
      };

      const testObject = plainToClass(TestClass, testData);
      const errors = await validate(testObject);

      expect(errors.length).toBe(0);
    });
  });
});
