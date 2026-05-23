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

---

## P1 — Alto impacto (siguiente iteración)

### Producto / Diseño

- **Tabla `organizations` + `user_organizations`** — completa la multi-tenancy real. Hoy el JWT carga `organizationId: 'gatekeeper-default'` y el guard lo valida, pero no hay tablas que respalden el modelo. Requiere migración Drizzle, seed del tenant default, backfill de `shifts` y actualización del flujo de login para elegir org. Owner: `backend-developer`. **Bloqueante para auditoría/compliance B2B real.**
- **Audit logs** (`audit_logs` tabla + interceptor) — quién hizo qué y cuándo. Requisito implícito para B2B y compliance. Owner: `backend-developer`.
- **Implementar design system completo** (`components/ui/`) — hoy hay componentes ad-hoc; `docs/product/design-system.md` define tokens y patrones. Owner: `frontend-developer`.
- **Coherencia de idioma por pantalla** — el repo mezcla ES/EN. Decisión de producto: ¿ES por defecto en todo? Owner: `product-manager` + `frontend-developer`.
- **Estados de turno explícitos en UI** — pending/active/completed con iconografía + label, no solo color (anti-pattern documentado en design-system).

### Backend (NestJS)

- **Server Actions / Type-safe RPC** — generar tipos del backend a partir del Swagger spec (`openapi-typescript`) y consumirlos en frontend; elimina drift manual.
- **@nestjs/cache-manager** para roles/permisos por usuario — hot path leído en cada request autenticada.
- **@nestjs/event-emitter** para efectos de dominio (`shift.completed`, `user.invited`) — desacopla notificaciones de la lógica de marcaje.
- **@nestjs/schedule** para auto-cerrar turnos colgados (`active > N horas → completed automático` por política de organización).
- **Helmet + CORS estricto desde env** — security headers por defecto, CORS lista blanca validada por Joi.
- **Logger estructurado** (pino o nest-winston) — JSON en prod, request-id propagado.

### Frontend (Next.js)

- **Server Actions** en formularios de mutación (crear usuario, marcar turno, asignar rol) — reduce cliente bundle y mejora UX.
- **Server Components reales en dashboard** — la migración parcial ya hecha (SWR + dedup + `loading.tsx`/`error.tsx` por segment) cubre la UX de streaming, pero el dashboard sigue siendo client component porque depende de `AuthContext`. Convertirlo a Server Component requiere reemplazar `AuthContext` por lectura del usuario desde la cookie `auth_token` en server side (`cookies().get('auth_token')` + verify), y trasladar `apiClient.get` a `fetch` con `revalidate: 60`. Owner: `frontend-developer`.
- **`next/image`** para logos y avatares; activar `output: 'standalone'` en `next.config.ts` para imágenes Docker más pequeñas.
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
- **Bull queue** (`@nestjs/bull`) para jobs pesados: export de reportes mensuales, emails de invitación, recálculo de analytics.
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
