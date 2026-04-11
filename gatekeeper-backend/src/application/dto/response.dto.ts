import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T = any> {
  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Response data', required: false })
  data?: T;

  @ApiProperty({ description: 'Error message if any', required: false })
  error?: string;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string;

  @ApiProperty({ description: 'API path', required: false })
  path?: string;

  @ApiProperty({ description: 'API endpoint', required: false })
  endpoint?: string;
}

export class PaginationInfo {
  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}

export class PaginatedData<T> {
  @ApiProperty({ description: 'Array of items' })
  items: T[];

  @ApiProperty({ description: 'Pagination information' })
  pagination: PaginationInfo;
}

export class PaginatedResponse<T> {
  @ApiProperty({ description: 'Indicates if the operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Response message' })
  message: string;

  @ApiProperty({ description: 'Paginated data' })
  data: PaginatedData<T>;

  @ApiProperty({ description: 'Timestamp of the response' })
  timestamp: string;

  @ApiProperty({ description: 'API path', required: false })
  path?: string;
}

export class ErrorResponse {
  @ApiProperty({ description: 'Always false for error responses' })
  success: false;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiProperty({ description: 'Error type or code' })
  error: string;

  @ApiProperty({ description: 'Timestamp of the error' })
  timestamp: string;

  @ApiProperty({ description: 'API path', required: false })
  path?: string;

  @ApiProperty({ description: 'Additional error details', required: false })
  details?: any;
}

// Tipos específicos para respuestas comunes
export class UserProfileResponse {
  @ApiProperty({ description: 'User unique identifier' })
  id: string;

  @ApiProperty({ description: 'Chilean RUT (Rol Único Tributario)' })
  rut: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({ description: 'Whether the user account is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class PermissionResponse {
  @ApiProperty({ description: 'Permission unique identifier' })
  id: string;

  @ApiProperty({ description: 'Permission name' })
  name: string;

  @ApiProperty({ description: 'Permission description' })
  description: string;

  @ApiProperty({ description: 'Resource this permission applies to' })
  resource: string;

  @ApiProperty({ description: 'Action this permission allows' })
  action: string;

  @ApiProperty({ description: 'Whether the permission is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Permission creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}

export class RoleResponse {
  @ApiProperty({ description: 'Role unique identifier' })
  id: string;

  @ApiProperty({ description: 'Role name' })
  name: string;

  @ApiProperty({ description: 'Role description' })
  description: string;

  @ApiProperty({ description: 'Whether the role is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Role creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Permissions associated with this role',
    type: [PermissionResponse],
  })
  permissions: PermissionResponse[];
}

export class UserWithRolesResponse {
  @ApiProperty({ description: 'User unique identifier' })
  id: string;

  @ApiProperty({ description: 'Chilean RUT (Rol Único Tributario)' })
  rut: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User first name' })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  lastName: string;

  @ApiProperty({ description: 'Whether the user account is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({
    description: 'Roles assigned to the user',
    type: [RoleResponse],
  })
  roles: RoleResponse[];
}

export class AuthResponse {
  @ApiProperty({
    description: 'User information with roles',
    type: UserWithRolesResponse,
  })
  user: UserWithRolesResponse;

  @ApiProperty({ description: 'JWT authentication token' })
  token: string;
}
