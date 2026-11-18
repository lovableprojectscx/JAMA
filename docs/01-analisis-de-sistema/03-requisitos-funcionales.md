# 03 · Requisitos funcionales

Los requisitos funcionales expresan **lo que el sistema debe hacer** para satisfacer las historias de usuario y responder a la realidad operativa de los comercios de alimentos en Huamanga.

> **Convención de estado:**
> - ✅ **Implementado:** Funcionalidad operativa en código (`api/` + `web/`) y verificada en pruebas.
> - ⏳ **Planificado (Post-piloto):** Requisito contemplado en la arquitectura y visión del producto para iteraciones posteriores al piloto inicial.

---

## A · Vitrina Pública y Exploración del Cliente (`/`, `/t/:slug`)

| ID | Requisito funcional | Estado |
|---|---|---|
| RF01 | El sistema debe listar las ofertas de cierre **vigentes** (no vencidas, con stock > 0 y dentro de su hora límite), con soporte de búsqueda textual y ordenamiento por relevancia o cercanía en la Zona Centro de Huamanga. | ✅ Implementado |
| RF02 | El sistema debe permitir filtrar las ofertas por categorías base y categorías dinámicas (incluyendo subrubro `Otro`), contabilizando las raciones activas en tiempo real mediante píldoras interactivas. | ✅ Implementado |
| RF03 | El sistema debe mostrar el detalle completo de cada oferta: foto optimizada, precio de carta tachado, precio vigente, tramos horarios dinámicos de descuento (*"Baja a S/ X a las HH:MM"*, RN-11), % de descuento, stock disponible, fecha/hora de elaboración, hora límite de recojo, dirección física y enlace a Google Maps. | ✅ Implementado |
| RF24 | El sistema debe ofrecer una página pública individual para cada negocio aliado (`/t/:slug`), con foto de portada panorámica, logotipo, insignia de verificado, dirección en Google Maps, horario de recojo, enlaces a redes sociales y vitrina exclusiva de sus ofertas vigentes. | ✅ Implementado |

---

## B · Pedidos, Reserva de Stock y Flujo Concierge Yape

| ID | Requisito funcional | Estado |
|---|---|---|
| RF04 | El sistema debe generar un **código de canje único** de 4 caracteres sin ambigüedades (sin `0/O/1/I/L`, p. ej. `CAGX`) congelando el precio vigente del instante, y desplegar el **Modal Concierge en 3 pasos** con monto exacto, número Yape/Plin oficial de JAMA, titular y botón de copiado rápido. | ✅ Implementado |
| RF05 | El sistema debe **reservar** una unidad de la oferta de forma atómica (`SELECT ... FOR UPDATE`, 0 sobreventas) al generar el código y **liberarla** automáticamente si no se confirma el pago o la entrega dentro de 30 minutos. | ✅ Implementado |
| RF06 | El sistema debe generar enlaces `wa.me` estructurados: uno hacia **Operaciones JAMA** para que el cliente adjunte su constancia de Yape con código/monto/tienda, y otro hacia la **tienda** para coordinación o notificación de orden autorizada. | ✅ Implementado |
| RF11 | El sistema debe permitir buscar un código y marcarlo como **vendido** (`VENDIDO`) o **no concretado** (`NO_CONCRETADO` con devolución de stock), registrando historial de estado, fecha y actor (`NEGOCIO` desde `/panel` o `ADMIN` desde `/admin`). | ✅ Implementado |

---

## C · Gestión del Comercio y Panel del Negocio (`/panel`)

| ID | Requisito funcional | Estado |
|---|---|---|
| RF07 | El sistema debe permitir administrar el perfil del negocio: foto de portada (máx. 5 MB), logotipo (máx. 2 MB), descripción, dirección, horario, Yape, redes sociales (`Instagram`, `Facebook`, `TikTok`) y generación/descarga del **Kit Físico de Mostrador QR** en alta resolución apuntando a `/t/:slug`. | ✅ Implementado |
| RF08 | El sistema debe permitir publicar ofertas con subida directa de imagen validada (`JPG/PNG/WEBP`, máx. 5 MB en Supabase Storage, RN-12), precio de carta y oferta (`RN-01`), stock, hora de elaboración, hora límite y tramos de descuento creciente por hora (`RN-11`). | ✅ Implementado |
| RF09 | El sistema debe permitir al negocio **editar en vivo**, pausar, reactivar y **republicar en 1 toque** ofertas anteriores desde el panel móvil. | ✅ Implementado |
| RF10 | El sistema debe **finalizar automáticamente** la visibilidad de las ofertas cuando se agote su stock (`AGOTADA`) o se cumpla su hora límite de recojo. | ✅ Implementado |
| RF12 | El sistema debe calcular y mostrar reportes y métricas de impacto comercial y ambiental por negocio en períodos (`hoy`, `semana`, `mes`, `historico`): dinero recuperado (`S/`), ahorro al cliente, efectividad de canje, raciones rescatadas, kg de merma evitada, CO₂e evitado, agua preservada, Top 5 de ofertas y botón de reporte resumido por WhatsApp. | ✅ Implementado |

---

## D · Captación B2B, Alta por Solicitud y Administración (`/negocios`, `/terminos`, `/admin`)

| ID | Requisito funcional | Estado |
|---|---|---|
| RF18 | El sistema debe ofrecer una landing pública para comercios (`/negocios`) explicando el modelo de rescate, así como una vista formal de Términos y Condiciones (`/terminos`) con acceso al formulario de registro y al panel. | ✅ Implementado |
| RF19 | El sistema debe permitir que un negocio envíe una **solicitud de registro** (`/negocios/registro`) seleccionando su rubro (o subrubro `OTRO` detallado) y aceptando la declaración jurada de productos aptos (`RC08`), quedando en estado `PENDIENTE`. | ✅ Implementado |
| RF20 | El sistema debe impedir que un negocio no `ACTIVO` (`PENDIENTE`, `RECHAZADO` o `SUSPENDIDO`) inicie sesión, publique ofertas o aparezca en vitrina, informándole claramente su estado y motivo en pantalla. | ✅ Implementado |
| RF21 | El sistema debe permitir al administrador en `/admin` listar solicitudes por estado y **aprobarlas** o **rechazarlas** con motivo obligatorio, registrando quién y cuándo realizó la revisión. | ✅ Implementado |
| RF22 | El sistema debe ofrecer al administrador un enlace `wa.me` prellenado para notificar al negocio la aprobación o el motivo de rechazo de su solicitud. | ✅ Implementado |
| RF15 | El sistema debe permitir al administrador listar los comercios afiliados, verificar sus datos y activar o suspender cuentas operativas. | ✅ Implementado |
| RF25 | El sistema debe permitir al administrador en `/admin` listar los pedidos del flujo Concierge (filtrables por estado), validar comprobantes Yape de clientes (`esAdmin: true` → `VENDIDO`), cancelar reservas no pagadas y notificar a la tienda por WhatsApp con la orden autorizada de recojo y liquidación. | ✅ Implementado |
| RF26 | El sistema debe permitir al administrador en `/admin` realizar la **publicación asistida** de ofertas (incluyendo subida de foto) en nombre de comercios afiliados activos cuando envíen sus excedentes por WhatsApp. | ✅ Implementado |

---

## E · Seguridad, Control de Acceso y Alcance Post-Piloto

| ID | Requisito funcional | Estado |
|---|---|---|
| RF17 | El sistema debe autenticar a negocios y administradores mediante JWT con claims de rol diferenciados (`ADMIN` / `NEGOCIO`), aislando los datos por `negocioId` del token. | ✅ Implementado |
| RF23 | El sistema debe aplicar límite de peticiones por IP detrás de proxy (`trust proxy`: máx. 30 pedidos/min y 5 solicitudes/hora por IP) y rechazar correos o números de WhatsApp duplicados (`RN-16`). | ✅ Implementado |
| RF13 | El sistema debe contemplar la estructura de planes comerciales (**Gratis**: 1 oferta/día y **Pro**: ilimitadas, destacado y métricas completas) para la fase de monetización posterior al piloto. | ⏳ Planificado post-piloto |
| RF14 | El sistema debe permitir al cliente reportar una oferta indicando el motivo (descuento falso, mal estado u otro). | ⏳ Planificado post-piloto |
| RF16 | El sistema debe permitir al administrador revisar y resolver los reportes de los clientes en `/admin`. | ⏳ Planificado post-piloto |

---

## Relación entre Historias de Usuario y Requisitos Funcionales

| Historia de usuario | Requisitos funcionales relacionados | Estado |
|---|---|---|
| HU01 Ver ofertas cercanas | RF01 | ✅ |
| HU02 Filtrar ofertas | RF02 | ✅ |
| HU03 Ver detalle de la oferta | RF03 | ✅ |
| HU04 Pedir y pagar con Yape Concierge | RF04, RF05, RF06 | ✅ |
| HU05 Reportar oferta | RF14 | ⏳ Post-piloto |
| HU06 Registrar negocio | RF07, RF17 | ✅ |
| HU07 Publicar oferta | RF08 | ✅ |
| HU08 Gestionar ofertas | RF09, RF10 | ✅ |
| HU09 Validar código | RF11, RF05 | ✅ |
| HU10 Reporte mensual / impacto | RF12 | ✅ |
| HU11 Verificar negocios | RF15 | ✅ |
| HU12 Gestionar planes | RF13 | ⏳ Post-piloto |
| HU13 Atender reportes y suspender | RF15, RF16 | ⏳ Post-piloto (suspensión ✅) |
| HU14 Conocer JAMA como negocio | RF18 | ✅ |
| HU15 Enviar solicitud de registro | RF19, RF23 | ✅ |
| HU16 Saber el estado de mi solicitud | RF20 | ✅ |
| HU17 Aprobar o rechazar solicitudes | RF15, RF17, RF21, RF22 | ✅ |
| HU18 Personalizar perfil y portada | RF07, RF24 | ✅ |
| HU19 Ver perfil público de tienda | RF24 | ✅ |
| HU20 Redes sociales y Kit Mostrador QR | RF07, RF24 | ✅ |
| HU21 Métricas de impacto comercial y ambiental | RF12 | ✅ |
| HU22 Validación Concierge de pagos Yape y aviso a tienda | RF04, RF06, RF11, RF25 | ✅ |
| HU23 Publicación asistida de ofertas desde Admin | RF08, RF26 | ✅ |

> *Trazabilidad histórica:*
> - **Octubre 2026 (Etapas 1–14):** RF01–RF23 (Vitrina, panel de comercio, alta por solicitud y admin; [ADR-010](../02-arquitectura-software/decisiones/ADR-010-alta-de-negocios-por-solicitud.md), [ADR-011](../02-arquitectura-software/decisiones/ADR-011-cuentas-de-administrador.md)).
> - **Noviembre 2026 (Etapas 17–22):** RF24, ampliación de RF02/RF07/RF09/RF12 para perfiles `/t/:slug`, categorías dinámicas, kit QR y métricas de impacto ([ADR-012](../02-arquitectura-software/decisiones/ADR-012-perfiles-publicos-de-negocio-y-personalizacion.md)).
> - **Noviembre 2026 (Etapa 23):** Ampliación de RF04/RF06/RF11 y alta de RF25–RF26 para el **Flujo Concierge de Cobro Centralizado con Yape y Publicación Asistida** ([ADR-013](../02-arquitectura-software/decisiones/ADR-013-flujo-concierge-cobro-yape-y-publicacion-asistida.md)).

## Fuera del alcance del MVP actual
- Alertas automáticas por *push notifications* o geocercas activas.
- Pasarela bancaria automatizada con cobro por tarjeta vía API (Niubiz/Culqi); reemplazada estratégicamente por el flujo Concierge Yape en piloto (`RC06`, `ADR-013`).
- Entrega por delivery propio (el MVP opera mediante recojo presencial en mostrador).
