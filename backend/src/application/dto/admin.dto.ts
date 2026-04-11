import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsArray,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RegisterDto } from './auth.dto';

// User Management DTOs
export class CreateUserAdminDto implements RegisterDto {
  @ApiProperty({ description: 'RUT del usuario', example: '12345678-9' })
  @IsString()
  rut: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'Pérez' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Roles a asignar al usuario',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

export class UpdateUserAdminDto {
  @ApiPropertyOptional({
    description: 'RUT del usuario',
    example: '12345678-9',
  })
  @IsOptional()
  @IsString()
  rut?: string;

  @ApiPropertyOptional({
    description: 'Email del usuario',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Nombre del usuario', example: 'Juan' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Estado activo del usuario' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Roles a asignar al usuario',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}

// Role Management DTOs
export class CreateRoleAdminDto {
  @ApiProperty({ description: 'Nombre del rol', example: 'manager' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Descripción del rol',
    example: 'Rol de gerente con permisos elevados',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Permisos a asignar al rol',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

export class UpdateRoleAdminDto {
  @ApiPropertyOptional({ description: 'Nombre del rol', example: 'manager' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción del rol',
    example: 'Rol de gerente con permisos elevados',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Estado activo del rol' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Permisos a asignar al rol',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissionIds?: string[];
}

// Permission Management DTOs
export class CreatePermissionAdminDto {
  @ApiProperty({ description: 'Nombre del permiso', example: 'read_users' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Descripción del permiso',
    example: 'Can read user information',
  })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Recurso del permiso', example: 'users' })
  @IsString()
  @MaxLength(100)
  resource: string;

  @ApiProperty({ description: 'Acción del permiso', example: 'read' })
  @IsString()
  @MaxLength(50)
  action: string;
}

export class UpdatePermissionAdminDto {
  @ApiPropertyOptional({
    description: 'Nombre del permiso',
    example: 'read_users',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción del permiso',
    example: 'Can read user information',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Recurso del permiso', example: 'users' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resource?: string;

  @ApiPropertyOptional({ description: 'Acción del permiso', example: 'read' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;

  @ApiPropertyOptional({ description: 'Estado activo del permiso' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// Query DTOs
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Elementos por página', default: 10 })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Término de búsqueda' })
  @IsOptional()
  @IsString()
  search?: string;
}

// Response DTOs
export class UserResponseDto {
  @ApiProperty({ description: 'ID del usuario' })
  id: string;

  @ApiProperty({ description: 'RUT del usuario' })
  rut: string;

  @ApiProperty({ description: 'Email del usuario' })
  email: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario' })
  lastName: string;

  @ApiProperty({ description: 'Estado activo del usuario' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}

export class RoleResponseDto {
  @ApiProperty({ description: 'ID del rol' })
  id: string;

  @ApiProperty({ description: 'Nombre del rol' })
  name: string;

  @ApiProperty({ description: 'Descripción del rol' })
  description: string;

  @ApiProperty({ description: 'Estado activo del rol' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}

export class PermissionResponseDto {
  @ApiProperty({ description: 'ID del permiso' })
  id: string;

  @ApiProperty({ description: 'Nombre del permiso' })
  name: string;

  @ApiProperty({ description: 'Descripción del permiso' })
  description: string;

  @ApiProperty({ description: 'Recurso del permiso' })
  resource: string;

  @ApiProperty({ description: 'Acción del permiso' })
  action: string;

  @ApiProperty({ description: 'Estado activo del permiso' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;
}

export class UserListResponse {
  @ApiProperty({ description: 'Lista de usuarios', type: [UserResponseDto] })
  users: UserResponseDto[];

  @ApiProperty({ description: 'Total de usuarios' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;
}

export class RoleListResponse {
  @ApiProperty({ description: 'Lista de roles', type: [RoleResponseDto] })
  roles: RoleResponseDto[];

  @ApiProperty({ description: 'Total de roles' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;
}

export class PermissionListResponse {
  @ApiProperty({
    description: 'Lista de permisos',
    type: [PermissionResponseDto],
  })
  permissions: PermissionResponseDto[];

  @ApiProperty({ description: 'Total de permisos' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;
}

// Enhanced User Response DTOs with Roles and Permissions
export class UserRolePermissionDto {
  @ApiProperty({ description: 'ID del rol' })
  id: string;

  @ApiProperty({ description: 'Nombre del rol' })
  name: string;

  @ApiProperty({ description: 'Descripción del rol' })
  description: string;

  @ApiProperty({ description: 'Estado activo del rol' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Permisos del rol',
    type: [PermissionResponseDto],
  })
  permissions: PermissionResponseDto[];
}

export class UserWithRolesResponseDto {
  @ApiProperty({ description: 'ID del usuario' })
  id: string;

  @ApiProperty({ description: 'RUT del usuario' })
  rut: string;

  @ApiProperty({ description: 'Email del usuario' })
  email: string;

  @ApiProperty({ description: 'Nombre del usuario' })
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario' })
  lastName: string;

  @ApiProperty({ description: 'Estado activo del usuario' })
  isActive: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de actualización' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Roles del usuario con sus permisos',
    type: [UserRolePermissionDto],
  })
  roles: UserRolePermissionDto[];
}

export class UserListWithRolesResponse {
  @ApiProperty({
    description: 'Lista de usuarios con roles y permisos',
    type: [UserWithRolesResponseDto],
  })
  users: UserWithRolesResponseDto[];

  @ApiProperty({ description: 'Total de usuarios' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Elementos por página' })
  limit: number;
}
