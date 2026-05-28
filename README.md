# Gatekeeper

Monorepo del producto **Gatekeeper** (control de asistencia B2B, multi-organización).

## Estructura

| Paquete | Descripción | Tecnologías |
|---------|-------------|-------------|
| [backend](backend/README.md) | API RESTful | NestJS + MySQL (Drizzle ORM) |
| [frontend](frontend/README.md) | Aplicación Web | Next.js 15 + React 19 |

## Desarrollo

Monorepo **pnpm workspace**. Instala todo desde la raíz una sola vez:

```bash
pnpm install
```

Comandos raíz (delegan al paquete correspondiente):

```bash
pnpm dev:backend          # Nest en watch mode
pnpm dev:frontend         # Next dev con turbopack
pnpm build                # compila ambos paquetes
pnpm lint                 # lint en ambos paquetes
pnpm test:backend         # tests unitarios del backend
pnpm db:generate          # generar migración Drizzle
pnpm db:migrate           # aplicar migraciones
pnpm db:seed              # primer levantamiento: roles, permisos, admin user
```

También puedes trabajar dentro de cada paquete usando filtros:

```bash
pnpm --filter ./backend <script>
pnpm --filter ./frontend <script>
```

Requisitos: Node ≥ 20. La versión de pnpm está pineada en `packageManager` y se gestiona vía [Corepack](https://nodejs.org/api/corepack.html).

## Documentación de producto

- [One-pager](docs/product/one-pager.md)
- [Glosario](docs/product/glossary.md)
- [Mapa de capacidades](docs/product/capability-map.md)
- [Métricas](docs/product/metrics.md)
- [Reglas multi-tenant](docs/product/multi-tenant-rules.md)

## Historial

Este repositorio fue migrado a monorepo preservando el historial completo de commits de los repositorios originales:
- `frontend` (antes: github.com/gustavorh/gatekeeper-frontend)
- `backend` (antes: github.com/gustavorh/gatekeeper-backend)
