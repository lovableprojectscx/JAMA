# 08 · Escenarios de atributos de calidad

Cada atributo de [`04-atributos-de-calidad.md`](04-atributos-de-calidad.md) se convierte aquí en un **escenario medible**: quién origina la exigencia, qué ocurre, sobre qué parte del sistema, en qué condiciones, qué debe hacer el sistema y con qué valor se comprueba.

**Contexto de carga usado en todos los escenarios:** piloto en Huamanga con 8 a 10 negocios y alrededor de 300 seguidores (ver [`00-necesidad-del-negocio.md`](00-necesidad-del-negocio.md)). La hora pico es de **17:00 a 21:00**. Para tener margen, las pruebas se diseñan con **100 usuarios simultáneos**, aproximadamente 3 veces el pico esperado del piloto.

> Las medidas son **propuestas por validar**: se confirmarán con los datos reales del piloto.

---

## EQ-01. Rendimiento: listado de ofertas en la hora de cierre

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Rendimiento (AC01) |
| **Fuente del estímulo** | Clientes que entran desde un link de WhatsApp en su celular |
| **Estímulo** | Consultan el listado de ofertas vigentes y el detalle de una oferta |
| **Artefacto** | Módulo **Ofertas** (`ListarOfertasCercanas`), su caché y PostgreSQL |
| **Entorno** | Hora de cierre, 100 usuarios simultáneos, red 4G simulada |
| **Respuesta** | El sistema devuelve las ofertas vigentes paginadas, sin rechazar peticiones |
| **Medida** | p95 de la API ≤ 500 ms; la página carga en ≤ 2 s en 4G; peso inicial < 1 MB; < 1 % de errores 5xx |
| **Verificación** | Prueba de carga con k6 o Artillery sobre `GET /api/v1/ofertas`, y Lighthouse con perfil móvil 4G |
| **Táctica asociada** | Caché de 30 s, paginación, índices e imágenes WebP desde un CDN ([ADR-008](../02-arquitectura-software/decisiones/ADR-008-cache-e-imagenes.md)) |
| **Estado** | Pendiente de definir el entorno de prueba |

## EQ-02. Consistencia: pedidos simultáneos de la última unidad

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Consistencia de datos (AC02) |
| **Fuente del estímulo** | Varios clientes al mismo tiempo |
| **Estímulo** | 50 peticiones simultáneas `POST /pedidos` sobre una oferta con 3 unidades |
| **Artefacto** | Módulo **Pedidos** (`PedirOferta`) y módulo **Ofertas** (reserva de stock) |
| **Entorno** | Operación normal en la hora pico |
| **Respuesta** | Se reservan exactamente 3 unidades; las demás peticiones reciben `409 Oferta agotada` |
| **Medida** | **0 sobreventas**: códigos `RESERVADO` ≤ stock inicial; el stock nunca es negativo |
| **Verificación** | Prueba de integración concurrente contra PostgreSQL real; contar los códigos creados y revisar el stock final |
| **Táctica asociada** | Transacción con `SELECT … FOR UPDATE` y `CHECK (stock >= 0)` ([ADR-003](../02-arquitectura-software/decisiones/ADR-003-postgresql-transacciones.md)) |
| **Estado** | Medida definida; falta implementar la prueba |

## EQ-03. Disponibilidad: franja de cierre

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Disponibilidad (AC03) |
| **Fuente del estímulo** | Clientes y negocios |
| **Estímulo** | Intentan consultar, publicar o pedir; o se cae una instancia del backend |
| **Artefacto** | Contenedor **API Marketplace** y PostgreSQL |
| **Entorno** | De 17:00 a 21:00, producción con monitoreo |
| **Respuesta** | El sistema atiende las operaciones; si una dependencia falla, responde con un error controlado (`503`) y se recupera solo al reiniciarse |
| **Medida** | ≥ 99 % de disponibilidad mensual en la franja de 17:00 a 21:00; recuperación en ≤ 5 min |
| **Verificación** | Monitor externo (por ejemplo, UptimeRobot) contra `GET /health` cada minuto; revisar el reporte mensual |
| **Táctica asociada** | Endpoint de salud, reinicio automático del proceso y despliegues fuera de la franja de cierre |
| **Estado** | Pendiente de elegir el hosting |

## EQ-04. Seguridad: un negocio intenta operar sobre datos de otro

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Seguridad (AC04) |
| **Fuente del estímulo** | Un negocio autenticado; un usuario sin sesión; un script automatizado |
| **Estímulo** | Intenta editar una oferta o confirmar un código de otro negocio, o crear pedidos masivos |
| **Artefacto** | Middleware de autenticación, casos de uso de **Ofertas** y **Pedidos**, repositorios |
| **Entorno** | Producción |
| **Respuesta** | Rechaza la operación sin modificar datos ni revelar información del otro negocio |
| **Medida** | 100 % de intentos no autorizados rechazados (`401`/`403`/`404`); máximo 10 pedidos por minuto por IP (`429`). El límite no es más bajo porque muchos estudiantes comparten la IP del wifi de la UNSCH |
| **Verificación** | Pruebas automáticas con tokens de dos negocios distintos y sin token; prueba de *rate limiting* |
| **Táctica asociada** | JWT con roles, `negocioId` tomado del token y nunca del cuerpo de la petición, *rate limiting* ([ADR-006](../02-arquitectura-software/decisiones/ADR-006-autenticacion-roles.md)) |
| **Estado** | Pendiente de implementar las pruebas |

## EQ-05. Usabilidad: primera compra desde WhatsApp

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Usabilidad (AC05) |
| **Fuente del estímulo** | Un cliente nuevo que nunca usó la plataforma |
| **Estímulo** | Abre un link compartido en WhatsApp y quiere pedir una oferta |
| **Artefacto** | Aplicación web (vitrina pública) |
| **Entorno** | Celular de gama media, sin registro previo |
| **Respuesta** | Llega al chat de WhatsApp del negocio con el mensaje y el código ya escritos |
| **Medida** | ≤ 3 toques y ≤ 30 s desde que abre el link; 0 formularios de registro. El negocio publica una oferta en ≤ 60 s |
| **Verificación** | Prueba con 5 usuarios reales (estudiantes UNSCH) y 3 negocios, cronometrando cada tarea |
| **Estado** | Se validará en el piloto |

## EQ-06. Confiabilidad de la información: ofertas vencidas

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Confiabilidad de la información (AC06) |
| **Fuente del estímulo** | El reloj del sistema |
| **Estímulo** | Llega la hora límite de una oferta, o una reserva cumple 30 min sin confirmarse |
| **Artefacto** | Tarea programada → caso de uso `ExpirarReservas` |
| **Entorno** | Operación normal, aunque nadie esté usando la web |
| **Respuesta** | La oferta deja de mostrarse y la reserva vencida devuelve su unidad al stock |
| **Medida** | Ninguna oferta vencida visible más de 60 s; 100 % de las ofertas muestran la fecha de vencimiento |
| **Verificación** | Prueba unitaria con `RelojFijo` y prueba de integración que avanza el tiempo y consulta el listado |
| **Táctica asociada** | Tarea programada cada minuto más el filtro `hora_limite > ahora` en el listado ([ADR-005](../02-arquitectura-software/decisiones/ADR-005-tareas-programadas.md)) |
| **Estado** | Medida definida |

## EQ-07. Trazabilidad: reporte mensual del negocio

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Trazabilidad (AC07) |
| **Fuente del estímulo** | Un negocio |
| **Estímulo** | Consulta su reporte del mes |
| **Artefacto** | Módulo **Reportes** y el historial de `CodigoCanje` |
| **Entorno** | Fin de mes |
| **Respuesta** | Muestra los pedidos recibidos, las ventas concretadas, la conversión y los clientes nuevos |
| **Medida** | 100 % de los códigos con estado final y fecha de cada cambio; los totales del reporte coinciden con un conteo directo en la base de datos |
| **Verificación** | Consulta SQL de control frente al reporte generado |
| **Táctica asociada** | Máquina de estados con historial ([ADR-004](../02-arquitectura-software/decisiones/ADR-004-codigo-de-canje.md)) |
| **Estado** | Medida definida |

## EQ-08. Escalabilidad: nueva ciudad

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Escalabilidad (AC08) |
| **Fuente del estímulo** | El administrador |
| **Estímulo** | Habilita Cusco como nueva ciudad |
| **Artefacto** | Entidad `Ciudad`, módulos **Negocios** y **Ofertas** |
| **Entorno** | Sistema en producción |
| **Respuesta** | La ciudad se crea como un dato; sus negocios y ofertas quedan separados de los de Huamanga |
| **Medida** | 0 líneas de código modificadas y 0 despliegues para abrir una ciudad; listado de 2 ciudades con 100 usuarios: p95 ≤ 500 ms |
| **Verificación** | Crear la ciudad desde el panel de administración y repetir la prueba de EQ-01 con datos de dos ciudades |
| **Estado** | Medida definida |

## EQ-09. Mantenibilidad: cambiar de proveedor de mensajería

| Elemento | Descripción |
|---|---|
| **Atributo de calidad** | Mantenibilidad (AC09) |
| **Fuente del estímulo** | Equipo de desarrollo |
| **Estímulo** | Se reemplaza el enlace `wa.me` por la API de WhatsApp Business, o cambia la regla de expiración de 30 a 20 min |
| **Artefacto** | Puerto `EnlaceMensajeria` y su adaptador; entidad `CodigoCanje` |
| **Entorno** | Desarrollo, con pruebas automatizadas |
| **Respuesta** | El cambio se concentra en un adaptador nuevo (o en la entidad, para la regla) sin tocar los casos de uso ni otros módulos |
| **Medida** | Archivos modificados: 1 adaptador nuevo + 1 línea en la raíz de composición; 0 cambios en `dominio/` y `aplicacion/`; las pruebas existentes pasan |
| **Verificación** | Revisar el *diff* del cambio; revisar que ningún archivo de `dominio/` importe `express`, `pg` ni adaptadores |
| **Táctica asociada** | Clean Architecture con puertos y adaptadores ([ADR-002](../02-arquitectura-software/decisiones/ADR-002-clean-architecture.md), [ADR-007](../02-arquitectura-software/decisiones/ADR-007-integraciones-puertos-adaptadores.md)) |
| **Estado** | Demostrable con el ejemplo de [`tecnologia/`](../../tecnologia/ejemplo-clean-architecture/README.md) |

---

## Resumen de escenarios

| Código | Atributo | Qué se busca comprobar | Medida clave |
|---|---|---|---|
| EQ-01 | Rendimiento | Que el listado responda rápido en el celular en la hora de cierre | p95 ≤ 500 ms; carga ≤ 2 s |
| EQ-02 | Consistencia | Que nunca se venda más de lo que hay | 0 sobreventas |
| EQ-03 | Disponibilidad | Que el sistema esté arriba en la franja de cierre | ≥ 99 % de 17:00 a 21:00 |
| EQ-04 | Seguridad | Que un negocio no pueda tocar datos de otro | 100 % de intentos rechazados |
| EQ-05 | Usabilidad | Que comprar sea inmediato y sin registro | ≤ 3 toques |
| EQ-06 | Confiabilidad | Que no se muestren ofertas vencidas | ≤ 60 s visibles |
| EQ-07 | Trazabilidad | Que el reporte refleje la realidad | 100 % de códigos con estado |
| EQ-08 | Escalabilidad | Que abrir una ciudad no requiera programar | 0 cambios de código |
| EQ-09 | Mantenibilidad | Que cambiar de proveedor no afecte al negocio | 0 cambios en dominio y aplicación |
