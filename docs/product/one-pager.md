# Gatekeeper — One-pager de producto

## Contexto

Gatekeeper es un producto B2B orientado al **control de asistencia laboral** (marcajes de jornada, seguimiento de horas y administración de personas con roles). El código actual es un **MVP** validado para comprobar necesidad; la dirección acordada es evolucionar hacia **SaaS multi-organización** con aislamiento de datos entre clientes.

## Problema

Las empresas necesitan **registrar y consultar la asistencia** de forma fiable, con **separación clara entre organizaciones** (clientes B2B) y **gobernanza** (quién administra usuarios y permisos). Sin una herramienta unificada, el control se dispersa en hojas o sistemas no integrados, dificultando auditoría y operación a escala.

## Propuesta de valor

- **Registro de jornada** con entrada, salida y colación, con estados coherentes (pendiente / activa / completada).
- **Multi-organización**: cada cliente opera en su contexto; los datos de asistencia y usuarios asociados a una organización no se mezclan con los de otra.
- **RBAC** (roles y permisos) para separar, por ejemplo, empleado y administrador.
- **Identificación de personas** adaptada al mercado (p. ej. RUT en Chile) además de email.

## Para quién (ICP inicial, hipótesis)

- **Organizaciones** que necesitan control de asistencia digital (RRHH u operaciones).
- **Administradores** que gestionan usuarios y revisan marcajes en su organización.
- **Empleados** que marcan entrada/salida y consultan su historial en el contexto de su organización.

Refinar ICP con datos de uso y entrevistas; este documento es la línea base.

## Qué hace el producto hoy (MVP)

- Autenticación (login/registro) y perfil de usuario.
- Marcaje de jornada (clock-in / clock-out), colación, historial y analíticas básicas de horas.
- Panel administrativo con gestión de usuarios, roles y permisos (alcance acotado a la **organización actual** en la versión multi-tenant).

## Próximos 2–3 trimestres (dirección, no compromiso de fecha)

- Consolidar **modelo multi-tenant** en API y datos (organización como unidad de aislamiento).
- Mejorar **onboarding B2B** (creación de organización, invitaciones, primer administrador).
- Profundizar **reporting y trazabilidad** según prioridad de cumplimiento y clientes pilotos.

## Supuestos

- El valor inicial está en **fiabilidad del marcaje** y **aislamiento entre clientes**, no en nicho vertical específico.
- La escala vendrá por **número de organizaciones** y **volumen de registros** de asistencia.

## No-objetivos (por ahora)

- Sustituir un sistema de nómina completo o asesoría legal/laboral por país.
- Prometer integraciones enterprise sin roadmap explícito acordado con el equipo.

## Preguntas abiertas

- Segmento geográfico prioritario y requisitos normativos específicos por país.
- Nivel de auditoría formal (logs inmutables, exportaciones legales) requerido por los primeros clientes de pago.

## Referencias en el repositorio

- [Glosario](glossary.md)
- [Mapa de capacidades](capability-map.md)
- [Métricas](metrics.md)
- [Reglas multi-tenant](multi-tenant-rules.md)
