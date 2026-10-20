# 06 · Drivers arquitectónicos

Un driver arquitectónico es un requisito, atributo de calidad o restricción que **cambia la forma en que diseñamos la arquitectura**.

## Evaluación de candidatos

| Fuente | Elemento | ¿Requiere una decisión importante de arquitectura? | ¿Es driver? |
|---|---|---|---|
| Requisito funcional | RF04, RF11: código de canje | Sí. La venta ocurre fuera del sistema (en WhatsApp) y el código es la única forma de saber si hubo venta. | **Sí** |
| Requisito funcional | RF05: reserva de stock | Sí. Obliga a usar transacciones y bloqueos en la base de datos. | **Sí** |
| Requisito funcional | RF10: expiración automática | Sí. Exige un proceso en segundo plano, independiente de las peticiones de los usuarios. | **Sí** |
| Atributo de calidad | AC02: consistencia (sin sobreventa) | Sí. Condiciona la base de datos y el manejo de la concurrencia. | **Sí** |
| Atributo de calidad | AC01: rendimiento en celular | Sí. Condiciona el tamaño de las páginas, el manejo de imágenes y las consultas por ubicación. | **Sí** |
| Atributo de calidad | AC04: seguridad por negocio | Sí. Condiciona la autenticación, los roles y el filtrado de datos. | **Sí** |
| Atributo de calidad | AC08: varias ciudades | Sí. Condiciona el modelo de datos desde el inicio. | **Sí** |
| Restricción | RC06, RC07: pago y pedido fuera del sistema | Sí. Elimina la pasarela de pago y define la integración con WhatsApp. | **Sí** |
| Restricción | RC03, RC04, RC05: API REST, Node.js y PostgreSQL | Sí. Limitan las tecnologías y la forma de comunicación. | **Sí** |
| Atributo de calidad | AC09: mantenibilidad | Sí. Condiciona cómo se organizan los módulos y hacia dónde apuntan las dependencias. | **Sí** |
| Requisito funcional | RF02: filtrar por categoría | No. Es una consulta simple que no cambia la estructura. | No |
| Atributo de calidad | AC05: usabilidad | Parcialmente. Influye en la interfaz (UI/UX), no en la estructura del sistema. | No |
| *(GoPet)* | Carrito, pasarela de pago, servicio de envío | No aplican a este caso. | No |

## Drivers arquitectónicos

| ID | Driver arquitectónico | Origen | ¿Por qué influye en la arquitectura? |
|---|---|---|---|
| DA01 | **Trazabilidad de una venta que ocurre fuera de la plataforma** mediante un código de canje único por pedido. | RF04, RF11, AC07, RC07 | Hace de *Pedidos y códigos* el módulo central. Cada código debe tener un ciclo de vida con estados registrados (reservado → vendido / no concretado / expirado), que alimenta los reportes. |
| DA02 | **Control de stock sin sobreventa** cuando varios clientes piden la misma oferta al mismo tiempo. | RF05, AC02, RC05 | La reserva de stock y la creación del código se hacen en una sola transacción de base de datos con bloqueo de fila. Por eso se usa una base de datos relacional. |
| DA03 | **Ofertas que vencen en horas** y reservas que expiran solas. | RF05, RF10, AC06 | Se necesita un componente programado (*scheduler*) en la capa de negocio que finalice ofertas y libere reservas vencidas, sin depender de que alguien abra la web. |
| DA04 | **Aislamiento entre negocios y control de acceso por rol** (cliente anónimo, negocio, administrador). | RF17, AC04 | Cada consulta del panel del negocio se filtra por su identificador. El módulo de *Usuarios y acceso* protege la API con tokens y roles. |
| DA05 | **Rendimiento en celular en la hora de cierre.** | AC01, RF01 | Las imágenes se sirven comprimidas desde un servicio externo, el listado se pagina y la búsqueda por cercanía usa índices por ciudad y zona. |
| DA06 | **Pago y pedido fuera del sistema** (Yape y WhatsApp por enlace). | RC06, RC07 | No hay pasarela de pago ni servicio de envío. La integración con WhatsApp es solo un enlace generado en el backend, lo que reduce el costo y la complejidad. |
| DA07 | **Replicable en varias ciudades.** | AC08, RC12 | La entidad *Ciudad* existe en el modelo desde el MVP; negocios y ofertas pertenecen a una ciudad. |
| DA08 | **API REST sobre Node.js/Express con PostgreSQL.** | RC03, RC04, RC05 | Define una arquitectura cliente-servidor en tres capas con un backend en forma de monolito modular. |
| DA09 | **Mantenibilidad y evolución modular:** el sistema debe permitir modificar o agregar funcionalidades sin afectar innecesariamente a otros módulos. | AC09 – Mantenibilidad | Influye en la separación de responsabilidades, la modularidad y las dependencias internas. El roadmap ya prevé cambios (alertas, cobro por pedido, pago integrado, nuevas ciudades), por lo que las reglas del negocio no deben depender de Express, de PostgreSQL ni de WhatsApp. |

> *Agregado en la Guía 03:* DA09 se incorpora para justificar el enfoque Clean Architecture.

## Drivers priorizados y decisión que responde

| Prioridad | Driver | Problema que plantea | Decisión que responde |
|---|---|---|---|
| 1 | DA02 – Sin sobreventa | Varios clientes piden la última unidad al mismo tiempo. | Transacción con bloqueo de fila en PostgreSQL ([ADR-003](../02-arquitectura-software/decisiones/ADR-003-postgresql-transacciones.md)) |
| 2 | DA01 – Trazabilidad | La venta ocurre en WhatsApp, fuera del sistema. | Código de canje con máquina de estados en el dominio ([ADR-004](../02-arquitectura-software/decisiones/ADR-004-codigo-de-canje.md)) |
| 3 | DA03 – Ofertas temporales | Las ofertas y reservas vencen aunque nadie use la web. | Tarea programada que ejecuta el caso de uso de expiración ([ADR-005](../02-arquitectura-software/decisiones/ADR-005-tareas-programadas.md)) |
| 4 | DA09 – Mantenibilidad | El sistema va a cambiar según los resultados del piloto. | Monolito modular + Clean Architecture ([ADR-001](../02-arquitectura-software/decisiones/ADR-001-monolito-modular.md), [ADR-002](../02-arquitectura-software/decisiones/ADR-002-clean-architecture.md)) |
| 5 | DA04 – Seguridad por negocio | Hay datos de varios negocios en el mismo sistema. | Autenticación JWT, roles y filtrado por negocio ([ADR-006](../02-arquitectura-software/decisiones/ADR-006-autenticacion-roles.md)) |
| 6 | DA06 – Integraciones externas | WhatsApp por enlace y pago fuera del sistema. | Puertos y adaptadores para WhatsApp e imágenes ([ADR-007](../02-arquitectura-software/decisiones/ADR-007-integraciones-puertos-adaptadores.md)) |
| 7 | DA05 – Rendimiento móvil | Carga alta en la hora de cierre y conexión con datos móviles. | Caché del listado e imágenes optimizadas ([ADR-008](../02-arquitectura-software/decisiones/ADR-008-cache-e-imagenes.md)) |
| 8 | DA07 – Varias ciudades | Replicar en Cusco y otras ciudades. | Entidad *Ciudad* en el dominio desde el MVP (ADR-001) |
| 9 | DA08 – REST + Node + PostgreSQL | Restricción del curso. | Cliente-servidor con API REST (ADR-001) |
