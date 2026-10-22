# 02 · Historias de usuario

Formato: **Como** [actor], **quiero** [acción], **para** [beneficio].

## Cliente

| ID | Historia de usuario |
|---|---|
| HU01 | Como cliente, quiero ver las ofertas de cierre del día cerca de mi ubicación, para aprovechar descuentos en comida sin recorrer negocios. |
| HU02 | Como cliente, quiero filtrar las ofertas por categoría (pollo, pan, tortas) y zona, para encontrar rápido lo que me interesa. |
| HU03 | Como cliente, quiero ver el detalle de una oferta (precio de carta, precio de oferta, cantidad disponible, hora límite de recojo y fecha de vencimiento), para decidir con confianza si la compro. |
| HU04 | Como cliente, quiero pedir una oferta y que se abra WhatsApp con un mensaje y un código ya escritos, para coordinar el pago y el recojo sin descargar una app ni registrarme. |
| HU05 | Como cliente, quiero reportar una oferta con descuento falso o producto en mal estado, para que la plataforma actúe y proteja a otros compradores. |

## Negocio (seller)

| ID | Historia de usuario |
|---|---|
| HU06 | Como negocio, quiero registrarme y crear mi perfil (nombre, dirección, horario, WhatsApp, número Yape y modalidad de entrega), para empezar a publicar ofertas. |
| HU07 | Como negocio, quiero publicar una oferta de cierre con foto, precio de carta, precio de oferta, cantidad y hora límite, para vender el producto que me sobró antes de que se pierda. |
| HU08 | Como negocio, quiero editar, pausar o finalizar mis ofertas, para mantener actualizado lo que realmente tengo disponible. |
| HU09 | Como negocio, quiero marcar el código de un pedido como vendido con un toque, para registrar la venta y liberar o descontar el stock. |
| HU10 | Como negocio, quiero consultar un reporte mensual de pedidos recibidos, ventas concretadas y clientes nuevos, para saber si la plataforma me trae clientes y justificar el plan Pro. |
| HU14 | Como dueño de una pastelería o panadería que todavía no conoce JAMA, quiero una página que me explique qué gano, cómo funciona para mi negocio y qué necesito, para decidir si me uno. |
| HU15 | Como dueño de un negocio, quiero enviar mi solicitud de registro desde el celular en pocos minutos, para empezar a publicar sin tener que llamar a nadie. |
| HU16 | Como negocio con una solicitud enviada, quiero que el panel me diga si mi cuenta está en revisión o fue rechazada (y por qué), para no pensar que la página falló. |

## Administrador

| ID | Historia de usuario |
|---|---|
| HU11 | Como administrador, quiero verificar a los negocios y su precio de carta con foto, para garantizar que los descuentos publicados sean reales. |
| HU12 | Como administrador, quiero gestionar el plan de cada negocio (Gratis o Pro), para aplicar los límites y beneficios correspondientes. |
| HU13 | Como administrador, quiero revisar los reportes de los clientes y suspender a los negocios que incumplan las reglas, para mantener la confianza en la plataforma. |
| HU17 | Como administrador, quiero ver las solicitudes de registro pendientes y aprobarlas o rechazarlas con un motivo, y avisarle al negocio por WhatsApp, para que en la vitrina solo publiquen negocios reales. |

> *Agregado en octubre 2026:* HU14–HU17 detallan el alta de negocios. HU06 ("registrarme y crear mi perfil") se cumple en dos pasos: el negocio envía una **solicitud** (HU15) y el administrador la **aprueba** (HU17) antes de que pueda publicar. Ver [ADR-010](../02-arquitectura-software/decisiones/ADR-010-alta-de-negocios-por-solicitud.md).
