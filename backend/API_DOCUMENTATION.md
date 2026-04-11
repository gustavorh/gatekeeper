# Gatekeeper API Documentation

## Overview

The Gatekeeper API is a RESTful service built with NestJS that provides authentication, user management, and role-based access control functionality. This API uses JWT tokens for authentication and implements a clean architecture pattern.

## Base URL

```
http://localhost:3000
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require a valid JWT token in the Authorization header.

### JWT Token Format

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/login

Authenticate a user with RUT and password.

**Request Body:**

```json
{
  "rut": "123456785",
  "password": "password123"
}
```

**Response (200 OK):**

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "rut": "123456785",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "roles": [
      {
        "id": "role-123",
        "name": "user",
        "description": "Regular user",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "permissions": [
          {
            "id": "perm-123",
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
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Invalid credentials

#### POST /auth/register

Register a new user account.

**Request Body:**

```json
{
  "rut": "123456785",
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response (201 Created):**

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "rut": "123456785",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "roles": [
      {
        "id": "role-123",
        "name": "user",
        "description": "Regular user",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "permissions": []
      }
    ]
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input data
- `409 Conflict`: User with this RUT or email already exists

### User Management Endpoints

#### GET /users/profile

Get the current user's profile with roles and permissions.

**Headers:**

```
Authorization: Bearer <jwt-token>
```

**Response (200 OK):**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "rut": "123456785",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "roles": [
    {
      "id": "role-123",
      "name": "user",
      "description": "Regular user",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "permissions": [
        {
          "id": "perm-123",
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

**Error Responses:**

- `401 Unauthorized`: Invalid or missing JWT token
- `500 Internal Server Error`: User not found or database error

## Data Models

### RUT (Rol Único Tributario)

The API uses Chilean RUT (Rol Único Tributario) for user identification. RUTs can be provided in the following formats:

- `123456785` (without hyphen)
- `12345678-5` (with hyphen)
- `12.345.678-5` (with dots and hyphen)

The API automatically normalizes RUTs to the format without dots and hyphens.

### User Roles

Users are automatically assigned the "user" role upon registration. The system supports role-based access control with the following structure:

- **Roles**: Define user categories (e.g., "user", "admin")
- **Permissions**: Define specific actions on resources (e.g., "read_users", "write_users")

## Error Handling

The API returns consistent error responses with the following structure:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Error type",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Authentication required or failed
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## Validation

The API implements comprehensive validation:

### RUT Validation

- Must be a valid Chilean RUT format
- Verification digit is validated
- Supports formats with and without hyphens/dots

### Email Validation

- Must be a valid email format
- Automatically converted to lowercase

### Password Validation

- Minimum 6 characters
- Must be a string

### Name Validation

- Must be non-empty strings
- Automatically trimmed of whitespace

## Rate Limiting

Currently, the API does not implement rate limiting. Consider implementing rate limiting for production use.

## CORS

The API has CORS enabled to allow cross-origin requests.

## Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api/docs
```

The Swagger UI provides:

- Interactive endpoint testing
- Request/response examples
- Authentication token management
- Schema documentation

## Development

### Running the API

```bash
# Install dependencies
npm install

# Start development server
npm run start:dev

# Start production server
npm run start:prod
```

### Testing

```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run all tests
npm run test:all
```

## Security Considerations

1. **JWT Tokens**: Store tokens securely and never expose them in client-side code
2. **Password Security**: Passwords are hashed using bcrypt with salt rounds of 10
3. **Input Validation**: All inputs are validated and sanitized
4. **CORS**: Configure CORS appropriately for your frontend domain
5. **Environment Variables**: Use environment variables for sensitive configuration

## Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=mysql://user:password@localhost:3306/gatekeeper

# JWT
JWT_SECRET=your-secret-key-here

# Server
PORT=3000
```

## Support

For API support or questions, please refer to the Swagger documentation or contact the development team.
