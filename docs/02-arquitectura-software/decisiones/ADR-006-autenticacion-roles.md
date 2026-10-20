# ADR-006: Autenticación JWT, roles y filtrado por negocio

- **Estado:** Aceptada
- **Drivers:** DA04 (aislamiento y seguridad), AC04

## Contexto
Varios negocios comparten el mismo sistema y la misma base de datos. Un negocio nunca debe ver ni modificar las ofertas o los códigos de otro. El cliente comprador no se registra.

## Decisión
- **Tres roles:** `ANONIMO` (cliente, solo lectura pública y creación de pedidos), `NEGOCIO` y `ADMIN`.
- **Autenticación** de negocios y administradores con correo y contraseña. Las contraseñas se guardan con `bcrypt` y la sesión usa **JWT** de corta duración.
- **Autorización** en dos niveles:
  1. Un middleware de Express (presentación) valida el token y el rol.
  2. Los casos de uso reciben el `negocioId` del usuario autenticado y los repositorios **siempre** filtran por él. El `negocioId` nunca se toma del cuerpo de la petición.
- Límite de peticiones (*rate limiting*) en `POST /pedidos`, para evitar que alguien reserve todo el stock con un script.
- HTTPS obligatorio en producción.

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Sesiones en el servidor | Exigen un almacén de sesiones compartido si hay varias instancias. |
| Login con Google para los negocios | Muchos dueños de negocio no usan Google; queda como opción futura. |
| Registro obligatorio del cliente | Contradice la propuesta de valor: sin app y sin registro (AC05). |

## Consecuencias
- ✅ Hay aislamiento entre negocios aunque la base de datos sea compartida.
- ⚠️ Un JWT no se puede revocar antes de que expire; se mitiga con una duración corta y un token de renovación.
