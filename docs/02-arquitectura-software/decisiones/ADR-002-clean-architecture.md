# ADR-002: Clean Architecture dentro de cada módulo

- **Estado:** Aceptada
- **Drivers:** DA09 (mantenibilidad), DA06 (integraciones externas)

## Contexto
Las reglas más importantes del sistema son de negocio, no de tecnología: una oferta no puede publicarse vencida, el precio de oferta debe ser menor que el de carta, una reserva expira a los 30 minutos y el plan Gratis permite una oferta al día. Si estas reglas quedan dentro de los controladores de Express o en consultas SQL, cada cambio tecnológico las rompe y no se pueden probar sin levantar el servidor y la base de datos.

## Decisión
Aplicar **Clean Architecture** en cada módulo, con dependencias que apuntan solo **hacia el dominio**:

| Capa | Contenido en este proyecto |
|---|---|
| **Dominio** | Entidades (`Oferta`, `Negocio`, `CodigoCanje`, `Ciudad`), reglas del negocio y contratos (puertos) como `OfertaRepository`. |
| **Aplicación** | Casos de uso: `PublicarOferta`, `PedirOferta`, `ResolverPedido`, `ExpirarReservas`, `GenerarReporteMensual`. |
| **Infraestructura** | Adaptadores: repositorios PostgreSQL, enlace `wa.me`, almacenamiento de imágenes, JWT y tareas programadas. |
| **Presentación** | Rutas y controladores de Express, DTOs y validación de entrada; la aplicación web del cliente. |

**Regla de dependencia:** el dominio no importa nada de Express, `pg`, librerías de JWT ni servicios externos. La infraestructura implementa las interfaces que define el dominio.

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| MVC clásico (routes → controllers → models) | El modelo queda atado a la base de datos y las reglas terminan dispersas en los controladores. |
| Tres capas sin inversión de dependencias | Las reglas del negocio dependen directamente del acceso a datos y no se pueden probar de forma aislada. |
| Hexagonal (puertos y adaptadores) pura | Es equivalente en espíritu; se elige Clean Architecture porque es el enfoque del curso y sus capas tienen nombres más explícitos. |

## Consecuencias
- ✅ Las reglas del dominio se prueban con pruebas unitarias, sin base de datos.
- ✅ Cambiar el proveedor de imágenes o pasar a la API de WhatsApp Business solo exige escribir un adaptador nuevo.
- ⚠️ Hay más archivos e interfaces que en un MVC simple; se mitiga con una estructura de carpetas estándar por módulo.
