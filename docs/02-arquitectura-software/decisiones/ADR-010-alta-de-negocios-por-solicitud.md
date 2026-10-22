# ADR-010: Alta de negocios por solicitud con aprobación

- **Estado:** Aceptada
- **Fecha:** octubre 2026
- **Drivers:** DA04 (aislamiento y control de acceso), AC06 (confiabilidad de la información), AC05 (usabilidad)
- **Requisitos:** RF07, RF15, RF18–RF23 · HU06, HU11, HU14–HU17

## Contexto
Hasta ahora la única forma de crear un negocio era el script `npm run seed`. Para el piloto en Huamanga, las tiendas tienen que poder unirse solas desde el celular (HU15). Al mismo tiempo, la promesa de JAMA al cliente es que **los descuentos son reales** (AC06). Si cualquiera puede crear una cuenta y publicar al instante, una cuenta falsa o un negocio que no cumple RC08 (productos aptos y dentro de su fecha) aparecería en la vitrina sin que nadie lo revise.

Además, la regla RN-09 ("un negocio suspendido no publica ni recibe pedidos") estaba documentada pero **no se aplicaba**: el login no miraba el estado del negocio. Con negocios que todavía no fueron revisados, esa brecha deja de ser teórica.

## Decisión
1. **El negocio se registra solo, pero entra PENDIENTE.** Un formulario público (`/negocios/registro`) crea la cuenta con su contraseña en estado `PENDIENTE` (RF19). No hace falta que el administrador cree cuentas ni que exista un flujo de "definir contraseña" por correo.
2. **Ciclo de vida del negocio en el dominio** (RN-14). La entidad `Negocio` es la única que cambia su estado, con transiciones explícitas:

   ```mermaid
   stateDiagram-v2
       [*] --> PENDIENTE: solicitar()
       PENDIENTE --> ACTIVO: aprobar(admin)
       PENDIENTE --> RECHAZADO: rechazar(admin, motivo)
       ACTIVO --> SUSPENDIDO: suspender(admin, motivo)
       SUSPENDIDO --> ACTIVO: reactivar(admin)
       RECHAZADO --> [*]
   ```
   Cada transición guarda quién la hizo y cuándo (`revisado_por`, `revisado_en`) y, si aplica, el motivo.
3. **Solo un negocio ACTIVO opera** (RN-13). Se aplica en tres puntos:
   - **Login:** primero se verifican las credenciales y *después* el estado, para no revelar el estado de un correo a quien no tiene la contraseña. Un negocio no activo recibe `403` con un código (`NEGOCIO_PENDIENTE`, `NEGOCIO_RECHAZADO` con motivo, `NEGOCIO_SUSPENDIDO`) que el panel traduce a un mensaje claro (RF20).
   - **Publicar oferta:** Ofertas consulta a Negocios por su API pública antes de publicar (relación ya prevista en el nivel 3 del C4).
   - **Vitrina y pedidos:** el listado público solo muestra ofertas de negocios ACTIVO, y `PedirOferta` no reserva sobre una oferta de un negocio que no lo está.
4. **El administrador aprueba o rechaza** desde un panel mínimo (`/admin`), con su propio rol (ver [ADR-011](ADR-011-cuentas-de-administrador.md)). Al resolver, el panel arma un enlace `wa.me` con el aviso para el negocio (RF22). Ese enlace se arma en el frontend: es una comodidad para el administrador, no una regla de negocio, y no llama a ningún servicio externo.
5. **Protección del formulario público** (RF23): límite de 5 solicitudes por hora por IP, correo y WhatsApp únicos (RN-16, con índices únicos en la base), y validación de datos en el dominio (RN-15).

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Registro abierto (publica al instante) | Cualquiera podría publicar sin revisión; contradice AC06 y no hay forma de verificar RC08 antes de que la oferta llegue al cliente. |
| Solo contacto por WhatsApp; el administrador crea cada cuenta a mano | Cero código, pero no escala, obliga a mandar contraseñas por chat y el negocio no puede unirse fuera del horario del administrador. |
| Solicitud sin contraseña; al aprobar se envía un enlace para crearla | Necesita envío de correos (servicio externo con costo, RC10) o mandar enlaces sensibles por WhatsApp. Definir la contraseña al enviar la solicitud evita ambos. |
| Tabla aparte `solicitudes` y copiar a `negocios` al aprobar | Duplica datos y lógica; con un estado `PENDIENTE` en el mismo registro el negocio ya tiene identidad estable desde el inicio y el historial queda en un solo lugar. |

## Consecuencias
- ✅ Las tiendas se unen solas y la vitrina solo muestra negocios revisados.
- ✅ RN-09/RN-13 por fin se aplican en login, publicación, vitrina y pedidos.
- ✅ No se agrega ningún servicio externo nuevo (sin correo, sin SMS): el aviso va por WhatsApp como el resto del sistema (DA06).
- ⚠️ Hasta que exista el panel `/admin`, la aprobación se hace con una consulta SQL documentada en el plan.
- ⚠️ Un JWT emitido antes de una suspensión sigue siendo válido hasta que expira (ya aceptado en ADR-006). Publicar y pedir vuelven a verificar el estado, así que el negocio suspendido no puede operar aunque su token siga vivo.
- ⚠️ Un negocio rechazado no puede volver a usar el mismo correo o WhatsApp para otra solicitud; si fue un error, el administrador lo corrige.
