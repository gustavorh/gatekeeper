# Gatekeeper — Guía para Claude Code

> Este archivo es el contexto canónico para cualquier agente de Claude Code que trabaje en el repo. Léelo antes de editar.

## Producto

**Gatekeeper** es un SaaS B2B **multi-tenant** de **control de asistencia laboral** (marcaje de entrada/salida, colación, administración de usuarios y RBAC). ICP inicial: organizaciones chilenas de 50–500 personas. Identificador de persona: **RUT** + email.

Fuente de verdad de producto: [`docs/product/`](./docs/product/)
- `one-pager.md` — problema, ICP, capacidades
- `capability-map.md` — funcionalidades por dominio
- `glossary.md` — vocabulario del dominio
- `multi-tenant-rules.md` — reglas de aislamiento
- `metrics.md` — métricas de éxito
- `design-system.md` — paleta, tipografía, anti-patrones "AI slop"

Roadmap técnico priorizado: [`docs/architecture/optimization-roadmap.md`](./docs/architecture/optimization-roadmap.md)

## Arquitectura del repo

Monorepo **pnpm workspace** (gestionado por Corepack, versión pineada en `package.json` raíz):

```
backend/   # NestJS 11 + Drizzle + MySQL (puerto 9000 por defecto)
frontend/  # Next.js 15 App Router + React 19 + Tailwind v4 (puerto 8000)
docs/      # Documentación de producto y arquitectura
```

Instalación única desde la raíz: `pnpm install`. Lockfile único: `/pnpm-lock.yaml`. Para ejecutar un script de un paquete específico desde cualquier ubicación: `pnpm --filter ./backend <script>` (o `./frontend`). La raíz expone aliases (`pnpm dev:backend`, `pnpm dev:frontend`, `pnpm build`, `pnpm lint`, `pnpm db:migrate`, etc.).

Backend y frontend se comunican por **REST**. El frontend usa `ApiClient` (`frontend/src/lib/api.ts`) y guarda el JWT en `localStorage`.

### Backend — Clean Architecture

```
backend/src/
├── application/       # DTOs, services, decorators, modules (Nest)
├── domain/            # entities, repository interfaces, domain services
├── infrastructure/    # Drizzle schemas, DB config, repo implementations
├── presentation/      # controllers, guards, interceptors, filters, middleware
└── utils/             # rut-validator, response-helper, validation-helper
```

Flujo: **Controller → Service → Repository → Drizzle**. Controllers son delgados (DTO validation + delegate). Repos usan `@Inject('DATABASE')`.

### Frontend — App Router

```
frontend/src/
├── app/               # rutas Next.js (auth route group, dashboard, admin, turnos)
├── components/        # UI compartido + ProtectedRoute, RoleProtectedRoute
├── contexts/          # AuthContext, NotificationContext
├── lib/               # api.ts (ApiClient), adminService, utils (cn)
└── types/             # contratos compartidos con backend
```

## Reglas innegociables

1. **Multi-tenant:** toda consulta y mutación debe filtrar por `organizationId` del JWT activo. Nunca devolver datos de otra organización. La unidad de aislamiento es la **organización**.
2. **Identidad:** persona se identifica con **RUT** chileno + email. Usar `utils/rut-validator.ts` y el decorator `@IsRut()`.
3. **Contrato API:** todas las respuestas pasan por `ResponseInterceptor` (`ApiResponse<T>` con `success`/`data`/`message`/`errors`). Devuelve el payload de `data`, no envuelvas manualmente.
4. **Errores backend:** lanzar `HttpException` tipadas de Nest (`BadRequestException`, `NotFoundException`, `ConflictException`, etc.). Nunca payloads ad-hoc.
5. **Secrets:** nunca loguear ni devolver contraseñas/tokens en claro.
6. **TypeScript strict** en ambos stacks. `import type` para imports solo de tipos. Nada de `any` sin razón documentada.

## Convenciones de código

- **Archivos:** kebab-case (`auth.controller.ts`, `protected-route.tsx`)
- **Clases:** PascalCase
- **Interfaces / types:** PascalCase, sin prefijo `I`
- **Funciones / variables:** camelCase
- **Constantes:** UPPER_SNAKE_CASE
- **Sufijos:** `Dto`, `Repository`, `Service`, `Controller`
- **Componentes React:** PascalCase, archivos kebab-case
- **Imports:** alias `@/` en frontend; orden: externos → internos → tipos
- **Prettier:** `singleQuote`, `trailingComma: 'all'`

## Comandos frecuentes

### Backend (`cd backend`)
```bash
pnpm start:dev           # dev con watch
pnpm build               # compile
pnpm lint                # eslint --fix
pnpm test                # unit
pnpm test:e2e            # integración
pnpm db:generate         # generar migración Drizzle
pnpm db:migrate          # aplicar migraciones
pnpm db:studio           # UI Drizzle
pnpm db:seed             # seed inicial (roles, permisos, admin user)
```

### Frontend (`cd frontend`)
```bash
pnpm dev                 # next dev con turbopack
pnpm build
pnpm lint                # next lint
```

### Docker
```bash
# Cada stack tiene su Dockerfile; no hay docker-compose raíz (oportunidad pendiente)
```

## Endpoints relevantes

- **API:** `http://localhost:9000`
- **Swagger:** `http://localhost:9000/api/docs`
- **Health check:** `http://localhost:9000/health` (terminus, ver `presentation/controllers/health.controller.ts`)
- **Frontend:** `http://localhost:8000`

## Stack en uso vs. infrautilizado

**Backend usa:** NestJS 11, Drizzle ORM, JWT + Passport, class-validator, Swagger, ConfigModule, Throttler, Terminus.
**Backend no usa todavía** (ver roadmap): CQRS, Cache (Redis), Schedule (cron), WebSockets, Bull, audit logs, Postgres RLS.

**Frontend usa:** Next.js 15 App Router, React 19, Tailwind v4, Context API, react-hook-form + zod.
**Frontend no usa todavía** (ver roadmap): Server Actions, Parallel/Intercepting routes, Streaming + Suspense, `next/image`, tRPC o codegen de tipos desde Swagger.

## Agentes especializados

En `.claude/agents/` hay 6 agentes con responsabilidades acotadas. Invócalos cuando la tarea entre en su scope:

- **product-manager** — qué/por qué, historias de usuario, criterios de aceptación, métricas
- **backend-developer** — NestJS, Drizzle, migraciones, DTOs, guards, servicios
- **frontend-developer** — Next.js App Router, React, Tailwind, componentes
- **framework-leverage-auditor** — detecta features de NestJS/Next.js no aprovechados
- **qa-tester** — Jest unit/E2E, cobertura, criterios de aceptación verificables
- **devops-deployer** — Docker, migraciones en deploy, CI/CD, observabilidad

Cada agente tiene su scope y prohibiciones en su archivo `.md`. Respétalos.

## Cuándo escalar al usuario

- Cambio de stack (otro ORM, otra BD, otro framework)
- Cambio de contratos públicos del API (rompería el frontend o integraciones)
- Migración de esquema irreversible o que afecte datos en prod
- Creación de nuevas variables de entorno (impacto en deploy)
- Decisiones de roadmap o priorización
