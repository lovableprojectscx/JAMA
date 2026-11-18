# ADR-009: Aplicación web SPA separada del backend

- **Estado:** Aceptada
- **Drivers:** DA05 (rendimiento móvil), DA08 (API REST), AC05 (usabilidad)

## Contexto
El cliente entra desde un link de WhatsApp o un QR, casi siempre desde el celular y con datos móviles. El negocio usa su panel en la hora de cierre para publicar y confirmar códigos. La restricción RC03 exige que el frontend y el backend se comuniquen por una API REST.

## Decisión
- Construir la interfaz como una **SPA** (*Single Page Application*) con **React + Vite**, servida como archivos estáticos desde un CDN.
- Una sola aplicación con rutas y áreas separadas por rol: **vitrina pública** (`/`), **perfil público de tienda** (`/t/:slug`), **captación y alta** (`/negocios`, `/negocios/registro`, `/terminos`), **panel del negocio** (`/panel`) y **panel de administración concierge** (`/admin`).
- Diseño *mobile-first*; preparada para funcionar como PWA (instalable sin pasar por una tienda de apps) en una iteración futura.
- La SPA no guarda datos de negocio: todo pasa por la API REST.

## Alternativas consideradas
| Alternativa | Por qué se descartó |
|---|---|
| Páginas generadas en el servidor (Express + plantillas) | Acopla la interfaz al backend y obliga a desplegar ambos juntos. |
| App móvil nativa | Contradice la propuesta de valor: no descargar nada (RC01). |
| Angular | Es válido; se elige React por su ecosistema y porque es la herramienta que el equipo ya domina. |

## Consecuencias
- ✅ El frontend y el backend evolucionan y se despliegan de forma independiente.
- ✅ Los archivos estáticos se sirven desde un CDN, rápido y gratuito (RC10).
- ⚠️ El SEO de la vitrina es limitado en una SPA; no es crítico porque el tráfico llega por links de WhatsApp y QR, no por buscadores.
