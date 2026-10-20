-- JAMA · esquema inicial: negocios, ofertas, codigos_canje
-- Cada tabla pertenece a un solo módulo (ADR-001): negocios -> negocios,
-- ofertas -> ofertas, codigos_canje -> pedidos.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS negocios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  whatsapp text NOT NULL,
  yape text,
  direccion text,
  estado text NOT NULL DEFAULT 'ACTIVO' CHECK (estado IN ('ACTIVO', 'SUSPENDIDO')),
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ofertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id uuid NOT NULL REFERENCES negocios(id),
  titulo text NOT NULL,
  descripcion text,
  foto_url text,
  precio_carta numeric(10, 2) NOT NULL CHECK (precio_carta > 0),
  precio_oferta numeric(10, 2) NOT NULL CHECK (precio_oferta > 0),
  stock integer NOT NULL CHECK (stock >= 0),
  hora_elaboracion timestamptz NOT NULL,
  hora_limite timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'ACTIVA'
    CHECK (estado IN ('ACTIVA', 'PAUSADA', 'AGOTADA', 'FINALIZADA')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT precio_oferta_menor_a_carta CHECK (precio_oferta < precio_carta)
);

CREATE INDEX IF NOT EXISTS idx_ofertas_vigencia ON ofertas (estado, hora_limite);
CREATE INDEX IF NOT EXISTS idx_ofertas_negocio ON ofertas (negocio_id);

CREATE TABLE IF NOT EXISTS codigos_canje (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo varchar(4) NOT NULL,
  oferta_id uuid NOT NULL REFERENCES ofertas(id),
  negocio_id uuid NOT NULL REFERENCES negocios(id),
  estado text NOT NULL DEFAULT 'RESERVADO'
    CHECK (estado IN ('RESERVADO', 'VENDIDO', 'NO_CONCRETADO', 'EXPIRADO')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  expira_en timestamptz NOT NULL,
  historial jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Un código solo puede estar RESERVADO una vez a la vez (evita colisiones
-- mientras está activo); una vez resuelto, el mismo texto puede reutilizarse.
CREATE UNIQUE INDEX IF NOT EXISTS uq_codigos_canje_activo
  ON codigos_canje (codigo)
  WHERE estado = 'RESERVADO';

CREATE INDEX IF NOT EXISTS idx_codigos_canje_negocio ON codigos_canje (negocio_id, estado);
CREATE INDEX IF NOT EXISTS idx_codigos_canje_oferta ON codigos_canje (oferta_id);
CREATE INDEX IF NOT EXISTS idx_codigos_canje_vencidos ON codigos_canje (estado, expira_en);
