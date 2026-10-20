# Decisiones arquitectónicas (ADR)

Un **ADR** (*Architecture Decision Record*) documenta una decisión importante de arquitectura, su contexto, las alternativas evaluadas y sus consecuencias. Cada ADR responde a uno o más drivers de [`06-driver-arquitectonicos.md`](../../01-analisis-de-sistema/06-driver-arquitectonicos.md).

| ID | Decisión arquitectónica | Driver relacionado | Justificación | Resultado |
|---|---|---|---|---|
| [ADR-001](ADR-001-monolito-modular.md) | Monolito modular cliente-servidor | DA07, DA08, DA09 | Un solo desarrollador y una ciudad: un solo despliegue, con módulos independientes por dentro. | Módulos: Acceso, Negocios, Ofertas, Pedidos, Reportes y Moderación. |
| [ADR-002](ADR-002-clean-architecture.md) | Clean Architecture | DA09 | Separar las reglas del negocio de Express, PostgreSQL y WhatsApp. | Capas: Dominio, Aplicación, Infraestructura y Presentación. |
| [ADR-003](ADR-003-postgresql-transacciones.md) | PostgreSQL con transacción y bloqueo de fila para las reservas | DA02 | Garantizar que nunca se reserve más stock del que existe. | `SELECT … FOR UPDATE` dentro del caso de uso *PedirOferta*. |
| [ADR-004](ADR-004-codigo-de-canje.md) | Código de canje con máquina de estados | DA01 | Rastrear una venta que ocurre fuera del sistema. | Entidad `CodigoCanje` con estados y su historial. |
| [ADR-005](ADR-005-tareas-programadas.md) | Tarea programada de expiración | DA03 | Las ofertas y reservas vencen aunque nadie use la web. | Proceso cada minuto que ejecuta el caso de uso *ExpirarReservas*. |
| [ADR-006](ADR-006-autenticacion-roles.md) | Autenticación JWT, roles y filtrado por negocio | DA04 | Aislar los datos de cada negocio. | Middleware de autenticación y repositorios que filtran por `negocioId`. |
| [ADR-007](ADR-007-integraciones-puertos-adaptadores.md) | Integraciones mediante puertos y adaptadores | DA06, DA09 | Desacoplar los casos de uso de WhatsApp y del proveedor de imágenes. | Puertos `EnlaceMensajeria` y `AlmacenImagenes` con sus adaptadores. |
| [ADR-008](ADR-008-cache-e-imagenes.md) | Caché del listado e imágenes optimizadas | DA05 | Responder rápido en la hora de cierre con datos móviles. | Caché en memoria de 30 s e imágenes comprimidas desde un CDN. |
| [ADR-009](ADR-009-spa-separada-del-backend.md) | Aplicación web SPA (React + Vite) separada del backend | DA05, DA08 | El frontend y el backend se despliegan por separado; la interfaz es *mobile-first*. | Una SPA con vitrina pública, panel del negocio y panel de administración. |

**Estado de todas:** Aceptada · **Fecha:** octubre 2026
