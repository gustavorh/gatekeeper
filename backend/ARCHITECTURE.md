# Arquitectura Limpia - Gatekeeper Backend

Este proyecto implementa una arquitectura limpia por capas utilizando NestJS y Drizzle ORM con MySQL, siguiendo los principios de Clean Architecture y Domain-Driven Design.

## Estructura de Carpetas

```
src/
├── domain/                 # Capa de Dominio
│   ├── entities/          # Entidades del dominio (User, Role, Permission)
│   ├── repositories/      # Interfaces de repositorios
│   └── services/          # Interfaces de servicios
├── application/           # Capa de Aplicación
│   ├── dto/              # Data Transfer Objects (Auth, Response)
│   ├── services/         # Implementación de servicios (Auth, UserProfile)
│   ├── modules/          # Módulos de aplicación (AuthModule)
│   └── decorators/       # Decoradores personalizados (RUT validation)
├── infrastructure/        # Capa de Infraestructura
│   ├── database/         # Configuración de base de datos y esquemas
│   ├── repositories/     # Implementación de repositorios
│   └── config/           # Configuraciones (database.config)
├── presentation/         # Capa de Presentación
│   ├── controllers/      # Controladores (Auth, User)
│   ├── middleware/       # Guards y autenticación JWT
│   ├── interceptors/     # Interceptores de respuesta
│   ├── filters/          # Filtros de excepciones HTTP
│   └── decorators/       # Decoradores personalizados (CurrentUser)
└── utils/               # Utilidades
    ├── rut-validator.ts # Validador de RUT chileno
    ├── response.helper.ts # Helper para respuestas
    └── validation.helper.ts # Helper para validaciones
```

## Capas de la Arquitectura

### 1. Dominio (Domain Layer)

**Entidades del Dominio:**

- **User**: Usuarios del sistema con RUT, email, contraseña, nombre, apellido
- **Role**: Roles de usuario con nombre, descripción y estado
- **Permission**: Permisos del sistema con nombre, descripción, recurso y acción

**Relaciones:**

- `user_roles`: Tabla de relación muchos a muchos entre usuarios y roles
- `role_permissions`: Tabla de relación muchos a muchos entre roles y permisos

**Interfaces:**

- `IUserRepository`: Contrato para acceso a datos de usuarios
- `IRoleRepository`: Contrato para acceso a datos de roles
- `IPermissionRepository`: Contrato para acceso a datos de permisos
- `IAuthService`: Contrato para servicios de autenticación

### 2. Aplicación (Application Layer)

**Servicios:**

- **AuthService**: Maneja registro, login y autenticación JWT
- **UserProfileService**: Gestiona perfiles de usuario con roles y permisos
- **ValidationService**: Servicios de validación personalizados

**DTOs:**

- **LoginDto**: Datos para autenticación (RUT, contraseña)
- **RegisterDto**: Datos para registro (RUT, email, contraseña, nombre, apellido)
- **AuthResponse**: Respuesta de autenticación con token y datos de usuario
- **UserWithRolesResponse**: Perfil de usuario con roles y permisos

**Decoradores:**

- **@IsRut()**: Validación personalizada para formato RUT chileno

### 3. Infraestructura (Infrastructure Layer)

**Base de Datos:**

- **Drizzle ORM**: ORM para TypeScript con MySQL
- **Esquemas**: Definición de tablas con relaciones y restricciones
- **Migraciones**: Sistema de migraciones automático

**Repositorios:**

- **UserRepository**: Implementación de acceso a datos de usuarios
- **RoleRepository**: Implementación de acceso a datos de roles
- **PermissionRepository**: Implementación de acceso a datos de permisos

**Configuración:**

- **database.config.ts**: Configuración de conexión a base de datos
- **Variables de entorno**: Configuración de JWT, base de datos, etc.

### 4. Presentación (Presentation Layer)

**Controladores:**

- **AuthController**: Endpoints de autenticación (`/auth/login`, `/auth/register`)
- **UserController**: Endpoints de usuario (`/users/profile`)

**Middleware:**

- **JwtAuthGuard**: Guard para protección de rutas con JWT
- **ResponseInterceptor**: Interceptor para formatear respuestas
- **HttpExceptionFilter**: Filtro para manejo de excepciones

**Decoradores:**

- **@CurrentUser()**: Decorador para obtener usuario del token JWT

## Funcionalidades Implementadas

### Autenticación y Autorización

- **Registro de usuarios** con RUT, email, contraseña, nombre y apellido
- **Login con RUT y contraseña** con validación de credenciales
- **Autenticación JWT** con tokens de 24 horas de duración
- **Protección de rutas** con Guards de NestJS
- **Validación de RUT chileno** con decorador personalizado
- **Hash de contraseñas** con bcryptjs

### Gestión de Usuarios y Roles

- **Sistema de roles** con asignación automática al registro
- **Sistema de permisos** con recursos y acciones
- **Relaciones muchos a muchos** entre usuarios, roles y permisos
- **Perfil de usuario** con roles y permisos asociados

### Validación y Seguridad

- **Validación de entrada** con class-validator y class-transformer
- **Sanitización de datos** con whitelist y forbidNonWhitelisted
- **Manejo de errores** centralizado con filtros HTTP
- **Respuestas estandarizadas** con interceptores

## Endpoints Disponibles

### Autenticación (`/auth`)

- `POST /auth/register` - Registro de usuarios
  - **Body**: RUT, email, contraseña, nombre, apellido
  - **Response**: Token JWT y datos de usuario
  - **Validación**: RUT chileno, email válido, contraseña segura

- `POST /auth/login` - Login de usuarios
  - **Body**: RUT, contraseña
  - **Response**: Token JWT y datos de usuario
  - **Validación**: Credenciales correctas

### Usuarios (`/users`) - Protegido con JWT

- `GET /users/profile` - Obtener perfil del usuario actual
  - **Headers**: Authorization: Bearer {JWT_TOKEN}
  - **Response**: Datos de usuario con roles y permisos
  - **Protección**: Requiere token JWT válido

## Tecnologías Utilizadas

### Framework y ORM

- **NestJS 11.0.1**: Framework de Node.js con arquitectura modular
- **Drizzle ORM 0.44.3**: ORM moderno para TypeScript
- **MySQL 3.14.2**: Base de datos relacional

### Autenticación y Seguridad

- **JWT (@nestjs/jwt)**: Autenticación con tokens
- **Passport (@nestjs/passport)**: Estrategias de autenticación
- **bcryptjs 3.0.2**: Hash seguro de contraseñas
- **passport-jwt 4.0.1**: Estrategia JWT para Passport

### Validación y Documentación

- **class-validator 0.14.2**: Validación de DTOs
- **class-transformer 0.5.1**: Transformación de objetos
- **@nestjs/swagger 11.2.0**: Documentación automática de API
- **swagger-ui-express 5.0.1**: Interfaz de documentación

### Desarrollo y Testing

- **TypeScript 5.7.3**: Lenguaje de programación
- **Jest 29.7.0**: Framework de testing
- **ESLint 9.18.0**: Linting de código
- **Prettier 3.4.2**: Formateo de código

## Scripts Disponibles

### Desarrollo

- `npm run start:dev`: Servidor en modo desarrollo con hot reload
- `npm run start:debug`: Servidor en modo debug
- `npm run build`: Compilación del proyecto

### Base de Datos

- `npm run db:generate`: Generar migraciones
- `npm run db:migrate`: Ejecutar migraciones
- `npm run db:studio`: Abrir Drizzle Studio

### Testing

- `npm run test`: Tests unitarios
- `npm run test:watch`: Tests en modo watch
- `npm run test:e2e`: Tests end-to-end
- `npm run test:cov`: Tests con cobertura

### Calidad de Código

- `npm run lint`: Linting y corrección automática
- `npm run format`: Formateo de código con Prettier

## Configuración del Proyecto

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL=mysql://user:password@localhost:3306/gatekeeper

# JWT
JWT_SECRET=your-secret-key

# Configuración del servidor
PORT=3000
NODE_ENV=development
```

### Estructura de Base de Datos

- **users**: Tabla principal de usuarios
- **roles**: Tabla de roles del sistema
- **permissions**: Tabla de permisos del sistema
- **user_roles**: Tabla de relación usuarios-roles
- **role_permissions**: Tabla de relación roles-permisos

## Principios de Arquitectura

### Clean Architecture

- **Independencia de frameworks**: El dominio no depende de NestJS
- **Independencia de base de datos**: Los repositorios son interfaces
- **Independencia de UI**: Los controladores son independientes del dominio
- **Testabilidad**: Cada capa es testeable de forma independiente

### Domain-Driven Design

- **Entidades ricas**: User, Role, Permission con comportamiento
- **Repositorios**: Abstracción del acceso a datos
- **Servicios de dominio**: Lógica de negocio en el dominio
- **Agregados**: Agrupación lógica de entidades relacionadas

### SOLID Principles

- **Single Responsibility**: Cada clase tiene una responsabilidad
- **Open/Closed**: Extensible sin modificar código existente
- **Liskov Substitution**: Interfaces bien definidas
- **Interface Segregation**: Interfaces específicas por capa
- **Dependency Inversion**: Dependencias hacia abstracciones
