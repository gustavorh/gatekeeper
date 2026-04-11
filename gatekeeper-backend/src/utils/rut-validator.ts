/**
 * Chilean RUT (Rol Único Tributario) validator and formatter
 * Supports formats: "123456789" or "12345678-9"
 */
export class RutValidator {
  /**
   * Validates the format of a Chilean RUT
   * Accepts: "123456789" (9 chars, no hyphen), "12345678-9" (with hyphen), or "12.345.678-9" (with dots)
   * @param rut RUT to validate
   * @returns true if format is valid
   */
  static isValidFormat(rut: string): boolean {
    if (typeof rut !== 'string') return false;

    // 8 digits + verification digit (0-9 or K) without hyphen
    const plainRegex = /^\d{8}[0-9kK]$/;
    // 8 digits + hyphen + verification digit (0-9 or K)
    const hyphenRegex = /^\d{8}-[0-9kK]$/;
    // 8 digits with dots + hyphen + verification digit (0-9 or K)
    const dotsRegex = /^\d{1,3}(\.\d{3}){2}-[0-9kK]$/;

    // Check if RUT starts with 0 (leading zeros not allowed)
    if (rut.startsWith('0')) return false;

    return plainRegex.test(rut) || hyphenRegex.test(rut) || dotsRegex.test(rut);
  }

  /**
   * Normalizes RUT to 9 characters (no hyphen, no dots, uppercase)
   * Example: "12345678-9" => "123456789"
   * @param rut RUT to normalize
   * @returns Normalized RUT or empty string if invalid
   */
  static normalize(rut: string): string {
    if (typeof rut !== 'string') return '';

    // Remove everything except numbers and K/k, convert to uppercase
    const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();

    // Must be exactly 9 characters
    return clean.length === 9 ? clean : '';
  }

  /**
   * Validates the verification digit of a RUT
   * @param rut RUT in any supported format
   * @returns true if verification digit is valid
   */
  static isValidChecksum(rut: string): boolean {
    const cleanRut = this.normalize(rut);
    if (cleanRut.length !== 9) return false;

    const number = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);

    let sum = 0;
    let multiplier = 2;

    // Calculate weighted sum from right to left
    for (let i = number.length - 1; i >= 0; i--) {
      sum += parseInt(number[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const expectedDv = 11 - remainder;
    let calculatedDv: string;

    if (expectedDv === 11) {
      calculatedDv = '0';
    } else if (expectedDv === 10) {
      calculatedDv = 'K';
    } else {
      calculatedDv = expectedDv.toString();
    }

    return calculatedDv === dv;
  }

  /**
   * Validates that RUT is valid (format and verification digit)
   * @param rut RUT to validate
   * @returns true if RUT is valid
   */
  static isValid(rut: string): boolean {
    if (typeof rut !== 'string') return false;

    // Check if empty after normalization
    const normalized = this.normalize(rut);
    if (!normalized) return false;

    return this.isValidFormat(rut) && this.isValidChecksum(rut);
  }

  /**
   * Formats a normalized RUT (9 characters) to "12345678-9"
   * @param rut Normalized RUT (e.g., 123456789)
   * @returns Formatted RUT or original if invalid
   */
  static format(rut: string): string {
    const cleanRut = this.normalize(rut);
    if (cleanRut.length !== 9) return rut;

    const number = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1);
    return `${number}-${dv}`;
  }

  /**
   * Calculates the correct verification digit for a RUT number
   * @param number RUT number (8 digits)
   * @returns Calculated verification digit
   * @throws Error if number doesn't have exactly 8 digits
   */
  static calculateDv(number: string): string {
    if (typeof number !== 'string' || number.length !== 8) {
      throw new Error('RUT number must have exactly 8 digits');
    }

    // Validate that all characters are digits
    if (!/^\d{8}$/.test(number)) {
      throw new Error('RUT number must contain only digits');
    }

    let sum = 0;
    let multiplier = 2;

    // Calculate weighted sum from right to left
    for (let i = number.length - 1; i >= 0; i--) {
      sum += parseInt(number[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    const expectedDv = 11 - remainder;

    if (expectedDv === 11) {
      return '0';
    } else if (expectedDv === 10) {
      return 'K';
    } else {
      return expectedDv.toString();
    }
  }

  /**
   * Generates a complete RUT from a number
   * @param number RUT number (8 digits)
   * @returns Complete RUT with verification digit or null if invalid
   */
  static generateRut(number: string): string | null {
    try {
      const dv = this.calculateDv(number);
      return `${number}-${dv}`;
    } catch {
      return null;
    }
  }
}
