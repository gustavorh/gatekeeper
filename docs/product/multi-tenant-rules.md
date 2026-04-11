# Reglas multi-tenant (producto y comportamiento del sistema)

Este documento fija las reglas de negocio **observables** para el modo B2B multi-organización. El detalle de implementación (tablas, JWT) vive en el código y en migraciones; aquí se define **qué debe cumplirse**.

## 1. Pertenencia usuario–organización

- Un **usuario** puede estar asociado a una o más **organizaciones** mediante **membresías**.
- Toda acción sobre datos de negocio (marcajes, listados de personal de la empresa, etc.) ocurre en el contexto de **una organización activa** por sesión (token).
- Si el usuario tiene una sola membresía, esa es la organización activa por defecto al iniciar sesión.
- Si tiene varias, debe existir un mecanismo para **elegir la organización activa** y obtener un token coherente con esa elección.

## 2. Aislamiento obligatorio

- **Ningún** listado, lectura o mutación de datos de asistencia o de usuarios “de la empresa” puede devolver o alterar información de **otra** organización que no sea la del contexto actual.
- Los administradores **solo** gestionan usuarios y datos que pertenezcan a **su** organización en esa sesión.
- Intentos de acceso a recursos identificados por ID de otra organización deben fallar de forma segura (p. ej. 404 o 403), sin filtrar existencia de datos ajenos.

## 3. Onboarding mínimo B2B

- Toda nueva alta debe resultar en al menos **una organización** y **una membresía** para el usuario creador (o flujo explícito de invitación, cuando exista).
- El primer usuario con capacidad administrativa en una organización debe poder **dar de alta** a más usuarios **solo** en esa organización.

## 4. Trazabilidad (nivel MVP+)

- Prioridad: registrar **quién** realiza acciones administrativas sensibles cuando el producto lo requiera para pilotos; ampliar según demanda de cumplimiento.

## 5. Criterios de aceptación transversales (verificables)

- Dados de organización A no aparecen en respuestas cuando el token es de organización B.
- Cambiar la organización activa cambia el conjunto de datos visible de forma consistente.
