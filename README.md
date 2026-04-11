# Gatekeeper

Monorepo del producto **Gatekeeper** (control de asistencia B2B, multi-organización).

## Estructura

| Paquete | Descripción | Tecnologías |
|---------|-------------|-------------|
| [gatekeeper-backend](gatekeeper-backend/README.md) | API RESTful | NestJS + MySQL (Drizzle ORM) |
| [gatekeeper-frontend](gatekeeper-frontend/README.md) | Aplicación Web | Next.js 15 + React 19 |

## Desarrollo

Cada proyecto tiene sus propias dependencias y scripts. Trabaja en cada directorio según el componente que necesites modificar:

```bash
# Backend
cd gatekeeper-backend
npm install
npm run dev

# Frontend
cd gatekeeper-frontend
npm install
npm run dev
```

## Documentación de producto

- [One-pager](docs/product/one-pager.md)
- [Glosario](docs/product/glossary.md)
- [Mapa de capacidades](docs/product/capability-map.md)
- [Métricas](docs/product/metrics.md)
- [Reglas multi-tenant](docs/product/multi-tenant-rules.md)

## Historial

Este repositorio fue migrado a monorepo preservando el historial completo de commits de los repositorios originales:
- `gatekeeper-frontend` (antes: github.com/gustavorh/gatekeeper-frontend)
- `gatekeeper-backend` (antes: github.com/gustavorh/gatekeeper-backend)
