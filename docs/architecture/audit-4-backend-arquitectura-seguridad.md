# Audit-4 — Deuda de Clean Architecture + Seguridad Backend

> Fecha: 2026-05 | Método: 3 ejes en paralelo (Clean Architecture, Seguridad, Drizzle/Integridad), cross-validación por pares de agentes, verificación manual de evidencias clave. Sin cambios de código en este audit.

---

## Resumen ejecutivo

Se auditó el backend (NestJS 11 + Drizzle + MySQL) en tres ejes. Los hallazgos neto-nuevos complementan y amplían los 8 ítems ya rastreados en el roadmap (auditorías 1–3). La deuda más crítica es la **inversión de dependencias Domain → Application** (capa interna importa DTOs de capa externa), seguida por la **ausencia de mappers** entre capas. En seguridad, el hallazgo más urgente es el **seed que loguea credenciales en claro**.

### Tabla de severidades

| ID | Hallazgo | Severidad | Prioridad | Estado |
|----|----------|-----------|-----------|--------|
| A1 | Domain importa DTOs de Application | **Crítico** | P0 | Abierto |
| A2 | Sin mappers row→entidad→DTO | **Alto** | P1 | Abierto |
| A3 | Guard hace lógica de autorización y toca repos | **Alto** | P1 | Abierto |
| A4 | Controllers usan `any` y castean con `as` | **Alto** | P1 | Abierto |
| A5 | AdminService llama AuthService.register (acoplamiento servicio→servicio) | **Medio** | P2 | Abierto |
| A6 | CACHE_MANAGER inyectado directamente en application | **Medio** | P2 | Abierto |
| A7 | Seed usa Drizzle crudo, saltando repositorios | **Bajo** | P3 | Abierto |
| A8 | Entidades anémicas, reglas de negocio en application | **Bajo** | P3 | Abierto |
| B1 | Seed loguea contraseña en claro + default débil | **Crítico** | P0 | Abierto |
| B2 | catch genérico traga errores de JWT | **Alto** | P1 | Abierto |
| B3 | Política de password débil (`@MinLength(6)`) | **Medio** | P1 | Abierto |
| B4 | Sin límite de tamaño de body (riesgo DoS) | **Medio** | P1 | Abierto |
| B5 | `details: any` en HttpExceptionFilter podría filtrar internals | **Bajo** | P2 | Abierto |
| B6 | Sin revocación de token al logout; sin audit log | **Bajo** | P2 | Abierto |
| C1 | Sin UNIQUE compuesto en `user_roles` y `role_permissions` | **Alto** | P1 | Abierto |
| C2 | FKs sin `ON DELETE CASCADE` | **Medio** | P1 | Abierto |
| C3 | Índice faltante en `shifts.status` | **Medio** | P1 | Abierto |
| C4 | Soft-delete (`isActive`) no filtrado a nivel query | **Medio** | P2 | Abierto |
| C5 | N+1 en getUsers y getUserWithRoles | **Medio** | P2 | Abierto |
| D1 | `createRole` acepta `permissionIds` pero los ignora | **Alto** | P1 | Abierto |
| D2 | Dashboard devuelve datos mock hardcodeados | **Alto** | P1 | Abierto |
| D3 | `report-export.processor.ts` es un stub `// TODO` | **Medio** | P2 | Abierto |
| E1 | Config JWT duplicada en 3 módulos | **Medio** | P1 | Abierto |
| E2 | Vars fuera del schema de validación y ausentes en env.example | **Medio** | P1 | Abierto |
| E3 | Cobertura de tests ausente en lógica core | **Alto** | P1 | Abierto |

**Re-priorización single-tenant:** IDOR entre usuarios (P2-2 en roadmap previo) se eleva a **P1** — en single-tenant sigue siendo explotable: empleado A puede leer asistencia de empleado B.

---

## A — Fugas de Clean Architecture

### A1 · Dependencia invertida Domain → Application (CRÍTICA)

**Contexto:** La regla cardinal de Clean Architecture es que las capas internas no dependen de las externas. El dominio es la capa más interna y no debe importar nada de application, presentation ni infrastructure.

**Evidencia:**
- `backend/src/domain/entities/user.entity.ts:1` → `import { RegisterDto } from '../../application/dto/auth.dto'`
- `backend/src/domain/entities/user.entity.ts:15` → `export type CreateUserDto = RegisterDto;`
- `backend/src/domain/services/auth.service.interface.ts:3` → `import { LoginDto, RegisterDto } from '../../application/dto/auth.dto'`

**Impacto:** El dominio queda acoplado al contrato HTTP. Cambiar un DTO de la API obliga a cambiar el dominio. Las interfaces de servicio del dominio quedan contaminadas con semántica de transporte.

**Acción:** Definir tipos de entrada propios del dominio (`CreateUserData`, `LoginData`) en `domain/`. Las interfaces de servicio del dominio usan exclusivamente estos tipos. Application crea un mapper `RegisterDto → CreateUserData` antes de llamar al servicio de dominio.

---

### A2 · Sin mappers: filas Drizzle castadas como entidades de dominio

**Contexto:** Los repositorios deben aislar la capa de persistencia de la de dominio. Hoy no hay transformación: la fila de BD "es" la entidad.

**Evidencia:**
- `backend/src/infrastructure/repositories/user.repository.ts` — `create()` y `findById()` retornan `newUser` (row Drizzle) casteado directamente a `User`
- `backend/src/application/services/auth.service.ts:196` → `excludePassword()` se aplica manualmente porque `User` lleva `password`
- El tipo `User` se propaga desde el repositorio hasta el controller sin transformación

**Impacto:** El esquema Drizzle y el dominio son el mismo objeto. Evolucionar la BD (renombrar columna, añadir join) rompe el dominio. Riesgo latente de fuga de `password` si se omite `excludePassword()` en algún path.

**Acción:** Introducir mappers `rowToUser()` en el repositorio (devuelve entidad de dominio sin `password`) y `userToResponseDto()` en application. Quitar `password` del tipo expuesto externamente.

---

### A3 · Presentation hace lógica de autorización y toca el repositorio

**Contexto:** Los guards de NestJS deben decidir `canActivate: boolean`. La lógica de negocio (¿qué roles califican como admin?) pertenece a un servicio de autorización, no al guard.

**Evidencia:**
- `backend/src/presentation/middleware/admin-auth.guard.ts:8` → `import { IRoleRepository } from '../../domain/repositories/role.repository.interface'`
- `backend/src/presentation/middleware/admin-auth.guard.ts:13–14` → `@Inject('IRoleRepository') private readonly roleRepository: IRoleRepository`
- El guard resuelve roles y permisos dentro de `canActivate()`

**Impacto:** Autorización dispersa (parte en guard, parte en servicio). Difícil de testear y de extender (¿supervisor también es admin?).

**Acción:** Patrón `@Roles('ADMIN')` decorator + `RolesGuard` global delgado que delega a un `AuthorizationService`. Guard solo extrae roles del JWT y pregunta al servicio.

---

### A4 · Controllers mienten con `as DTO` y usan `any`

**Contexto:** Los casts `as Promise<ShiftResponseDto>` y el uso de `any` en parámetros de controller anulan las garantías del sistema de tipos.

**Evidencia:**
- `backend/src/presentation/controllers/shift.controller.ts:77` → `async clockIn(@CurrentUser() user: any)`
- `backend/src/presentation/controllers/shift.controller.ts:78` → `return this.shiftService.clockIn(user.id) as Promise<ShiftResponseDto>`
- `backend/src/presentation/controllers/shift.controller.ts:116,147,211,225,231,314,320` — mismo patrón
- `backend/src/presentation/controllers/analytics.controller.ts:30,40,50,70,89,97` → `@Request() req: any` pese a existir `@CurrentUser()`

**Impacto:** TypeScript no detecta contratos rotos. Un cambio en el tipo de retorno del servicio pasa silenciosamente.

**Acción:** Tipar `@CurrentUser()` con una interfaz `JwtPayload` concreta. Usar `@CurrentUser() user: JwtPayload`. Eliminar los `as` cast y manejar la transformación real en mappers o en el propio servicio.

---

### A5 · Acoplamiento servicio→servicio en creación de usuario

**Contexto:** Hay dos caminos de creación de usuario: `POST /auth/register` y `POST /admin/users`. El segundo reutiliza el primero llamando a `AuthService.register()` desde `AdminService`, creando acoplamiento entre servicios de application.

**Evidencia:**
- `backend/src/application/services/admin.service.ts:42` → `import { AuthService } from './auth.service'`
- `backend/src/application/services/admin.service.ts:56,68,77` → llama `this.authService.register(registerData)`

**Impacto:** Cambiar la lógica de registro de usuarios (p. ej., añadir verificación de email) afecta inadvertidamente la creación de usuarios por admin. Dificulta la divergencia futura de los dos flujos.

**Acción:** Extraer la lógica compartida a un `UserService` o `UserDomainService` que ambos servicios consuman. Cada path de creación llama al repositorio directamente o al servicio de dominio.

---

### A6 · Framework infra (CACHE_MANAGER) inyectado en application

**Contexto:** `CACHE_MANAGER` es un token de NestJS (`@nestjs/cache-manager`). Inyectarlo directamente en servicios de application rompe la independencia de framework: el servicio no puede testearse sin arrancar el módulo de caché de NestJS.

**Evidencia:**
- `backend/src/application/services/user-profile.service.ts:7,33` → `import { CACHE_MANAGER }` + `@Inject(CACHE_MANAGER)`
- `backend/src/application/services/admin.service.ts:8,57` → mismo patrón
- Claves de caché hardcodeadas (`user:<id>:withRoles`) duplicadas en dos servicios

**Impacto:** Application depende de un token de framework. Lógica de invalidación duplicada y propensa a drift.

**Acción:** Crear `ICacheService` en `domain/` o `application/` con métodos `get<T>()`, `set()`, `del()`. Implementar `NestCacheService` en infrastructure. Los servicios de application inyectan `ICacheService`.

---

### A7 · Seed salta la capa de repositorios

**Evidencia:** `backend/src/seed.ts` usa `db.select()`, `db.insert()` directamente contra Drizzle, duplicando acceso a datos fuera de la abstracción de repositorios.

**Impacto:** Los repositorios pueden evolucionar (añadir validaciones, eventos) sin que el seed los refleje; el seed puede quedar desincronizado del comportamiento real.

**Acción:** Seed llama a los servicios/repositorios de application, igual que el código de producción.

---

### A8 · Entidades anémicas / sin servicios de dominio (observación de diseño)

**Contexto:** Las entidades actuales son structs de datos. Las reglas de negocio (¿puede el usuario marcar salida?, cálculo de horas trabajadas, política de contraseña) viven íntegramente en los servicios de application.

**Impacto:** Bajo mientras el dominio es simple. A medida que las reglas crecen, los servicios de application se inflan y el dominio no encapsula comportamiento. Severidad baja hoy; a vigilar.

**Acción diferida:** A medida que las reglas se enriquezcan, mover invariantes de dominio a métodos de entidad (`shift.canClockOut()`, `user.meetsPasswordPolicy()`).

---

## B — Seguridad (neto-nuevo)

### B1 · Seed loguea contraseña del admin en claro (CRÍTICO)

**Evidencia:**
- `backend/src/seed.ts:144` → `const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin1234'`
- `backend/src/seed.ts:186` → `logger.log(\`  Password: ${adminPassword}\`)` — la contraseña en texto plano va al log

**Impacto:** Cualquier sistema de log (Datadog, CloudWatch, disco) almacena la contraseña del admin. El default `Admin1234` es trivialmente bruteforceable.

**Acción:**
1. Eliminar `logger.log` con la contraseña.
2. Quitar el fallback `'Admin1234'`; si `SEED_ADMIN_PASSWORD` no está definida, el seed falla con mensaje claro.
3. Forzar cambio de contraseña en el primer login (flag `mustChangePassword` en `users`).

---

### B2 · `catch` genérico traga errores de JWT

**Evidencia:**
- `backend/src/presentation/middleware/jwt-auth.guard.ts:52` — bloque `catch` genérico sin distinción de tipo de error
- `backend/src/application/services/auth.service.ts:117` — `validateToken` retorna `null` ante cualquier fallo (token expirado, firma inválida, DB caída, todo igual)

**Impacto:** Imposible distinguir en logs si un 401 fue por token expirado, manipulado o por fallo de infraestructura. Mata la observabilidad de seguridad.

**Acción:** Distinguir `TokenExpiredError` y `JsonWebTokenError` (librería `jsonwebtoken`). Loguear con nivel apropiado. Retornar `401` en todos pero con contexto interno suficiente para el SIEM.

---

### B3 · Política de contraseña débil

**Evidencia:** `backend/src/application/dto/auth.dto.ts:39` → `@MinLength(6, { message: 'Password must have at least 6 characters' })`

**Impacto:** Contraseñas de 6 caracteres son trivialmente crackeables con rainbow tables o fuerza bruta offline ante una fuga de BD.

**Acción:** Subir a `@MinLength(12)` y añadir `@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: '...' })` para exigir complejidad. Actualizar `RegisterDto` y `ChangePasswordDto`.

---

### B4 · Sin límite de tamaño de body

**Evidencia:** `backend/src/main.ts` no configura `app.use(express.json({ limit: '...' }))` ni equivalente en Fastify.

**Impacto:** Un atacante puede enviar payloads arbitrariamente grandes a cualquier endpoint, causando OOM o degradación del servicio.

**Acción:** Añadir en `main.ts`: `app.use(express.json({ limit: '100kb' })); app.use(express.urlencoded({ extended: true, limit: '100kb' }));`

---

### B5 · `details: any` en HttpExceptionFilter podría filtrar internals

**Evidencia:** `backend/src/presentation/filters/http-exception.filter.ts` — campo `details` tipado como `any` que pasa el error original al cliente.

**Impacto:** En producción podría exponer stack traces, queries SQL o mensajes de error internos a través de respuestas 4xx/5xx.

**Acción:** En entorno prod (`process.env.NODE_ENV === 'production'`), sanear `details` y no incluir stack. Loguear el error completo server-side con `logger.error()`.

---

### B6 · Sin revocación de token al logout; sin audit log de acciones admin

**Contexto:** Deuda conocida pero no registrada explícitamente.

**Impacto (bajo en single-tenant):** Token JWT válido hasta expiración aun después del logout. Sin trazabilidad de acciones administrativas (crear usuario, asignar rol, etc.) — requerido para compliance laboral chileno.

**Acción diferida:** Tabla `revoked_tokens` (o Redis set) para invalidación inmediata. Tabla `audit_logs` ya en P1 del roadmap.

---

## C — Integridad de datos / Drizzle

### C1 · Sin UNIQUE compuesto en `user_roles` y `role_permissions`

**Evidencia:** `backend/src/infrastructure/database/schema.ts:43–63` — las tablas `user_roles` y `role_permissions` no declaran un índice único compuesto en `(user_id, role_id)` y `(role_id, permission_id)` respectivamente.

**Impacto:** Una condición de carrera (doble click, request duplicado) puede insertar la misma asignación dos veces. Las consultas de permisos retornan duplicados, lo que puede romper la lógica de autorización.

**Acción:** En la migración Drizzle: `uniqueIndex('user_roles_unique').on(userRoles.userId, userRoles.roleId)` y análogo para `role_permissions`.

---

### C2 · FKs sin `ON DELETE CASCADE`

**Evidencia:** `backend/src/infrastructure/database/schema.ts` y migración `0000_*` — las foreign keys usan la acción por defecto `NO ACTION` (o `RESTRICT` en MySQL).

**Impacto:** Intentar borrar un usuario con turnos asociados falla con error de FK. Borrar un rol no borra sus asignaciones en `user_roles`, dejando registros huérfanos.

**Acción:** Definir explícitamente `onDelete: 'cascade'` en las referencias FK de Drizzle para `user_roles`, `role_permissions` y `shifts` (al usuario). Requiere nueva migración.

---

### C3 · Índice faltante en `shifts.status`

**Evidencia:** `shifts.status` se filtra en `findActiveByUserId()` y `findPendingByUserId()` sin índice dedicado. Amplía el scope del ítem P1-3 del roadmap.

**Impacto:** Full table scan en cada marcaje a medida que la tabla `shifts` crece.

**Acción:** Añadir índice en `shifts.status` (y composición `(user_id, status)`) en la migración Drizzle.

---

### C4 · Soft-delete (`isActive`) no filtrado a nivel query

**Evidencia:** `findAll()` en el repositorio de usuarios trae registros inactivos; el filtro se aplica en memoria en el servicio.

**Impacto:** Consultas innecesariamente costosas; el número de registros procesados crece con el tiempo aunque la mayoría estén inactivos. Ligado a P1-2 (paginación en memoria).

**Acción:** Añadir `where(eq(users.isActive, true))` en el repositorio. La paginación SQL (P1-2) debe incluir este filtro desde la query.

---

### C5 · N+1 en `getUsers` y `getUserWithRoles`

**Evidencia:**
- `backend/src/application/services/admin.service.ts` `getUsers()` — carga usuarios, luego por cada usuario hace query adicional de roles
- `backend/src/application/services/user-profile.service.ts` `getUserWithRoles()` — luego por cada rol hace query adicional de permisos

**Impacto:** Con 100 usuarios, `getUsers()` ejecuta ~101 queries. Con 10 roles por usuario, el perfil ejecuta ~11 queries.

**Acción:** Usar JOIN de Drizzle (`leftJoin`) o `inArray` batch para cargar roles+permisos en una sola query. Exponer `findAllWithRoles()` en el repositorio.

---

## D — Funcionalidad incompleta enmascarada como completa

### D1 · `createRole` acepta `permissionIds` pero los ignora (bug funcional)

**Evidencia:** `backend/src/application/services/admin.service.ts:269–273` — el bloque `if (createRoleDto.permissionIds && ...)` solo loguea el count pero no ejecuta ningún `INSERT` en `role_permissions`.

**Impacto:** Un admin puede crear un rol con permisos desde la UI, obtener `201 Created`, y el rol queda sin permisos asignados. El bug es silencioso: no hay error, no hay indicación de que algo falló.

**Acción:** Implementar el `INSERT` en `role_permissions` para cada `permissionId`, dentro de una transacción (ligado a P0-2).

---

### D2 · Dashboard devuelve datos mock hardcodeados

**Evidencia:** `backend/src/application/services/admin.service.ts:516` → `// For now, we'll return mock data for shifts since we don't have shift repository` — el método `getDashboardData()` retorna objetos hardcodeados.

**Impacto:** El dashboard de admin siempre muestra los mismos números sin importar los datos reales de la organización. Feature marcado como implementado pero no funcional.

**Acción:** Implementar queries reales en `ShiftRepository` y `UserRepository` para los KPIs del dashboard. Requiere diseñar los métodos de agregación necesarios.

---

### D3 · `report-export.processor.ts` es un stub `// TODO`

**Evidencia:** `backend/src/application/queues/report-export.processor.ts` — el procesador de la queue BullMQ genera una URL falsa y loguea sin producir ningún reporte real.

**Impacto:** `POST /admin/reports/export` no genera ningún reporte. El job completa con éxito artificialmente.

**Acción:** Implementar la generación real de CSV/PDF o marcar explícitamente el endpoint como no disponible (`501 Not Implemented`) hasta que se implemente.

---

## E — Config / Testing

### E1 · Config JWT duplicada en 3 módulos

**Evidencia:** `auth.module.ts`, `admin.module.ts` y `shift.module.ts` repiten idénticamente:
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET,
  signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
})
```

**Impacto:** Si se cambia la configuración JWT (algoritmo, expiración) hay que actualizarla en 3 lugares. El fallback `process.env.JWT_SECRET` (sin validación) en módulos que no usan `ConfigModule` puede producir `undefined` silencioso en ciertos ordenes de arranque. Ligado a P1-1 del roadmap.

**Acción:** Crear `JwtConfigModule` con `JwtModule.registerAsync({ useFactory: (config: ConfigService) => ... })` y exportarlo. Los tres módulos lo importan.

---

### E2 · Variables de entorno fuera del schema de validación

**Variables sin validar:** `LOG_LEVEL`, `SEED_ADMIN_PASSWORD`, `SEED_*`, `BULL_REDIS_URL` — no aparecen en `env.validation.ts` ni en `env.example`.

**Impacto:** El proceso arranca incluso si `BULL_REDIS_URL` está ausente; la queue falla en runtime con un error críptico. `LOG_LEVEL` inválido pasa sin aviso.

**Acción:** Añadir las variables a `env.validation.ts` (con Joi `.optional()` para las de seed) y a `env.example` con valores de ejemplo.

---

### E3 · Cobertura de tests ausente en lógica core

**Áreas sin cobertura:** `shift.service.ts`, `analytics.service.ts`, todos los repositorios excepto user, y el flujo E2E de marcaje. Los tests E2E existentes son mínimos.

**Impacto:** El corazón del producto (entrada/salida, cálculo de horas) puede regresionar sin detección. Alta prioridad por riesgo de negocio.

**Acción:** Mínimo viable: unit tests de `shift.service` (clockIn, clockOut, casos de borde) y un E2E del flujo completo login→clockIn→clockOut. Registrar en P1 del roadmap por riesgo (es el core del producto).

---

## Lo que está BIEN

Estos patrones son correctos y deben mantenerse:

- **Interfaces de repositorios en `domain/`** — `IUserRepository`, `IRoleRepository`, etc. correctamente definidos en la capa más interna. La DI por tokens de string (`'IUserRepository'`) es la forma correcta en NestJS con Clean Architecture.
- **`ResponseInterceptor` y `HttpExceptionFilter` globales** — contrato de API uniforme aplicado transversalmente. No hay respuestas ad-hoc en controllers.
- **`@CurrentUser()` decorator** — la forma correcta de extraer el usuario del JWT en NestJS. Ya existe; el problema es que se usa `any` para tiparlo.
- **`@CurrentOrganization()` decorator** — patrón correcto para propagar `organizationId` del JWT. Lanza 401 si ausente.
- **Helmet + CORS + Throttler presentes** — la infraestructura de seguridad HTTP básica está configurada en `main.ts`.
- **`bcrypt.compare` para verificación de passwords** — timing-safe por diseño de la librería.
- **`OnApplicationShutdown` para cierre de pool MySQL** — graceful shutdown implementado correctamente.
- **`@nestjs/event-emitter` para shift domain events** — desacoplamiento correcto entre marcaje y efectos (audit, notificaciones).
- **Validación de env vars con Joi** al arranque — los secretos críticos (`JWT_SECRET`, `DATABASE_URL`) se validan antes de que la app sirva tráfico.
- **`nestjs-pino`** con request-id propagado — observabilidad estructurada correcta.

---

## Re-priorización: IDOR en single-tenant

El ítem P2-2 del roadmap (IDOR en endpoints `/:userId`) fue categorizado como P2 bajo el supuesto de que el multi-tenant mitiga el riesgo. Sin embargo, en single-tenant (estado actual) el IDOR **sigue siendo explotable**: un empleado autenticado puede consultar el turno y el perfil de cualquier otro empleado de la misma organización simplemente cambiando el `userId` en la URL.

**Decisión:** Reclasificar P2-2 → **P1**. Requiere validar en el servicio que `params.userId === jwtPayload.sub` o que el usuario tiene rol de admin antes de retornar datos de otro usuario.

---

## Roadmap de remediación (secuenciado)

### Fase 0 — Quick wins (bajo riesgo, alto valor, 1–2 días)

1. **B1** — Eliminar `logger.log` con contraseña en `seed.ts`; quitar fallback `Admin1234`; exigir `SEED_ADMIN_PASSWORD` del entorno
2. **A1** — Quitar imports de DTOs desde `domain/`; crear tipos de entrada propios del dominio
3. **A4** — Tipar `@CurrentUser()` con interfaz concreta; eliminar `as Promise<...>` casts
4. **D1** — Implementar el `INSERT` de permisos en `createRole` (dentro de una transacción)
5. **B4** — Añadir límite de body en `main.ts` (100kb)
6. **E2** — Completar `env.validation.ts` y `env.example`
7. **P2-3** (roadmap previo) — Reemplazar `throw new Error` en controllers con excepciones tipadas NestJS

### Fase 1 — Robustez / seguridad activa (sprint)

1. **P0-2** — Transacciones en operaciones críticas (clockIn, createRole con permisos, createUser)
2. **P2-2→P1** (IDOR) — Validar ownership en endpoints `/:userId`; guard o check en servicio
3. **E1 / P1-1** — `JwtConfigModule` async compartido; eliminar `process.env.JWT_SECRET` inline; secreto sin fallback
4. **B2** — Distinguir tipos de error JWT en guards; loguear apropiadamente
5. **C1** — Añadir índices UNIQUE compuestos en `user_roles` y `role_permissions`
6. **C2** — `onDelete: 'cascade'` en FKs; nueva migración
7. **P1-3 + C3** — Índices en `user_id`, `created_at` de shifts + índice en `shifts.status`
8. **B3** — Subir `@MinLength(6)` a 12 en `auth.dto.ts`

### Fase 2 — Escala / calidad (trimestre)

1. **P1-2 + C4** — Paginación SQL en `findAll()`; filtro `isActive` a nivel query
2. **C5** — Eliminar N+1 con JOINs/batch en `getUsers` y `getUserWithRoles`
3. **P2-1** — Tipar `db` en repositorios (eliminar `any`)
4. **A2** — Introducir mappers `row→entity` en repositorios; `entity→responseDto` en application
5. **A6** — Crear `ICacheService`; mover `CACHE_MANAGER` a infrastructure
6. **A3** — Patrón `@Roles()` + `RolesGuard` delgado + `AuthorizationService`
7. **D2** — Dashboard con datos reales (queries de agregación en `ShiftRepository`)
8. **D3** — Implementar `report-export.processor.ts` o marcar `501`
9. **E3** — Unit tests de `shift.service`; E2E del flujo crítico login→clockIn→clockOut

### Fase 3 — Epic diferido (antes del primer cliente multi-org)

1. **P0-1** — Tabla `organizations`, FK en todas las tablas, propagación de `organizationId` del JWT a cada query. Requiere migración de esquema y escalar al usuario (irreversible).

---

## Verificación de evidencias

Los siguientes comandos confirman que las referencias `archivo:línea` de este informe resuelven al código actual:

```bash
# A1: domain importa DTOs de application
grep -rn "import.*RegisterDto\|export type CreateUserDto" backend/src/domain/

# A4: any typing en controllers
grep -n "user: any\|req: any" backend/src/presentation/controllers/shift.controller.ts
grep -n "@Request() req: any" backend/src/presentation/controllers/analytics.controller.ts

# A3: guard inyecta repositorio
grep -n "IRoleRepository" backend/src/presentation/middleware/admin-auth.guard.ts

# A6: CACHE_MANAGER en application
grep -rn "CACHE_MANAGER" backend/src/application/

# B1: seed loguea contraseña
grep -n "Password.*adminPassword\|logger.*password" backend/src/seed.ts

# B3: política de password débil
grep -n "MinLength(6" backend/src/application/dto/auth.dto.ts

# C1: sin unique en user_roles
grep -n "user_roles\|role_permissions" backend/src/infrastructure/database/schema.ts

# D1: createRole ignora permissionIds
grep -n "permissionIds" backend/src/application/services/admin.service.ts

# D2: dashboard mock
grep -n "mock data\|For now" backend/src/application/services/admin.service.ts
```
