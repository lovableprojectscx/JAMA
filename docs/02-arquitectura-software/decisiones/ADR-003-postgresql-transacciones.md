# ADR-003: PostgreSQL con transacción y bloqueo de fila para las reservas

- **Estado:** Aceptada
- **Drivers:** DA02 (sin sobreventa), AC02 (consistencia)

## Contexto
Una oferta de cierre tiene pocas unidades (por ejemplo, 3 tortas) y se concentra en la hora de cierre. Si dos clientes tocan "Pedir" al mismo tiempo, ambos podrían leer `stock = 1` y recibir un código, lo que produce una sobreventa y un cliente que paga por algo que no existe.

## Decisión
- Usar **PostgreSQL** como base de datos (también es una restricción del curso, RC05).
- El caso de uso `PedirOferta` se ejecuta dentro de una **unidad de trabajo** (transacción). El repositorio usa `SELECT … FOR UPDATE` sobre la fila de la oferta, valida que tenga stock y esté vigente, descuenta una unidad y crea el código de canje antes del `COMMIT`.
- Además, la base de datos tiene la restricción `CHECK (stock_disponible >= 0)` como segunda defensa.
- El caso de uso depende del puerto `UnidadDeTrabajo`, no de `pg` directamente (ADR-002).

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Base de datos NoSQL (MongoDB) | Las transacciones con bloqueo son más complejas, y el modelo de este sistema es relacional (negocio → oferta → código). |
| Validar el stock solo en el código de la aplicación | Hay una condición de carrera entre la lectura y la escritura. |
| Bloqueo optimista con versión | Es válido, pero obliga a reintentar en la hora de mayor carga; el bloqueo de fila es más simple para este volumen. |

## Consecuencias
- ✅ Cero sobreventas garantizadas por la base de datos (medida de AC02).
- ⚠️ Los pedidos sobre una misma oferta se procesan uno tras otro. Con pocas unidades por oferta, la espera es de milisegundos.
