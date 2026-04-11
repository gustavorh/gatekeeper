# Mapa de capacidades

| Capacidad | Estado | Notas / dependencias |
|-----------|--------|----------------------|
| Login con RUT + contraseña | MVP | JWT incluye contexto de **organización activa**. |
| Registro de usuario | MVP | Creación de **organización** propia o pertenencia a una existente según flujo acordado. |
| Cambiar organización activa (sesión) | Diseñado / en evolución | Emite nuevo token con otra `organizationId` si el usuario tiene membresía. |
| Marcar entrada / salida | MVP | Marcajes **acotados a la organización activa**. |
| Colación e historial de turnos | MVP | Mismo aislamiento por organización en listados agregados. |
| Analíticas de horas (semana/mes) | MVP | Sobre turnos del usuario en el contexto org. |
| Panel admin: usuarios, roles, permisos | MVP | Listados y acciones **solo dentro de la organización del token**. |
| RBAC global (roles en BD) | MVP | Roles compartidos entre orgs; **alcance de datos** filtrado por organización. |
| Onboarding B2B avanzado (invitaciones, SSO) | Futuro | Depende de prioridad comercial y cumplimiento. |
| Auditoría formal de cambios | Futuro | Tablas de auditoría o eventos; priorizar según ICP. |
| Políticas de horario / geocercas | Futuro | No incluido en el MVP actual. |
