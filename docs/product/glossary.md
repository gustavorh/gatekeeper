# Glosario de dominio — Gatekeeper

Definiciones alineadas con el lenguaje de producto y con los nombres usados en código/API cuando existan.

| Término | Definición |
|--------|------------|
| **Organización** | Unidad de aislamiento B2B (tenant): empresa o cuenta cliente. Los usuarios y marcajes están asociados a una organización para garantizar que no se mezclen datos entre clientes. En API/BD suele aparecer como `organization` / `organizationId`. |
| **Tenant** | Sinónimo de **organización** en contexto SaaS multi-tenant. |
| **Usuario / empleado** | Persona con credenciales en el sistema. Puede pertenecer a una o más organizaciones según el modelo de membresía; el token de sesión incluye la **organización activa** para las operaciones. |
| **Membresía** | Relación usuario–organización: indica que el usuario forma parte de esa organización. Permite soportar, a futuro, un mismo usuario en varias organizaciones con contexto explícito. |
| **Marcaje / jornada / turno (shift)** | Registro de una jornada laboral: hora de entrada, salida, colación y estado (pendiente, activa, completada). |
| **RUT** | Rol Único Tributario (identificador chileno). Se usa como identificador de login junto con la contraseña. |
| **Rol** | Agrupación de permisos (p. ej. `admin`, `user`). Asignación **global** en el MVP actual; evolución posible hacia roles por organización. |
| **Permiso** | Par `resource` + `action` (p. ej. lectura de usuarios) enlazado a roles. |
| **Administrador** | Usuario con permisos elevados para gestionar usuarios/roles en el **ámbito de su organización** (en el modelo multi-tenant). |
