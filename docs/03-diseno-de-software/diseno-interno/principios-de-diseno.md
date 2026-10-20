# Principios de diseño (SOLID)

## Objetivo
Documentar cómo se aplican los principios SOLID en el backend del Marketplace de Ofertas de Cierre, organizado con Clean Architecture, para que cada módulo se programe igual y las reglas del negocio no dependan de la tecnología.

## Contexto
- **Estilo:** monolito modular (Node.js + Express), según [ADR-001](../../02-arquitectura-software/decisiones/ADR-001-monolito-modular.md).
- **Enfoque interno:** Clean Architecture (presentación, aplicación, dominio e infraestructura), según [ADR-002](../../02-arquitectura-software/decisiones/ADR-002-clean-architecture.md).
- **Módulo de referencia:** Pedidos, porque integra la transacción sobre el stock, el módulo Ofertas, WhatsApp y la expiración.
- **Código:** [`tecnologia/ejemplo-clean-architecture/`](../../../tecnologia/ejemplo-clean-architecture/README.md).

## SOLID en el módulo Pedidos

| Principio | Capa | Cómo se cumple en este proyecto | Archivos |
|---|---|---|---|
| **S** · Responsabilidad única | Todas | Cada clase tiene un solo motivo para cambiar: el controlador traduce HTTP, `PedirOferta` coordina el pedido, `CodigoCanje` controla sus estados, el repositorio persiste y `WaMeEnlaceAdapter` arma la URL | `pedidos.controller.js`, `pedir-oferta.caso-uso.js`, `codigo-canje.js`, `wame-enlace.adapter.js` |
| **O** · Abierto/cerrado | Infraestructura | Para usar la API de WhatsApp Business se **agrega** un adaptador nuevo que implementa `EnlaceMensajeria`; `PedirOferta` no se modifica | `puertos.js`, `wame-enlace.adapter.js` |
| **L** · Sustitución de Liskov | Infraestructura | `UnidadDeTrabajoMemoria` y `UnidadDeTrabajoPg` cumplen el mismo contrato (todo se confirma o nada); `RelojSistema` y `RelojFijo` son intercambiables. Las pruebas usan unos y producción otros, sin cambiar el caso de uso | `unidad-de-trabajo-memoria.js`, `unidad-de-trabajo-pg.js`, `relojes.js` |
| **I** · Segregación de interfaces | Dominio | Pedidos declara cinco puertos pequeños en lugar de uno grande: `ReservaDeStock` solo reserva y libera, `ContactoNegocio` solo da el contacto, `EnlaceMensajeria` solo arma el enlace. Pedidos no ve las demás operaciones de Ofertas ni de Negocios | `pedidos/dominio/puertos.js` |
| **D** · Inversión de dependencias | Aplicación | Los casos de uso reciben interfaces por el constructor y no conocen PostgreSQL, wa.me ni el módulo Ofertas; las implementaciones se conectan en `pedidos.module.js`. **Se verifica con una prueba automática** | `pedir-oferta.caso-uso.js`, `pedidos.module.js`, `tests/arquitectura.test.js` |

## Qué pasaría sin SOLID en este proyecto

| Situación real | Sin SOLID | Con SOLID |
|---|---|---|
| Se pasa de `wa.me` a la API de WhatsApp Business | Hay que modificar el caso de uso del pedido | Se crea un adaptador nuevo y se cambia 1 línea en la composición |
| La reserva pasa de 30 a 20 minutos | Hay que buscar el número en controladores, SQL y la tarea programada | Se cambia `MINUTOS_RESERVA` en `CodigoCanje` |
| Se quiere probar la concurrencia (EQ-02) | Se necesita PostgreSQL levantado | Se prueba en memoria con `UnidadDeTrabajoMemoria` |
| Se quiere probar la expiración (EQ-06) | Hay que esperar 30 minutos reales | `RelojFijo.avanzarMinutos(30)` |
| Ofertas se separa como servicio en el futuro | Pedidos está lleno de llamadas directas a las clases de Ofertas | Solo cambia `ReservaDeStockConOfertas` |

## Relación con Clean Architecture y los patrones

| Principio | Lo materializa en el proyecto |
|---|---|
| Responsabilidad única | La separación en capas de Clean Architecture |
| Abierto/cerrado y Liskov | El patrón **Adapter** (WhatsApp, imágenes, módulos vecinos) |
| Segregación de interfaces | Los **puertos** pequeños del dominio |
| Inversión de dependencias | Los patrones **Repository** y **Composition Root**, y la regla de dependencia verificada por pruebas |
