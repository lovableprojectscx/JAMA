# 07 · Decisiones arquitectónicas

Resumen de las decisiones tomadas para responder a los drivers de [`06-driver-arquitectonicos.md`](06-driver-arquitectonicos.md). El detalle de cada decisión (contexto, alternativas y consecuencias) está en su **ADR** dentro de [`02-arquitectura-software/decisiones/`](../02-arquitectura-software/decisiones/README.md).

| ID | Decisión arquitectónica | Driver relacionado | Justificación | Resultado |
|---|---|---|---|---|
| [ADR-001](../02-arquitectura-software/decisiones/ADR-001-monolito-modular.md) | Monolito modular cliente-servidor | DA07, DA08, DA09 | Un solo desarrollador y una ciudad: un solo despliegue, con módulos independientes por dentro. | Módulos: Acceso, Negocios, Ofertas, Pedidos, Reportes y Moderación. |
| [ADR-002](../02-arquitectura-software/decisiones/ADR-002-clean-architecture.md) | Clean Architecture | DA09 | Separar las reglas del negocio de Express, PostgreSQL y WhatsApp. | Capas: Dominio, Aplicación, Infraestructura y Presentación. |
| [ADR-003](../02-arquitectura-software/decisiones/ADR-003-postgresql-transacciones.md) | PostgreSQL con transacción y bloqueo de fila | DA02 | Garantizar que nunca se reserve más stock del que existe. | `SELECT … FOR UPDATE` en el caso de uso *PedirOferta*. |
| [ADR-004](../02-arquitectura-software/decisiones/ADR-004-codigo-de-canje.md) | Código de canje con máquina de estados | DA01 | Rastrear una venta que ocurre fuera del sistema. | Entidad `CodigoCanje` con estados e historial. |
| [ADR-005](../02-arquitectura-software/decisiones/ADR-005-tareas-programadas.md) | Tarea programada de expiración | DA03 | Las ofertas y reservas vencen aunque nadie use la web. | Proceso cada minuto que ejecuta *ExpirarReservas*. |
| [ADR-006](../02-arquitectura-software/decisiones/ADR-006-autenticacion-roles.md) | Autenticación JWT, roles y filtrado por negocio | DA04 | Aislar los datos de cada negocio. | Middleware de autenticación; repositorios filtran por `negocioId`. |
| [ADR-007](../02-arquitectura-software/decisiones/ADR-007-integraciones-puertos-adaptadores.md) | Integraciones mediante puertos y adaptadores | DA06, DA09 | Desacoplar los casos de uso de WhatsApp y del proveedor de imágenes. | Puertos `EnlaceMensajeria` y `AlmacenImagenes` con sus adaptadores. |
| [ADR-008](../02-arquitectura-software/decisiones/ADR-008-cache-e-imagenes.md) | Caché del listado e imágenes optimizadas | DA05 | Responder rápido en la hora de cierre con datos móviles. | Caché en memoria de 30 s e imágenes WebP desde un CDN. |
| [ADR-009](../02-arquitectura-software/decisiones/ADR-009-spa-separada-del-backend.md) | SPA (React + Vite) separada del backend | DA05, DA08 | El frontend y el backend se despliegan por separado; la interfaz es *mobile-first*. | Vitrina pública, panel del negocio y panel de administración. |
