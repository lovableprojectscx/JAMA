# 03 · Requisitos funcionales

Los requisitos funcionales expresan **lo que el sistema debe hacer** para satisfacer las historias de usuario.

## Requisitos

| ID | Requisito funcional |
|---|---|
| RF01 | El sistema debe listar las ofertas de cierre **vigentes** (no vencidas, con stock y dentro de su hora límite), ordenadas por cercanía a la ubicación del cliente. |
| RF02 | El sistema debe permitir filtrar las ofertas por categoría, zona y modalidad de entrega (recojo o delivery). |
| RF03 | El sistema debe mostrar el detalle de una oferta: fotos, precio de carta, precio de oferta, % de descuento, cantidad disponible, hora límite, fecha de vencimiento, dirección y modalidad de entrega. |
| RF04 | El sistema debe generar un **código de canje único** por pedido (p. ej. `K7P2`), asociado a la oferta, sin exigir registro al cliente. |
| RF05 | El sistema debe **reservar** una unidad de la oferta al generar el código y **liberarla** automáticamente si el negocio no confirma la venta dentro de un tiempo definido (p. ej. 30 minutos). |
| RF06 | El sistema debe abrir WhatsApp mediante un enlace `wa.me` con un mensaje prellenado que incluya la oferta y el código de canje. |
| RF07 | El sistema debe permitir registrar un negocio y administrar su perfil: datos de contacto, dirección, horario, número Yape y modalidad de entrega. |
| RF08 | El sistema debe permitir a un negocio crear una oferta con fotos, precio de carta, precio de oferta, cantidad, hora límite y fecha de vencimiento. |
| RF09 | El sistema debe permitir al negocio editar, pausar y finalizar sus ofertas. |
| RF10 | El sistema debe **finalizar automáticamente** las ofertas cuando se agote el stock o se cumpla su hora límite. |
| RF11 | El sistema debe permitir al negocio buscar un código y marcarlo como **vendido** o **no concretado**, actualizando el stock. |
| RF12 | El sistema debe generar un reporte mensual por negocio con pedidos recibidos, ventas concretadas, tasa de conversión y clientes nuevos. |
| RF13 | El sistema debe aplicar los límites del plan: **Gratis** = 1 oferta por día; **Pro** = ofertas ilimitadas y posición destacada en el listado. |
| RF14 | El sistema debe permitir al cliente reportar una oferta indicando el motivo (descuento falso, mal estado u otro). |
| RF15 | El sistema debe permitir al administrador verificar, activar, suspender y desactivar negocios. |
| RF16 | El sistema debe permitir al administrador revisar y resolver los reportes de los clientes. |
| RF17 | El sistema debe autenticar a los negocios y administradores, y restringir cada operación según su rol. |

## Relación entre HU y requisitos funcionales

| Historia de usuario | Requisitos funcionales relacionados |
|---|---|
| HU01 Ver ofertas cercanas | RF01 |
| HU02 Filtrar ofertas | RF02 |
| HU03 Ver detalle de la oferta | RF03 |
| HU04 Pedir por WhatsApp con código | RF04, RF05, RF06 |
| HU05 Reportar oferta | RF14 |
| HU06 Registrar negocio | RF07, RF17 |
| HU07 Publicar oferta | RF08, RF13 |
| HU08 Gestionar ofertas | RF09, RF10 |
| HU09 Validar código | RF11, RF05 |
| HU10 Reporte mensual | RF12 |
| HU11 Verificar negocios | RF15 |
| HU12 Gestionar planes | RF13 |
| HU13 Atender reportes y suspender | RF15, RF16 |

## Fuera del alcance del MVP
- Alertas personalizadas ("avísame cuando haya pollo cerca").
- Canal diario de WhatsApp automatizado.
- Cobro por pedido concretado (fase 2 del modelo de negocio).
- Pago integrado dentro de la plataforma.
