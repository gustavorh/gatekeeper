import { RutValidator } from './rut-validator';

/**
 * Centralized validation utilities for the application
 */
export class ValidationHelper {
  /**
   * Validates and normalizes a Chilean RUT
   * @param rut RUT to validate and normalize
   * @returns Normalized RUT if valid, null if invalid
   */
  static validateAndNormalizeRut(rut: string): string | null {
    if (!RutValidator.isValid(rut)) {
      return null;
    }
    return RutValidator.normalize(rut);
  }

  /**
   * Validates a Chilean RUT and returns detailed error information
   * @param rut RUT to validate
   * @returns Validation result with error details
   */
  static validateRutWithDetails(rut: string): {
    isValid: boolean;
    error?: string;
    normalized?: string;
  } {
    // Type check
    if (typeof rut !== 'string') {
      return {
        isValid: false,
        error: 'RUT must be a string',
      };
    }

    // Empty check
    if (!rut.trim()) {
      return {
        isValid: false,
        error: 'RUT cannot be empty',
      };
    }

    // Format check
    if (!RutValidator.isValidFormat(rut)) {
      return {
        isValid: false,
        error: 'RUT must have a valid format (e.g., 123456789 or 12345678-9)',
      };
    }

    // Checksum check
    if (!RutValidator.isValidChecksum(rut)) {
      return {
        isValid: false,
        error: 'RUT has an invalid verification digit',
      };
    }

    // All validations passed
    return {
      isValid: true,
      normalized: RutValidator.normalize(rut),
    };
  }

  /**
   * Formats a RUT to the standard format with hyphen
   * @param rut RUT to format
   * @returns Formatted RUT or original if invalid
   */
  static formatRut(rut: string): string {
    if (!RutValidator.isValid(rut)) {
      return rut; // Return original if invalid
    }
    return RutValidator.format(rut);
  }

  /**
   * Generates a complete RUT from a number
   * @param number RUT number (8 digits)
   * @returns Complete RUT with verification digit or null if invalid
   */
  static generateRut(number: string): string | null {
    try {
      return RutValidator.generateRut(number);
    } catch (error) {
      return null;
    }
  }

  /**
   * Sanitizes user input by removing unwanted characters
   * @param input Input string to sanitize
   * @returns Sanitized string
   */
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }
    return input.trim();
  }

  /**
   * Validates email format
   * @param email Email to validate
   * @returns true if email format is valid
   */
  static isValidEmail(email: string): boolean {
    if (typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Validates password strength
   * @param password Password to validate
   * @param minLength Minimum length (default: 6)
   * @returns true if password meets requirements
   */
  static isValidPassword(password: string, minLength: number = 6): boolean {
    if (typeof password !== 'string') return false;
    return password.length >= minLength;
  }
}
