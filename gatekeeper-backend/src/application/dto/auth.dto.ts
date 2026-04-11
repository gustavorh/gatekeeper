import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsRut } from '../decorators/is-rut.decorator';
import { RutValidator } from '../../utils/rut-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for user login
 * Enforces validation at the presentation layer
 */
export class LoginDto {
  @ApiProperty({
    description: 'Chilean RUT (Rol Único Tributario)',
    example: '123456785',
    pattern: '^[0-9]{7,8}-?[0-9kK]$',
    minLength: 8,
    maxLength: 10,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return RutValidator.normalize(value);
    }
    return value;
  })
  @IsRut({
    message:
      'RUT must have a valid format (e.g., 123456789 or 12345678-9) and correct verification digit',
  })
  @IsNotEmpty({ message: 'RUT is required' })
  rut: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  password: string;
}

/**
 * DTO for user registration
 * Enforces validation at the presentation layer
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Chilean RUT (Rol Único Tributario)',
    example: '123456785',
    pattern: '^[0-9]{7,8}-?[0-9kK]$',
    minLength: 8,
    maxLength: 10,
  })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return RutValidator.normalize(value);
    }
    return value;
  })
  @IsRut({
    message:
      'RUT must have a valid format (e.g., 123456789 or 12345678-9) and correct verification digit',
  })
  @IsNotEmpty({ message: 'RUT is required' })
  rut: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email must have a valid format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return value;
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must have at least 6 characters' })
  password: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 1,
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 1,
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    return value;
  })
  lastName: string;
}
