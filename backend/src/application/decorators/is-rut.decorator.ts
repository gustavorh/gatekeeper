import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { RutValidator } from '../../utils/rut-validator';

/**
 * Custom validation decorator for Chilean RUT
 * Validates format: "123456789" or "12345678-9"
 * Also validates the verification digit
 */
export function IsRut(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isRut',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          // Check if value is a string
          if (typeof value !== 'string') {
            return false;
          }

          // Check if value is empty
          if (!value.trim()) {
            return false;
          }

          // Always normalize before validation
          const normalized = RutValidator.normalize(value);
          if (!normalized) {
            return false;
          }

          // Validate RUT format and checksum
          return RutValidator.isValid(normalized);
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;
          const propertyName = args.property;

          // Type validation
          if (typeof value !== 'string') {
            return `${propertyName} must be a string`;
          }

          // Empty value validation
          if (!value.trim()) {
            return `${propertyName} cannot be empty`;
          }

          // Format validation
          if (!RutValidator.isValidFormat(value)) {
            return `${propertyName} must have a valid format (e.g., 123456789 or 12345678-9)`;
          }

          // Checksum validation
          if (!RutValidator.isValidChecksum(value)) {
            return `${propertyName} has an invalid verification digit`;
          }

          return `${propertyName} must be a valid Chilean RUT`;
        },
      },
    });
  };
}
