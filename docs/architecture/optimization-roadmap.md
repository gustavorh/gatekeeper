# Roadmap de optimización — Gatekeeper

> Inventario priorizado de mejoras de diseño, producto y arquitectura. Fuente para el `framework-leverage-auditor` y entrada del `product-manager` al priorizar sprints.

**Estado base (auditoría inicial):** NestJS 11 + Drizzle + MySQL en backend, Next.js 15 App Router + React 19 en frontend. Arquitectura limpia ya respetada (Controller → Service → Repository). Multi-tenant por `organizationId` filtrado en capa de servicio. Carencias mayores: aprovechamiento de features framework, observabilidad, monorepo formal, tipos compartidos, server-rendering real en frontend.

Leyenda de prioridad:
- **P0** — Crítico, seguridad u operación. Hacer ya.
- **P1** — Alto impacto en producto o DX. Próximo sprint.
- **P2** — Operacional o estructural. Trimestre.
- **P3** — Nice to have.

---

## P0 — Quick wins (sprint actual)

| # | Mejora | Stack | Estado | Notas |
|---|--------|-------|--------|-------|
| 1 | **Rate limiting** en endpoints de auth (`@nestjs/throttler`) | Backend | ✅ Implementado | Protege login/register/change-password de fuerza bruta |
| 2 | **Health checks reales** (`@nestjs/terminus` + DB indicator) | Backend | ✅ Implementado | `/health` y `/health/db` para readiness probes |
| 3 | **Validación de env vars con Joi** (`@nestjs/config` + schema) | Backend | ✅ Implementado | Falla en startup si faltan `JWT_SECRET`, `DATABASE_URL`, etc. |
| 4 | **Middleware edge para auth** (`frontend/src/middleware.ts`) | Frontend | ✅ Implementado | Redirige antes de hidratación, reemplaza `ProtectedRoute` cliente para rutas obvias |
| 5 | **react-hook-form + zod** en formularios críticos (login) | Frontend | ✅ Implementado | Validación tipada compartible con backend |
| 6 | **@nestjs/event-emitter** para shift domain events | Backend | ✅ Implementado | `shift.clocked-in/out/completed` desacoplados; `ShiftAuditListener` para observabilidad |
| 7 | **@nestjs/cache-manager** en perfil de usuario | Backend | ✅ Implementado | `user:<id>:withRoles` cacheado 5 min; invalidado en update/delete |
| 8 | **nestjs-pino** logger estructurado | Backend | ✅ Implementado | JSON en prod, request-id propagado; reemplaza console.log |
| 9 | **Graceful shutdown** MySQL pool | Backend | ✅ Implementado | `OnApplicationShutdown` en DatabaseModule; pool compartido (bug doble pool corregido) |
| 10 | **`__Host-` cookie prefix** en producción | Backend | ✅ Implementado | `AUTH_TOKEN_COOKIE` usa prefijo en prod; guard lee ambos nombres |
| 11 | **JWT exp validation en edge middleware** | Frontend | ✅ Implementado | `jwtLooksFresh()` decodifica base64url y verifica `exp` antes de hidratación |
| 12 | **SWR hooks** para data fetching | Frontend | ✅ Implementado | `useWeeklyAnalytics`, `useMonthlyAnalytics`, `useShiftHistory`, `useCurrentShift` |
| 13 | **loading.tsx / error.tsx** por segmento | Frontend | ✅ Implementado | Dashboard, turnos, admin con spinners y error boundaries |
| 14 | **POST /auth/logout** + clear cookies | Backend | ✅ Implementado | Limpia `AUTH_TOKEN_COOKIE` + `gk-auth` signal; frontend lo llama en logout |
| 15 | **@CurrentOrganization()** decorator | Backend | ✅ Implementado | Extrae `organizationId` del JWT; lanza 401 si ausente |

---

## P1 — Alto impacto (siguiente iteración)

### Producto / Diseño

- **Tabla `organizations` + `user_organizations`** — completa la multi-tenancy real. Hoy el JWT carga `organizationId: 'gatekeeper-default'` y el guard lo valida, pero no hay tablas que respalden el modelo. Requiere migración Drizzle, seed del tenant default, backfill de `shifts` y actualización del flujo de login para elegir org. Owner: `backend-developer`. **Bloqueante para auditoría/compliance B2B real.**
- **Audit logs** (`audit_logs` tabla + interceptor) — quién hizo qué y cuándo. Requisito implícito para B2B y compliance. Owner: `backend-developer`.
- **Implementar design system completo** (`components/ui/`) — hoy hay componentes ad-hoc; `docs/product/design-system.md` define tokens y patrones. Owner: `frontend-developer`.
- **Coherencia de idioma por pantalla** — el repo mezcla ES/EN. Decisión de producto: ¿ES por defecto en todo? Owner: `product-manager` + `frontend-developer`.
- **Estados de turno explícitos en UI** — pending/active/completed con iconografía + label, no solo color (anti-pattern documentado en design-system).

### Backend (NestJS)

- **Error handling refactor** — remover `try-catch` genérico de controllers (`auth.controller.ts`, `shift.controller.ts`, `admin.controller.ts`); dejar que excepciones tipadas (`NotFoundException`, `ConflictException`) se propaguen via `HttpExceptionFilter` ya global. Controllers más limpios, servicios responsables del contexto de error. Owner: `backend-developer`. Esfuerzo: M.
- **Helmet CSP habilitado** — `contentSecurityPolicy: false` en `backend/src/main.ts` debe habilitarse con directivas explícitas (`defaultSrc: ["'self'"]`, etc.). Actualmente deshabilitado = riesgo real en producción. Owner: `devops-deployer`/`backend-developer`. Esfuerzo: S. **[P1 seguridad]**
- **@nestjs/schedule** para auto-cierre de turnos colgados — cron a medianoche cierra turnos `ACTIVE` con `clockOutTime = NULL` que llevan > N horas; emite `SHIFT_AUTO_CLOSED` para auditoría. Implementa en `ShiftScheduleService`. Owner: `backend-developer`. Esfuerzo: M.
- **Custom `@ValidateDtosPipe`** — `@UsePipes(new ValidationPipe({...}))` repetido idénticamente en `auth.controller.ts:45`, `shift.controller.ts:43`, `admin.controller.ts:64`. Centralizar con `APP_PIPE` global o decorator custom. Owner: `backend-developer`. Esfuerzo: S.
- **Guards composability** — `AdminAuthGuard` inyecta y llama `jwtAuthGuard.canActivate()` manualmente. Refactorizar a `@UseGuards(JwtAuthGuard, AdminAuthGuard)` en controllers (NestJS ejecuta en secuencia). Owner: `backend-developer`. Esfuerzo: S.
- **Validación con grupos** — usar class-validator `groups` para diferenciar reglas create vs update en `CreateUserAdminDto`/`UpdateUserAdminDto`. Owner: `backend-developer`. Esfuerzo: S.
- **@ApiResponse Swagger completo** — auditar endpoints; varios retornan `any` en Swagger (`admin.controller.ts` `GET users/:id/with-roles`, analytics endpoints). Agregar tipos concretos con `@ApiResponse({ type: MyDto })`. Owner: `backend-developer`. Esfuerzo: M.
- **Rate limiting en endpoints admin** — endpoints pesados como `GET /admin/shifts` y `GET /admin/users` sin `@Throttle()`. Agregar throttle group `admin: { limit: 100, ttl: 60000 }`. Owner: `backend-developer`. Esfuerzo: S.
- **Server Actions / Type-safe RPC** — generar tipos del backend a partir del Swagger spec (`openapi-typescript`) y consumirlos en frontend; elimina drift manual.

### Frontend (Next.js)

- **Server Components reales en dashboard** — dashboard sigue siendo `'use client'` (`frontend/src/app/dashboard/page.tsx:1`) porque depende de `AuthContext`. Convertir: leer usuario desde cookie en servidor (`cookies().get(AUTH_TOKEN_COOKIE)` + verify), fetch con `revalidate: 60`, pasar datos como props a subcomponentes client interactivos (`ClockInButton`, `ShiftList`). Owner: `frontend-developer`. Esfuerzo: L.
- **`next/image`** para logos y avatares — reemplazar `<img>` con `Image` de `next/image`; optimización automática WebP, lazy loading, sizing hints. Esfuerzo: XS.
- **`generateMetadata()` dinámico** — metadata estático en `layout.tsx` heredado por todas las páginas. Agregar `export async function generateMetadata()` en `/dashboard`, `/admin/*`, `/turnos`. Esfuerzo: XS.
- **Logout revalidation con SSG** — si dashboard se convierte a Server Component, logout debe llamar `revalidatePath('/dashboard')`. Esfuerzo: S.
- **Server Actions** en formularios de mutación (crear usuario, marcar turno, asignar rol) — reduce cliente bundle y mejora UX.
- **Suspense boundary por sección** en `/admin` y `/dashboard`.

---

## P2 — Estructural (trimestre)

### Arquitectura

- **Monorepo formal** con `npm workspaces` (o `pnpm`) y paquete `@gatekeeper/types` compartido — elimina duplicación de tipos entre back y front.
- **docker-compose.yml raíz** — `mysql + backend + frontend + adminer` para dev local en un comando.
- **CI/CD** GitHub Actions: lint + test + build en PR; deploy en merge a `main` (target a definir).
- **Postgres + Row-Level Security** — migrar desde MySQL para forzar multi-tenancy a nivel DB; eliminar la posibilidad de bug en repo que olvide filtrar por `organizationId`.

### Backend

- **CQRS** (`@nestjs/cqrs`) para el agregado `shift` — la lectura (analytics, dashboard) es muchísimo mayor que la escritura (marcaje).
- **@nestjs/bull (BullMQ)** para jobs pesados: export de reportes mensuales (CSV), emails de invitación, recálculo de analytics. `POST /admin/reports/export` → crea job + retorna `jobId`; frontend poll `GET /admin/jobs/{jobId}`. Requiere Redis. Esfuerzo: L.
- **WebSockets** (`@nestjs/websockets`) para marcajes en vivo en dashboards de admin.
- **API versioning** (`/api/v1`) — anticipa breaking changes futuros.
- **Múltiples organizaciones por sesión activa** — hoy un JWT lleva una sola; usuarios con varias orgs deben elegir contexto.

### Frontend

- **Parallel routes** (`@modal`) para crear/editar usuarios sin perder URL state.
- **Intercepting routes** (`(.)`) para detalles de turno desde lista sin reload.
- **Theme provider con dark mode** — los tokens existen en `globals.css` pero el toggle no.
- **Internacionalización** (`next-intl` o nativo) si el producto escala fuera de Chile.

---

## P3 — Nice to have

- Storybook para `components/ui/`
- E2E con Playwright (smoke test del flujo crítico: login → marcar turno → dashboard)
- Métricas de uso (PostHog, Plausible) con consentimiento configurable
- API pública con tokens scoped por organización (integraciones)
- Webhooks salientes (`shift.completed → URL del cliente`)
- App móvil (Flutter o Expo) — fuera de alcance del agente actual

---

## Hallazgos del auditor (cómo se nutre este doc)

El `framework-leverage-auditor` (ver `.claude/agents/framework-leverage-auditor.md`) añade hallazgos aquí cada vez que detecta un patrón infrautilizado. Formato:

```
### <título corto>
- **Stack:** NestJS / Next.js
- **Prioridad:** P0 / P1 / P2 / P3
- **Ubicación:** <ruta:línea>
- **Patrón actual:** <descripción>
- **Propuesta:** <feature nativo a usar>
- **Esfuerzo:** XS / S / M / L
- **Owner:** backend-developer | frontend-developer | devops-deployer
```

Los hallazgos resueltos se mantienen en la lista marcados con ✅ y la sección "P0 — Quick wins" indica su estado.
