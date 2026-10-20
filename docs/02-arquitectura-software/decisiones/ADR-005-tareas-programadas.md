# ADR-005: Tarea programada de expiración

- **Estado:** Aceptada
- **Drivers:** DA03 (ofertas temporales), AC06 (confianza)

## Contexto
Una oferta deja de ser válida cuando pasa su hora límite o se agota su stock, y una reserva no confirmada debe liberar su unidad a los 30 minutos. Esto tiene que ocurrir aunque nadie esté usando la web en ese momento.

## Decisión
- Crear el caso de uso **`ExpirarReservas`** en la capa de aplicación.
- Una **tarea programada** dentro del mismo backend (por ejemplo, con `node-cron`) lo ejecuta **cada minuto**. Es un adaptador de infraestructura: solo dispara el caso de uso.
- En la misma ejecución, el módulo Ofertas cambia a FINALIZADA las ofertas que ya pasaron su hora límite (caso de uso `FinalizarOfertasVencidas`).
- Además, el listado público filtra por `hora_limite > ahora`, de modo que una oferta vencida no se muestra aunque la tarea programada se retrase.
- La hora se obtiene a través del puerto `Reloj`, para poder probar los vencimientos sin esperar.

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Expirar solo cuando alguien consulta | Las reservas vencidas no liberarían el stock hasta la siguiente visita. |
| Colas de mensajes con mensajes diferidos | Requieren infraestructura adicional (Redis o RabbitMQ); son innecesarias para una ciudad. |
| Cron del sistema operativo o del hosting | Depende del proveedor y no funciona igual en local ni en Docker. |

## Consecuencias
- ✅ El listado siempre muestra ofertas vigentes (medida de AC06: menos de 1 minuto).
- ⚠️ Con varias instancias del backend, la tarea se ejecutaría varias veces. Se resuelve con un bloqueo de PostgreSQL (`pg_try_advisory_lock`) o ejecutándola en una sola instancia.
