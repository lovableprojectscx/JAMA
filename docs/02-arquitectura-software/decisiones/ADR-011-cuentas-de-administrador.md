# ADR-011: Cuentas de administrador

- **Estado:** Aceptada
- **Fecha:** octubre 2026
- **Drivers:** DA04 (aislamiento y control de acceso), AC04 (seguridad)
- **Requisitos:** RF15, RF17, RF21 · HU11, HU17

## Contexto
[ADR-006](ADR-006-autenticacion-roles.md) definió el rol `ADMIN`, pero no dónde viven esas cuentas ni cómo se crean. Para aprobar solicitudes de negocios ([ADR-010](ADR-010-alta-de-negocios-por-solicitud.md)) hace falta, por primera vez, una cuenta de administrador real.

## Decisión
- **Tabla propia `administradores`**, del módulo **Acceso** (id, nombre, correo único, `password_hash` con bcrypt, fecha de creación). Un administrador **no** es un negocio: no tiene ofertas ni `negocioId`, así que no se mezcla con la tabla `negocios`.
- **Sin registro público.** Las cuentas se crean con un script de línea de comandos (`npm run crear-admin -- <correo>`), que pide la contraseña sin dejarla en el historial de la terminal.
- **Login separado:** `POST /api/v1/auth/admin/login` emite un JWT con `rol: 'ADMIN'` y `adminId`. El de negocios sigue en `POST /api/v1/auth/login` con `rol: 'NEGOCIO'`.
- **Autorización por rol en el middleware:** las rutas `/api/v1/admin/*` exigen `rol = ADMIN`; las rutas `/api/v1/negocios/me/*` y `/api/v1/pedidos/*` exigen `rol = NEGOCIO`. Un token de un rol nunca sirve para las rutas del otro.
- El panel `/admin` vive en la misma SPA (ADR-009), como el panel del negocio, y guarda su token aparte del token del negocio.

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Un solo administrador definido en variables de entorno (correo + hash) | Más simple, pero no permite más de una persona ni saber quién aprobó cada solicitud (`revisado_por`). |
| Una columna `rol` en la tabla `negocios` | Mezcla dos actores distintos: un administrador terminaría con campos de negocio vacíos y con acceso potencial a rutas de negocio. |
| Usar Supabase Auth para los administradores | Agrega un segundo sistema de autenticación distinto al del resto de la API (ADR-006) solo para unas pocas cuentas. |

## Consecuencias
- ✅ Cada aprobación o rechazo queda firmada por un administrador concreto.
- ✅ La separación de rutas por rol se prueba con tests de aislamiento, igual que el aislamiento entre negocios.
- ⚠️ Crear o dar de baja administradores requiere acceso a la terminal con la base de datos; es aceptable para un equipo de una o dos personas.
