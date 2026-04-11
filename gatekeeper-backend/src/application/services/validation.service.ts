import { Injectable } from '@nestjs/common';
import { ValidationHelper } from '../../utils/validation.helper';
import { RutValidator } from '../../utils/rut-validator';

/**
 * Service for handling validation logic across the application
 */
@Injectable()
export class ValidationService {
  /**
   * Validates a Chilean RUT with detailed error information
   * @param rut RUT to validate
   * @returns Validation result with error details
   */
  validateRut(rut: string) {
    return ValidationHelper.validateRutWithDetails(rut);
  }

  /**
   * Validates and normalizes a RUT for storage
   * @param rut RUT to validate and normalize
   * @returns Normalized RUT if valid, null if invalid
   */
  validateAndNormalizeRut(rut: string): string | null {
    return ValidationHelper.validateAndNormalizeRut(rut);
  }

  /**
   * Formats a RUT for display
   * @param rut RUT to format
   * @returns Formatted RUT
   */
  formatRutForDisplay(rut: string): string {
    return ValidationHelper.formatRut(rut);
  }

  /**
   * Generates a complete RUT from a number
   * @param number RUT number (8 digits)
   * @returns Complete RUT with verification digit
   */
  generateRut(number: string): string | null {
    return ValidationHelper.generateRut(number);
  }

  /**
   * Validates user registration data
   * @param data User registration data
   * @returns Validation result
   */
  validateUserRegistration(data: {
    rut: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    const errors: string[] = [];

    // Validate RUT
    const rutValidation = this.validateRut(data.rut);
    if (!rutValidation.isValid) {
      errors.push(`RUT: ${rutValidation.error}`);
    }

    // Validate email
    if (!ValidationHelper.isValidEmail(data.email)) {
      errors.push('Email: Invalid email format');
    }

    // Validate password
    if (!ValidationHelper.isValidPassword(data.password)) {
      errors.push('Password: Must have at least 6 characters');
    }

    // Validate names
    if (!data.firstName?.trim()) {
      errors.push('First name: Cannot be empty');
    }

    if (!data.lastName?.trim()) {
      errors.push('Last name: Cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      normalizedData:
        errors.length === 0
          ? {
              rut: rutValidation.normalized,
              email: data.email.trim().toLowerCase(),
              password: data.password,
              firstName: data.firstName.trim(),
              lastName: data.lastName.trim(),
            }
          : null,
    };
  }

  /**
   * Validates user login data
   * @param data User login data
   * @returns Validation result
   */
  validateUserLogin(data: { rut: string; password: string }) {
    const errors: string[] = [];

    // Validate RUT
    const rutValidation = this.validateRut(data.rut);
    if (!rutValidation.isValid) {
      errors.push(`RUT: ${rutValidation.error}`);
    }

    // Validate password
    if (!data.password?.trim()) {
      errors.push('Password: Cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      normalizedData:
        errors.length === 0
          ? {
              rut: rutValidation.normalized,
              password: data.password,
            }
          : null,
    };
  }

  /**
   * Sanitizes user input
   * @param input Input to sanitize
   * @returns Sanitized input
   */
  sanitizeInput(input: string): string {
    return ValidationHelper.sanitizeInput(input);
  }
}
