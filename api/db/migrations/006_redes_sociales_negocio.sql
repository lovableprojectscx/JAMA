-- JAMA · Redes sociales del comercio aliado (Instagram, Facebook, TikTok).
-- Permite que los negocios muestren sus canales oficiales en su perfil público /t/:slug.

ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS instagram text,
  ADD COLUMN IF NOT EXISTS facebook text,
  ADD COLUMN IF NOT EXISTS tiktok text;
