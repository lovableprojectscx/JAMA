# Plan · Perfiles Públicos de Negocio con Portada y Gestión en JAMA

> **Requisitos:** RF07 (completado), RF24 (nuevo) · **Historias de Usuario:** HU06, HU18, HU19
> **Reglas:** RN-13, RN-17 (slugs), RN-18 (imágenes de marca), RN-19 (edición autenticada)
> **Decisiones:** [ADR-012](../02-arquitectura-software/decisiones/ADR-012-perfiles-publicos-de-negocio-y-personalizacion.md)

---

## 1. Objetivo

Dotar a cada comercio aliado de JAMA de un **perfil público dinámico y de alta calidad visual (con foto de portada, logotipo, insignia de verificado y feed exclusivo de ofertas vigentes)** accesible desde una URL corta y compartible (`/t/:slug`), junto a la pantalla de **gestión y edición de perfil** en su panel privado (`/panel`).

---

## 2. Mapa de Rutas

| Ruta | Para quién | Qué hace | Estado |
|---|---|---|---|
| `/` | Cliente | Vitrina general de ofertas en Huamanga. Los clics en comercio llevan a `/t/:slug`. | Existe · se ajusta enlace |
| `/t/:slug` | Cliente / Redes del comercio | Página pública del negocio con portada, logo, datos de contacto y sus ofertas vigentes del día. | **Nueva** |
| `/panel` | Negocio con cuenta | Gestión de ofertas, publicar, pedidos y ahora pestaña **Mi Perfil** para subir portada/logo y editar datos. | Existe · se amplía |
| `/admin` | Equipo JAMA | Administración de solicitudes y comercios. Muestra el enlace al perfil público de cada comercio. | Existe · se ajusta |

---

## 3. Base de Datos · Migración `005_perfil_negocio_portada.sql`

```sql
-- Agregar campos para el perfil público con portada y URL compartible
ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS portada_url text,
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS horario_atencion text;

-- Generar slugs iniciales para negocios ya existentes en la BD
UPDATE negocios
SET slug = lower(regexp_replace(regexp_replace(nombre, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- En caso de duplicados, concatenar los primeros 4 caracteres de su UUID
UPDATE negocios n1
SET slug = n1.slug || '-' || substr(n1.id::text, 1, 4)
WHERE EXISTS (
  SELECT 1 FROM negocios n2 WHERE n2.slug = n1.slug AND n2.id <> n1.id
);

-- Asegurar restricción NOT NULL y UNIQUE en slug
ALTER TABLE negocios ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_negocios_slug ON negocios (slug);
```

---

## 4. Endpoints de la API

| Método | Ruta | Rol | Qué hace | Respuestas |
|---|---|---|---|---|
| `GET` | `/api/v1/negocios/publico/:slugOrId` | Público | Obtiene el perfil público del negocio y sus ofertas activas | `200 { negocio, ofertas }` · `404` si no existe o no es ACTIVO |
| `GET` | `/api/v1/negocios/me/perfil` | NEGOCIO | Obtiene datos completos del negocio autenticado para edición | `200 { perfil }` · `401` / `403` |
| `PATCH` | `/api/v1/negocios/me/perfil` | NEGOCIO | Actualiza descripción, dirección, horario y Yape | `200 { perfil }` · `400` dato inválido |
| `POST` | `/api/v1/negocios/me/fotos/portada` | NEGOCIO | Sube imagen de portada a Supabase Storage y actualiza BD | `200 { portadaUrl }` · `400` formato/peso |
| `POST` | `/api/v1/negocios/me/fotos/logo` | NEGOCIO | Sube logotipo a Supabase Storage y actualiza BD | `200 { logoUrl }` · `400` formato/peso |
