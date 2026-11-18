# ADR-007: Integraciones externas mediante puertos y adaptadores

- **Estado:** Aceptada
- **Drivers:** DA06 (pago y pedido fuera del sistema), DA09 (mantenibilidad)

## Contexto
Hoy, el pedido se inicia con un enlace `wa.me` y las fotos se guardan en un servicio externo de imágenes. Mañana podría usarse la API de WhatsApp Business, otro proveedor de imágenes o el cobro por pedido. Los casos de uso no deben cambiar cuando cambie el proveedor.

## Decisión
El dominio define **puertos** (interfaces) y la infraestructura los implementa con **adaptadores**:

| Puerto (dominio) | Adaptador implementado (infraestructura) | Posible adaptador futuro |
|---|---|---|
| `EnlaceMensajeria` → `generarEnlace(telefono, mensaje)` | `WaMeEnlaceAdapter` (construye `https://wa.me/…?text=…`) | `WhatsAppBusinessAdapter` |
| `AlmacenImagenes` → `subir(archivo)`, `urlOptimizada(id)` | `SupabaseStorageAdapter` *(reemplazó la propuesta inicial de `CloudinaryAdapter`)* | `S3Adapter` o CDN dedicado |
| `GeneradorCodigo` → `nuevo()` | `GeneradorCodigoAleatorio` | — |
| `Reloj` → `ahora()` | `RelojSistema` | `RelojFijo` (para pruebas) |

**Evolución respecto a Yape:** inicialmente el dominio solo guardaba el número Yape del negocio (RC06). En noviembre de 2026, mediante [ADR-013](ADR-013-flujo-concierge-cobro-yape-y-publicacion-asistida.md), se adoptó el **Flujo Concierge de Cobro Centralizado con Yape a JAMA**, manteniendo la arquitectura sin pasarela bancaria de tarjetas.

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Llamar a los SDK de los proveedores desde los casos de uso | Acopla el negocio al proveedor y obliga a reescribir los casos de uso si se cambia. |
| Integrar una pasarela de pago ahora | Fuera del alcance del MVP (RC06). |

## Consecuencias
- ✅ Cambiar de proveedor solo afecta a un archivo de infraestructura.
- ✅ En las pruebas se usan adaptadores falsos.
- ⚠️ Hay una capa de indirección adicional por cada integración.
