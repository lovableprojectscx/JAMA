-- JAMA · Etapa 3 (panel del negocio): tramos de precio por hora y precio
-- guardado en el código de canje.

ALTER TABLE ofertas
  ADD COLUMN IF NOT EXISTS tramos_precio jsonb NOT NULL DEFAULT '[]'::jsonb;

-- El precio es nulo en códigos creados antes de esta migración; todo código
-- nuevo lo recibe siempre desde PedirOferta (RN-11: precio que vio el cliente).
ALTER TABLE codigos_canje
  ADD COLUMN IF NOT EXISTS precio numeric(10, 2);
