# Patrones de diseño

## Objetivo
Documentar los patrones de diseño aplicados en el backend: dónde se usan, qué problema resuelven y con qué se implementan, para que todo el proyecto se programe igual.

## Contexto
- **Estilo:** monolito modular (Node.js + Express).
- **Enfoque interno:** Clean Architecture.
- **Base:** [diagrama de componentes (C4 nivel 3)](../../04-modelo-c4/Nivel3-Diagrama-de-Componentes.md).

## Patrones aplicados

| Patrón | Dónde se usa | Problema que resuelve | Se implementa con | Archivos | Estado |
|---|---|---|---|---|---|
| **Repository** | Todos los módulos → base de datos | El negocio no debe conocer SQL | `pg` (PostgreSQL) | `oferta-repository.js`, `oferta-repository-pg.js`, `codigo-canje-repository-memoria.js` | ✅ En el ejemplo |
| **Adapter** | Pedidos → WhatsApp | WhatsApp tiene su propio formato de enlace | URL `wa.me` | `puertos.js` (`EnlaceMensajeria`), `wame-enlace.adapter.js` | ✅ En el ejemplo |
| **Adapter** | Pedidos → Ofertas y Negocios | Pedidos no debe depender de las clases internas de otros módulos | API pública del módulo | `modulos-vecinos.adapters.js` | ✅ En el ejemplo |
| **Adapter** | Ofertas → almacenamiento de imágenes | El proveedor tiene su propia API | SDK de Cloudinary | `AlmacenImagenes`, `CloudinaryAdapter` | 📋 Diseñado (ADR-007) |
| **Unit of Work** | Pedidos (reservar, resolver, expirar) | El stock y el código deben confirmarse juntos o no confirmarse (ADR-003) | `BEGIN/COMMIT/ROLLBACK` de PostgreSQL | `puertos.js` (`UnidadDeTrabajo`), `unidad-de-trabajo-pg.js`, `unidad-de-trabajo-memoria.js` | ✅ En el ejemplo |
| **Máquina de estados** (State simplificado) | Entidad `CodigoCanje` | Impedir transiciones inválidas (por ejemplo, vender un código expirado) | Estado como enumeración y transiciones privadas | `codigo-canje.js` | ✅ En el ejemplo |
| **Facade** | API pública de cada módulo | Otros módulos usan una sola puerta de entrada sin conocer el interior | `index.js` por módulo | `ofertas/index.js`, `negocios/index.js` | ✅ En el ejemplo |
| **Composition Root** (inyección de dependencias) | Cada módulo | Decidir en un solo lugar qué adaptador implementa cada puerto | Constructores + `*.module.js` | `pedidos.module.js` | ✅ En el ejemplo |
| **Decorator** | Ofertas → caché del listado | Responder rápido sin modificar el repositorio (ADR-008) | `Map` en memoria con duración de 30 s | `OfertaRepositoryConCache` | 📋 Diseñado |

## Cómo funciona cada patrón

| Patrón | En pocas palabras |
|---|---|
| Repository | El caso de uso dice `guardar(codigo)`; el repositorio escribe el SQL. |
| Adapter | El caso de uso dice `generarEnlace(telefono, mensaje)`; el adaptador lo convierte en `https://wa.me/51…?text=…`. |
| Unit of Work | Todo lo que ocurre dentro de `ejecutar(tx => …)` se confirma junto; si algo falla, se deshace todo. |
| Máquina de estados | `CodigoCanje` solo sale de RESERVADO, una vez; cualquier otro intento lanza RN-07. |
| Facade | Pedidos llama `apiOfertas.reservarUnidad(...)` y no sabe cómo Ofertas guarda sus datos. |
| Composition Root | `pedidos.module.js` crea las piezas concretas y las entrega a los casos de uso. |
| Decorator | `OfertaRepositoryConCache` envuelve al repositorio real: si el listado está en caché lo devuelve; si no, consulta y lo guarda 30 s. |

## Beneficio
- Cambiar WhatsApp, el proveedor de imágenes o la base de datos solo afecta a un adaptador o repositorio.
- La caché se puede activar o retirar sin tocar las reglas del negocio.
- Las reglas críticas (stock y estados del código) se prueban sin infraestructura.

## Patrones previstos para siguientes iteraciones

| Patrón | Dónde se aplicaría | Cuándo |
|---|---|---|
| Observer (eventos de dominio) | `CodigoVendido` → Reportes y futuras alertas "avísame cuando haya pollo cerca" | Al implementar las alertas (fuera del MVP) |
| Strategy | Cálculo del orden del listado (cercanía, plan Pro destacado, descuento) | Cuando se defina la regla de posicionamiento del plan Pro |
| Factory | Creación de ofertas recurrentes ("todos los días a las 18:00") | Si los negocios piden plantillas de ofertas |
