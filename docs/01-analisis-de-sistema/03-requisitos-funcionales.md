# 03 · Requisitos funcionales

Los requisitos funcionales expresan **lo que el sistema debe hacer** para satisfacer las historias de usuario y responder a la realidad operativa del comercio en Huamanga.

## Requisitos

| ID | Requisito funcional |
|---|---|
| RF01 | El sistema debe listar las ofertas de cierre **vigentes** (no vencidas, con stock y dentro de su hora límite), ordenadas por cercanía o relevancia en la Zona Centro de Huamanga. |
| RF02 | El sistema debe permitir filtrar las ofertas por categorías base y categorías dinámicas (incluyendo subrubro `Otro`), contabilizando las raciones activas en tiempo real mediante píldoras interactivas. |
| RF03 | El sistema debe mostrar el detalle de una oferta: fotos, precio de carta, precio de oferta, % de descuento, cantidad disponible, hora límite, fecha de vencimiento, dirección física y enlace a Google Maps. |
| RF04 | El sistema debe generar un **código de canje único** por pedido (p. ej. `CAGX`) y desplegar el **Flujo Concierge de Cobro Centralizado con Yape**, indicando monto exacto, cuenta Yape oficial de JAMA y botón para copiar el número. |
| RF05 | El sistema debe **reservar** una unidad de la oferta al generar el código y **liberarla** automáticamente si no se confirma el pago o la venta dentro de un tiempo definido (30 minutos). |
| RF06 | El sistema debe generar enlaces `wa.me` estructurados: uno hacia Operaciones JAMA para adjuntar la constancia de pago Yape, y otro hacia la tienda para coordinar el recojo o notificar la autorización de entrega. |
| RF07 | El sistema debe permitir registrar y administrar el perfil del negocio: datos de contacto, dirección en Huamanga, horario, Yape, redes sociales (Instagram, Facebook, TikTok) y descarga de Kit Físico de Mostrador QR en alta resolución. |
| RF08 | El sistema debe permitir crear una oferta con fotos, precio de carta, precio de oferta (RN-01), cantidad disponible, hora de elaboración y hora límite de recojo. |
| RF09 | El sistema debe permitir al negocio editar en vivo, pausar, reactivar y republicar en 1 toque ofertas anteriores. |
| RF10 | El sistema debe **finalizar automáticamente** las ofertas cuando se agote el stock o se cumpla su hora límite. |
| RF11 | El sistema debe permitir buscar un código y marcarlo como **vendido** (`VENDIDO`) o **no concretado** (`NO_CONCRETADO`), actualizando el stock y registrando la trazabilidad (tanto por el negocio como por el administrador). |
| RF12 | El sistema debe calcular y mostrar reportes y métricas de impacto comercial y ambiental por negocio en períodos (`hoy`, `semana`, `mes`, `historico`): dinero recuperado, raciones rescatadas, efectividad de canje, CO₂e evitado, agua preservada y ranking Top 5 de productos. |
| RF13 | El sistema debe contemplar la estructura de límites de plan: **Gratis** y **Pro** para futuras fases de monetización. |
| RF14 | El sistema debe permitir al cliente reportar una oferta indicando el motivo (descuento falso, mal estado u otro). |
| RF15 | El sistema debe permitir al administrador verificar, activar, suspender y resolver solicitudes de negocios. |
| RF16 | El sistema debe permitir al administrador revisar y resolver los reportes de los clientes. |
| RF17 | El sistema debe autenticar a negocios y administradores mediante JWT con claims de rol (`ADMIN` / `NEGOCIO`), restringiendo el acceso por principio de menor privilegio. |
| RF18 | El sistema debe ofrecer una página pública de presentación para negocios (`/negocios`), separada de la vitrina, explicando el modelo de rescate y dando acceso al formulario de solicitud y al panel. |
| RF19 | El sistema debe permitir que un negocio envíe una **solicitud de registro** (`/negocios/registro`) con compromiso de calidad de productos aptos (RC08), quedando en estado **PENDIENTE**. |
| RF20 | El sistema debe impedir que un negocio que no esté **ACTIVO** inicie sesión o publique ofertas, e informarle su estado en pantalla (en revisión, rechazado con motivo, o suspendido). |
| RF21 | El sistema debe permitir al administrador listar las solicitudes por estado y **aprobarlas** o **rechazarlas** indicando un motivo obligatorio, registrando quién y cuándo lo hizo. |
| RF22 | El sistema debe ofrecer al administrador un enlace `wa.me` con un mensaje prellenado para avisarle al negocio que su solicitud fue aprobada o rechazada. |
| RF23 | El sistema debe limitar solicitudes de registro por IP y rechazar correos o WhatsApp ya registrados. |
| RF24 | El sistema debe ofrecer una página pública individual para cada negocio aliado (`/t/:slug`), con foto de portada, logotipo, insignia de verificado, dirección en Google Maps, horario de recojo, redes sociales y vitrina de ofertas vigentes. |
| RF25 | El sistema debe permitir al administrador en `/admin` listar pedidos centralizados, validar comprobantes Yape de clientes, transicionar a `VENDIDO` y avisar por WhatsApp a la tienda con la orden autorizada de recojo y liquidación. |
| RF26 | El sistema debe permitir al administrador en `/admin` realizar la **publicación asistida** de ofertas en nombre de negocios activos cuando los dueños envíen la información por WhatsApp. |

## Relación entre HU y requisitos funcionales

| Historia de usuario | Requisitos funcionales relacionados |
|---|---|
| HU01 Ver ofertas cercanas | RF01 |
| HU02 Filtrar ofertas | RF02 |
| HU03 Ver detalle de la oferta | RF03 |
| HU04 Pedir y pagar con Yape Concierge | RF04, RF05, RF06 |
| HU05 Reportar oferta | RF14 |
| HU06 Registrar negocio | RF07, RF17 |
| HU07 Publicar oferta | RF08, RF13 |
| HU08 Gestionar ofertas | RF09, RF10 |
| HU09 Validar código | RF11, RF05 |
| HU10 Reporte mensual / impacto | RF12 |
| HU11 Verificar negocios | RF15 |
| HU12 Gestionar planes | RF13 |
| HU13 Atender reportes y suspender | RF15, RF16 |
| HU14 Conocer JAMA como negocio | RF18 |
| HU15 Enviar solicitud de registro | RF19, RF23 |
| HU16 Saber el estado de mi solicitud | RF20 |
| HU17 Aprobar o rechazar solicitudes | RF15, RF17, RF21, RF22 |
| HU18 Personalizar perfil y portada | RF07, RF24 |
| HU19 Ver perfil público de tienda | RF24 |
| HU20 Redes sociales y Kit Mostrador QR | RF07, RF24 |
| HU21 Métricas de impacto comercial y ambiental | RF12 |
| HU22 Validación Concierge de pagos Yape y aviso a tienda | RF04, RF06, RF11, RF25 |
| HU23 Publicación asistida de ofertas desde Admin | RF08, RF26 |

> *Detalle de versiones y trazabilidad documental:*
> - **Octubre 2026 (Etapa 12–14):** RF18–RF23 agregados para el flujo de alta de comercios con solicitud y aprobación ([ADR-010](../02-arquitectura-software/decisiones/ADR-010-alta-de-negocios-por-solicitud.md), [ADR-011](../02-arquitectura-software/decisiones/ADR-011-cuentas-de-administrador.md)).
> - **Noviembre 2026 (Etapa 17–19):** RF24 agregado para perfiles públicos `/t/:slug` y personalización ([ADR-012](../02-arquitectura-software/decisiones/ADR-012-perfiles-publicos-de-negocio-y-personalizacion.md)).
> - **Noviembre 2026 (Etapa 20–22):** Ampliación de RF07 y RF09 (edición ágil, redes sociales, poster de mostrador QR) y RF12 (métricas de impacto comercial y ambiental con filtros temporales).
> - **Noviembre 2026 (Etapa 23):** RF04, RF06, RF11 ampliados y RF25–RF26 agregados para el **Flujo Concierge de Cobro Centralizado con Yape y Publicación Asistida** ([ADR-013](../02-arquitectura-software/decisiones/ADR-013-flujo-concierge-cobro-yape-y-publicacion-asistida.md)).

## Fuera del alcance del MVP
- Alertas automáticas por push notifications o geocercas activas.
- Pasarela bancaria automatizada con cobro de comisión por API (Niubiz/Culqi); en su lugar se opera el modelo Concierge asistido con cobro centralizado Yape hasta validar el volumen transaccional de Huamanga.
- Entrega por delivery propio (el MVP opera mediante recojo en local en Zona Centro).
