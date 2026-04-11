# Métricas de validación comercial

## North Star (propuesta)

**Organizaciones activas semanalmente (WAU)** que registran al menos un marcaje por parte de un usuario distinto del administrador — indica adopción real más allá del setup inicial.

## Métricas de apoyo

| Métrica | Objetivo de uso |
|---------|-----------------|
| Marcajes completados por día (agregado) | Volumen y retención de uso diario. |
| Tiempo hasta primer marcaje tras alta | “Time to value” tras crear organización o invitar usuario. |
| Retención semanal de usuarios que marcan | Señal de hábito vs cuentas abandonadas. |
| Errores 401/403 en operaciones de turno | Fricción de authz o contexto de organización mal configurado. |

## Definición de “hecho” para validación de negocio (orientativa)

- Piloto con **al menos una organización** usando el producto en contexto real durante un período acordado (p. ej. 4 semanas).
- Evidencia de que **los datos no cruzan organizaciones** (prueba comportamental + pruebas automáticas de aislamiento).
