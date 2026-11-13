-- JAMA · Perfiles públicos de negocios con portada y slug (ADR-012).
-- Permite que los comercios personalicen su marca y compartan su enlace /t/:slug.

ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS portada_url text,
  ADD COLUMN IF NOT EXISTS descripcion text,
  ADD COLUMN IF NOT EXISTS horario_atencion text;

-- Generar slugs iniciales para los negocios ya existentes
UPDATE negocios
SET slug = lower(regexp_replace(regexp_replace(trim(nombre), '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Asegurar unicidad si algún nombre genera el mismo slug
UPDATE negocios n1
SET slug = n1.slug || '-' || substr(n1.id::text, 1, 4)
WHERE EXISTS (
  SELECT 1 FROM negocios n2 WHERE n2.slug = n1.slug AND n2.id <> n1.id
);

-- Si algún slug quedó vacío (ej. nombres con solo símbolos), usar id
UPDATE negocios
SET slug = 'tienda-' || substr(id::text, 1, 6)
WHERE slug IS NULL OR slug = '';

ALTER TABLE negocios ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_negocios_slug ON negocios (slug);
