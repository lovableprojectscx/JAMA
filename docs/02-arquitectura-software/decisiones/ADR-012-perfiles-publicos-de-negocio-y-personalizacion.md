# ADR-012: Perfiles públicos de negocios y personalización de marca

- **Estado:** Aceptada
- **Fecha:** noviembre 2026
- **Drivers:** DA04 (aislamiento y control de acceso), AC05 (usabilidad móvil), AC06 (confiabilidad y trazabilidad)
- **Requisitos:** RF07, RF24 · HU06, HU18, HU19

## Contexto
En el MVP inicial, los comercios aliados aparecían únicamente agregados dentro de la vitrina central (`/`), y la edición de perfil desde el panel había quedado fuera del alcance del MVP en [ADR-010](ADR-010-alta-de-negocios-por-solicitud.md). Sin embargo, para el piloto comercial y las pastelerías aliadas en Huamanga, los negocios necesitan compartir su propio enlace en redes sociales y WhatsApp (un "link en bio" formal) que exhiba su marca, foto de portada, logotipo, horario de recojo y exclusivamente sus ofertas de cierre vigentes. Asimismo, para la consistencia metodológica de la Tesis (UNSCH), la dimensión de trazabilidad y verificación de frescura requiere identificar con transparencia al establecimiento responsable de la oferta.

## Decisión
1. **Página pública individual (`/t/:slug`):**
   - Cada negocio ACTIVO dispone de una URL amigable e indexable basada en un `slug` único generado a partir de su nombre comercial (ej. `pasteleria-dulce-huamanga`).
   - La página expone su foto de portada panorámica, logotipo troquelado, nombre, tipo de negocio, insignia de "Negocio Verificado", dirección en Huamanga, enlace a Google Maps, horario de recojo y su listado en tiempo real de ofertas activas.
   - Si no tiene ofertas activas en el momento, no muestra un error 404 ni pantalla vacía: muestra un estado explicativo con su horario habitual de cierre y botón directo a su WhatsApp.
   - Si el negocio no está `ACTIVO` (está PENDIENTE, RECHAZADO o SUSPENDIDO), la ruta responde `404` para proteger la vitrina pública (RN-13).

2. **Personalización y edición en el panel del negocio (`/panel`):**
   - Se incorpora una cuarta pestaña en la barra de navegación: "Mi Perfil".
   - El comerciante puede subir su foto de portada (máx. 5 MB) y logotipo (máx. 2 MB) a Supabase Storage, reutilizando el adaptador `SupabaseStorageAdapter` y el puerto `AlmacenImagenes` (ADR-007).
   - Puede editar su descripción corta, dirección, número Yape y horario de atención.
   - Seguridad: el caso de uso `ActualizarPerfil` extrae el `negocioId` estrictamente del JWT con rol `NEGOCIO` (ADR-006, RN-10).

3. **Fallback visual por defecto:**
   - Si una tienda recién aprobada no ha subido foto de portada, el frontend no muestra un marco gris vacío: genera un degradado de marca con la paleta oficial (crema `#FAF8EF` y azul marino `#1E2B4D` con acento lima `#D4DC31`).

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| URLs por UUID (`/tienda/3fa85f64...`) | Poco amigables para compartir por WhatsApp o Instagram; difícil de memorizar para clientes y comerciantes. |
| Subir fotos como Base64 en la base de datos | Degrada el rendimiento de PostgreSQL y agota el almacenamiento relacional; Supabase Storage ya está configurado y optimizado. |
| Dejar el perfil como una modal dentro de `/` | Impide que el negocio use la URL como enlace externo en sus redes sociales. |

## Consecuencias
- ✅ Los negocios aliados obtienen una herramienta de difusión propia con su marca.
- ✅ Se completa el alcance pendiente de RF07 y se fortalece la trazabilidad de la Tesis.
- ✅ Cero librerías externas adicionales: se reutiliza Vite, Lucide y Supabase Storage.
- ⚠️ Se añade la columna `slug` única en la tabla `negocios`; los negocios ya existentes en la base de datos reciben un slug autogenerado mediante la migración `005`.
