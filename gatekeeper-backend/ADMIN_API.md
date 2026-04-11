# Admin API Documentation

This document describes the admin API endpoints that provide full CRUD operations for users, roles, and permissions. All endpoints require admin role authentication.

## Authentication

All admin endpoints require:

1. **JWT Token**: Valid JWT token in Authorization header
2. **Admin Role**: User must have the "admin" role

```
Authorization: Bearer <JWT_TOKEN>
```

## Base URL

All admin endpoints are prefixed with `/admin`

## Error Responses

### Common Error Codes

- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: User does not have admin role
- `400 Bad Request`: Validation error or business logic error
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Error Response Format

```json
{
  "message": "Error description",
  "error": "Detailed error message"
}
```

## User Management

### Create User

**POST** `/admin/users`

Create a new user with optional role assignments.

**Request Body:**

```json
{
  "rut": "12345678-9",
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "roleIds": ["role-1", "role-2"]
}
```

**Response (201):**

```json
{
  "id": "user-1",
  "rut": "12345678-9",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get All Users

**GET** `/admin/users`

Retrieve all users with pagination and search.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name, email, or RUT

**Response (200):**

```json
{
  "users": [
    {
      "id": "user-1",
      "rut": "12345678-9",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Get User by ID

**GET** `/admin/users/:id`

Retrieve a specific user by ID.

**Response (200):**

```json
{
  "id": "user-1",
  "rut": "12345678-9",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get User with Roles and Permissions

**GET** `/admin/users/:id/with-roles`

Retrieve a user with their roles and permissions.

**Response (200):**

```json
{
  "id": "user-1",
  "rut": "12345678-9",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "roles": [
    {
      "id": "role-1",
      "name": "admin",
      "description": "Administrator role",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "permissions": [
        {
          "id": "permission-1",
          "name": "read_users",
          "description": "Can read users",
          "resource": "users",
          "action": "read",
          "isActive": true,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

### Update User

**PUT** `/admin/users/:id`

Update a user with optional role assignments.

**Request Body:**

```json
{
  "rut": "12345678-9",
  "email": "updated@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "isActive": true,
  "roleIds": ["role-1"]
}
```

**Response (200):**

```json
{
  "id": "user-1",
  "rut": "12345678-9",
  "email": "updated@example.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Delete User

**DELETE** `/admin/users/:id`

Delete a user by ID.

**Response (204):** No content

## Role Management

### Create Role

**POST** `/admin/roles`

Create a new role with optional permission assignments.

**Request Body:**

```json
{
  "name": "manager",
  "description": "Manager role with elevated permissions",
  "permissionIds": ["permission-1", "permission-2"]
}
```

**Response (201):**

```json
{
  "id": "role-1",
  "name": "manager",
  "description": "Manager role with elevated permissions",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get All Roles

**GET** `/admin/roles`

Retrieve all roles with pagination and search.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name or description

**Response (200):**

```json
{
  "roles": [
    {
      "id": "role-1",
      "name": "admin",
      "description": "Administrator role",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Get Role by ID

**GET** `/admin/roles/:id`

Retrieve a specific role by ID.

**Response (200):**

```json
{
  "id": "role-1",
  "name": "admin",
  "description": "Administrator role",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Role with Permissions

**GET** `/admin/roles/:id/with-permissions`

Retrieve a role with its permissions.

**Response (200):**

```json
{
  "id": "role-1",
  "name": "admin",
  "description": "Administrator role",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "permissions": [
    {
      "id": "permission-1",
      "name": "read_users",
      "description": "Can read users",
      "resource": "users",
      "action": "read",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Update Role

**PUT** `/admin/roles/:id`

Update a role with optional permission assignments.

**Request Body:**

```json
{
  "name": "senior_manager",
  "description": "Senior manager role",
  "isActive": true,
  "permissionIds": ["permission-1", "permission-2"]
}
```

**Response (200):**

```json
{
  "id": "role-1",
  "name": "senior_manager",
  "description": "Senior manager role",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Delete Role

**DELETE** `/admin/roles/:id`

Delete a role by ID.

**Response (204):** No content

## Permission Management

### Create Permission

**POST** `/admin/permissions`

Create a new permission.

**Request Body:**

```json
{
  "name": "write_users",
  "description": "Can create and update users",
  "resource": "users",
  "action": "write"
}
```

**Response (201):**

```json
{
  "id": "permission-1",
  "name": "write_users",
  "description": "Can create and update users",
  "resource": "users",
  "action": "write",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Get All Permissions

**GET** `/admin/permissions`

Retrieve all permissions with pagination and search.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `search` (optional): Search term for name, description, resource, or action

**Response (200):**

```json
{
  "permissions": [
    {
      "id": "permission-1",
      "name": "read_users",
      "description": "Can read users",
      "resource": "users",
      "action": "read",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

### Get Permission by ID

**GET** `/admin/permissions/:id`

Retrieve a specific permission by ID.

**Response (200):**

```json
{
  "id": "permission-1",
  "name": "read_users",
  "description": "Can read users",
  "resource": "users",
  "action": "read",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Permission

**PUT** `/admin/permissions/:id`

Update a permission.

**Request Body:**

```json
{
  "name": "write_users",
  "description": "Can create and update users",
  "resource": "users",
  "action": "write",
  "isActive": true
}
```

**Response (200):**

```json
{
  "id": "permission-1",
  "name": "write_users",
  "description": "Can create and update users",
  "resource": "users",
  "action": "write",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Delete Permission

**DELETE** `/admin/permissions/:id`

Delete a permission by ID.

**Response (204):** No content

## Validation Rules

### User Validation

- **RUT**: Must be a valid Chilean RUT format
- **Email**: Must be a valid email format and unique
- **Password**: Minimum 6 characters
- **firstName**: Maximum 100 characters
- **lastName**: Maximum 100 characters

### Role Validation

- **name**: Maximum 100 characters, must be unique
- **description**: Required

### Permission Validation

- **name**: Maximum 100 characters, must be unique
- **description**: Required
- **resource**: Maximum 100 characters, required
- **action**: Maximum 50 characters, required

## Business Rules

### User Management

1. **Unique Constraints**: RUT and email must be unique across all users
2. **Password Security**: Passwords are automatically hashed using bcrypt
3. **Role Assignment**: Users can be assigned multiple roles during creation or update
4. **Soft Delete**: Users are marked as inactive rather than physically deleted

### Role Management

1. **Unique Names**: Role names must be unique
2. **Permission Assignment**: Roles can be assigned multiple permissions
3. **Active Status**: Roles can be deactivated without deletion

### Permission Management

1. **Unique Names**: Permission names must be unique
2. **Resource-Action Pairs**: Permissions are defined by resource and action pairs
3. **Active Status**: Permissions can be deactivated without deletion

## Security Considerations

1. **Admin Role Required**: All endpoints require admin role authentication
2. **JWT Validation**: Tokens are validated on every request
3. **Input Validation**: All inputs are validated using class-validator
4. **SQL Injection Protection**: Using parameterized queries through Drizzle ORM
5. **Password Hashing**: Passwords are hashed using bcrypt with salt rounds

## Rate Limiting

Consider implementing rate limiting for admin endpoints to prevent abuse:

- **Create/Update/Delete operations**: 10 requests per minute per user
- **Read operations**: 100 requests per minute per user

## Monitoring and Logging

All admin operations should be logged for audit purposes:

- **User creation/modification/deletion**
- **Role creation/modification/deletion**
- **Permission creation/modification/deletion**
- **Failed authentication attempts**
- **Unauthorized access attempts**

## Testing

The admin functionality includes comprehensive unit tests covering:

- **Service layer**: Business logic validation
- **Controller layer**: Request/response handling
- **Guard layer**: Authentication and authorization
- **Repository layer**: Data access operations

Run tests with:

```bash
npm run test admin.service.spec.ts
```
