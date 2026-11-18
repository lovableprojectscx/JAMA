# ADR-008: Caché del listado e imágenes optimizadas

- **Estado:** Aceptada
- **Drivers:** DA05 (rendimiento móvil), AC01

## Contexto
Entre las 17:00 y las 21:00, muchos clientes abren el listado de ofertas desde celulares con datos móviles. El listado es la consulta más repetida, y las fotos son lo que más pesa en la página.

## Decisión
- **Caché en memoria** del listado por ciudad y zona, con duración de **30 segundos**, implementada como un adaptador del puerto `OfertaRepository` (patrón *decorator*). La caché se invalida al publicar, editar o agotar una oferta.
- La **disponibilidad** (el stock) **no** se toma de la caché al pedir: `PedirOferta` siempre lee la base de datos con bloqueo (ADR-003).
- **Imágenes** servidas desde el CDN del proveedor, en formato WebP, con un ancho máximo de 800 px y carga diferida (*lazy loading*).
- **Paginación** del listado (20 ofertas por página) e **índices** en `(ciudad_id, estado, hora_limite)`.

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Redis desde el MVP | Es infraestructura adicional y costo; la caché en memoria basta con una sola instancia. Puede migrarse sin tocar los casos de uso, porque es un adaptador. |
| Sin caché | Se harían consultas repetidas a la base de datos en la hora de mayor carga. |

## Consecuencias
- ✅ El listado responde en menos de 2 s y la página pesa menos de 1 MB (medida de AC01).
- ⚠️ El listado puede mostrar datos con hasta 30 s de retraso si se activa la caché. Es aceptable, porque la verificación real ocurre al pedir.

> **Estado real en el MVP:** Las imágenes se sirven desde el bucket público CDN de Supabase Storage y la base de datos tiene índices en `(estado, hora_limite)`. El decorador de caché en memoria (30 s) y la paginación se mantienen como patrón preparado ([`patrones-de-diseno.md`](../../03-diseno-de-software/diseno-interno/patrones-de-diseno.md)), ya que para el volumen del piloto de Huamanga la consulta indexada directa responde por debajo del umbral sin introducir latencia de invalidación.
