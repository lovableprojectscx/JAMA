# ADR-001: Monolito modular cliente-servidor

- **Estado:** Aceptada
- **Drivers:** DA07 (varias ciudades), DA08 (REST + Node + PostgreSQL), DA09 (mantenibilidad)

## Contexto
El MVP opera en una sola ciudad (Huamanga), con un solo desarrollador y un presupuesto cercano a cero (RC10). El curso exige una API REST sobre Node.js/Express con PostgreSQL. A la vez, el roadmap prevé crecer a Cusco y otras ciudades, y agregar funcionalidades según los resultados del piloto.

## Decisión
Construir un **monolito modular** con estilo **cliente-servidor**:
- Un único backend desplegable (Node.js + Express) que expone una API REST.
- Por dentro, el backend se divide en módulos con límites claros: **Acceso, Negocios, Ofertas, Pedidos, Reportes y Moderación**.
- Un módulo no accede a las tablas de otro: se comunica a través de sus casos de uso.
- La **ciudad** es un dato del dominio, no un despliegue separado (DA07).

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Monolito sin módulos (capas planas) | Las funcionalidades se mezclan y cada cambio afecta a todo el sistema (contradice DA09). |
| Microservicios | Implica varios despliegues, comunicación por red y datos distribuidos. Es demasiada complejidad para un solo desarrollador y una ciudad. |
| Serverless | La expiración programada y las transacciones con bloqueo son más difíciles de manejar, y depende de un proveedor. |

## Consecuencias
- ✅ Un solo despliegue, fácil de ejecutar en local y en Docker (RC11).
- ✅ Las transacciones entre módulos son simples (una sola base de datos).
- ✅ Si un módulo crece (por ejemplo, Pedidos), puede extraerse más adelante como servicio, porque sus límites ya existen.
- ⚠️ Todo el sistema escala junto. Para el volumen de una ciudad es aceptable; para más volumen se pueden ejecutar varias instancias detrás de un balanceador.
