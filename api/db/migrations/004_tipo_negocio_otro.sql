-- JAMA · tipo de negocio "OTRO" con su detalle (RN-15).
-- El administrador necesita saber qué es ese "otro" para aprobar o rechazar
-- la solicitud (por ejemplo, rechazar un supermercado por RC09).

ALTER TABLE negocios DROP CONSTRAINT IF EXISTS negocios_tipo_check;
ALTER TABLE negocios ADD CONSTRAINT negocios_tipo_check
  CHECK (tipo IN ('PANADERIA', 'PASTELERIA', 'POLLERIA', 'RESTAURANTE', 'CAFETERIA', 'OTRO'));

ALTER TABLE negocios ADD COLUMN IF NOT EXISTS tipo_detalle text;
