-- JAMA · alta de negocios por solicitud con aprobación (ADR-010, ADR-011).

-- RN-14: ciclo de vida del negocio. Los negocios que ya existen siguen
-- ACTIVO; los nuevos entran PENDIENTE hasta que un administrador los apruebe.
ALTER TABLE negocios DROP CONSTRAINT IF EXISTS negocios_estado_check;
ALTER TABLE negocios ADD CONSTRAINT negocios_estado_check
  CHECK (estado IN ('PENDIENTE', 'ACTIVO', 'RECHAZADO', 'SUSPENDIDO'));
ALTER TABLE negocios ALTER COLUMN estado SET DEFAULT 'PENDIENTE';

-- RN-15: datos de la solicitud. Son NULL en los negocios creados antes de
-- esta migración (los creó el script de seed, no un formulario).
ALTER TABLE negocios
  ADD COLUMN IF NOT EXISTS responsable text,
  ADD COLUMN IF NOT EXISTS tipo text
    CHECK (tipo IN ('PANADERIA', 'PASTELERIA', 'POLLERIA', 'RESTAURANTE', 'CAFETERIA')),
  ADD COLUMN IF NOT EXISTS declaracion_aceptada_en timestamptz,
  ADD COLUMN IF NOT EXISTS revisado_en timestamptz,
  ADD COLUMN IF NOT EXISTS revisado_por uuid,
  ADD COLUMN IF NOT EXISTS motivo_estado text;

-- RN-16: un número de WhatsApp por negocio (el correo ya es UNIQUE).
CREATE UNIQUE INDEX IF NOT EXISTS uq_negocios_whatsapp ON negocios (whatsapp);
CREATE INDEX IF NOT EXISTS idx_negocios_estado ON negocios (estado, creado_en DESC);

-- ADR-011: cuentas de administrador, del módulo Acceso.
CREATE TABLE IF NOT EXISTS administradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
