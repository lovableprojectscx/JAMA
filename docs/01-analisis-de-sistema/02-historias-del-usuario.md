# 02 · Historias de usuario

Formato: **Como** [actor], **quiero** [acción], **para** [beneficio].

## Cliente

| ID | Historia de usuario |
|---|---|
| HU01 | Como cliente, quiero ver las ofertas de cierre del día cerca de mi ubicación en Zona Centro, para aprovechar descuentos en comida sin recorrer negocios. |
| HU02 | Como cliente, quiero filtrar las ofertas por categorías base y dinámicas (pollo, pan, tortas, cafetería u otras), para encontrar rápido lo que me interesa. |
| HU03 | Como cliente, quiero ver el detalle de una oferta (precio de carta, precio de oferta, cantidad disponible, hora límite de recojo y fecha de vencimiento), para decidir con confianza si la compro. |
| HU04 | Como cliente, quiero pedir una oferta y ver un flujo guiado en 3 pasos para pagar con Yape a JAMA, enviar mi constancia por WhatsApp a operaciones y tener mi código de reserva, para asegurar mi orden sin descargar apps ni ingresar tarjetas. |
| HU05 | Como cliente, quiero reportar una oferta con descuento falso o producto en mal estado, para que la plataforma actúe y proteja a otros compradores. |
| HU19 | Como cliente, quiero ver la página de perfil público de una tienda aliada (`/t/:slug`), para consultar sus ofertas vigentes del día, ubicación exacta en Google Maps, horario de recojo, redes sociales y escribirle a su WhatsApp. |

## Negocio (seller)

| ID | Historia de usuario |
|---|---|
| HU06 | Como negocio, quiero registrarme y crear mi perfil (nombre, dirección, horario, WhatsApp, número Yape), para empezar a publicar ofertas. |
| HU07 | Como negocio, quiero publicar una oferta de cierre con foto, precio de carta, precio de oferta, cantidad y hora límite, para vender el producto que me sobró antes de que se pierda. |
| HU08 | Como negocio, quiero editar en vivo, pausar, reactivar o republicar mis ofertas en un toque, para mantener actualizado lo que realmente tengo disponible. |
| HU09 | Como negocio, quiero buscar un código de pedido y marcarlo como vendido o no concretado, para registrar la entrega física de la ración y mantener el stock al día. |
| HU10 | Como negocio, quiero consultar un reporte mensual de pedidos recibidos, ventas concretadas y clientes nuevos, para saber si la plataforma me trae clientes. |
| HU14 | Como dueño de una pastelería o panadería que todavía no conoce JAMA, quiero una página que me explique qué gano, cómo funciona para mi negocio y qué necesito, para decidir si me uno. |
| HU15 | Como dueño de un negocio, quiero enviar mi solicitud de registro desde el celular en pocos minutos, para empezar a publicar sin tener que llamar a nadie. |
| HU16 | Como negocio con una solicitud enviada, quiero que el panel me diga si mi cuenta está en revisión o fue rechazada (y por qué), para no pensar que la página falló. |
| HU18 | Como negocio con cuenta activa, quiero personalizar mi perfil con foto de portada y logotipo, y editar mi descripción, dirección, horario y redes, para reforzar la identidad de mi marca. |
| HU20 | Como negocio aliado, quiero registrar mis redes sociales (Instagram, Facebook, TikTok) y descargar un póster publicitario de alta resolución con código QR para mi mostrador físico, para que mis clientes en tienda conozcan mi perfil público en JAMA. |
| HU21 | Como negocio aliado, quiero consultar mis métricas de impacto comercial y ecológico (dinero recuperado, raciones, efectividad, CO₂ y agua evitados) filtrando por hoy, 7 días, este mes o histórico, y compartirlo por WhatsApp, para valorar el retorno de mi excedente. |

## Administrador

| ID | Historia de usuario |
|---|---|
| HU11 | Como administrador, quiero verificar a los negocios y su precio de carta con foto, para garantizar que los descuentos publicados sean reales. |
| HU12 | Como administrador, quiero gestionar el plan de cada negocio (Gratis o Pro), para aplicar los límites y beneficios correspondientes en futuras etapas. |
| HU13 | Como administrador, quiero revisar los reportes de los clientes y suspender a los negocios que incumplan las reglas, para mantener la confianza en la plataforma. |
| HU17 | Como administrador, quiero ver las solicitudes de registro pendientes y aprobarlas o rechazarlas con un motivo, y avisarle al negocio por WhatsApp, para que en la vitrina solo publiquen negocios reales. |
| HU22 | Como administrador / operador de JAMA, quiero listar en `/admin` los pedidos generados, validar las transferencias Yape de los clientes, marcarlos como pagados y avisar por WhatsApp a la tienda con la orden autorizada de recojo y liquidación, para garantizar el pago al comerciante y eliminar el riesgo de inasistencias (*no-shows*). |
| HU23 | Como administrador, quiero publicar ofertas de cierre activas en nombre de un comercio afiliado cuando el dueño envíe los datos y fotos de sus excedentes por WhatsApp, para que los locales puedan vender sin fricción tecnológica durante sus horas de mayor trabajo. |

---

> *Historial de evolución de requerimientos:*
> - **Octubre 2026:** HU14–HU17 detallan el alta de negocios por solicitud y aprobación ([ADR-010](../02-arquitectura-software/decisiones/ADR-010-alta-de-negocios-por-solicitud.md)).
> - **Noviembre 2026 (Etapa 17–19):** HU18–HU19 incorporan la personalización de perfil con portada y tienda individual `/t/:slug` ([ADR-012](../02-arquitectura-software/decisiones/ADR-012-perfiles-publicos-de-negocio-y-personalizacion.md)).
> - **Noviembre 2026 (Etapa 20–22):** HU20 y HU21 agregan redes sociales, kit físico de mostrador QR y métricas de impacto comercial y ecológico.
> - **Noviembre 2026 (Etapa 23):** HU04, HU22 y HU23 establecen el **Flujo Concierge de Cobro Centralizado con Yape y Publicación Asistida** ([ADR-013](../02-arquitectura-software/decisiones/ADR-013-flujo-concierge-cobro-yape-y-publicacion-asistida.md)).
