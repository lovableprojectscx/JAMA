import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

export function poolDePruebas() {
  const connectionString =
    process.env.DATABASE_URL_TEST ?? 'postgresql://postgres:postgres@localhost:5432/jama_test';
  return new Pool({ connectionString });
}

export async function limpiarTablas(pool) {
  await pool.query('TRUNCATE TABLE codigos_canje, ofertas, negocios CASCADE');
}

let contador = 0;

function emailUnico(pista) {
  contador += 1;
  const prefijo = pista ? pista.split('@')[0] : 'negocio';
  return `${prefijo}-${Date.now()}-${contador}-${Math.random().toString(36).slice(2, 8)}@jama.pe`;
}

/** WhatsApp único (RN-16): 51 + 9 dígitos que empiezan en 9. */
function whatsappUnico() {
  const nueveDigitos = `9${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
  return `51${nueveDigitos}`;
}

export async function crearNegocioDePrueba(pool, overrides = {}) {
  const passwordHash = await bcrypt.hash(overrides.password ?? 'demo1234', 4);
  const { rows } = await pool.query(
    `INSERT INTO negocios (nombre, email, password_hash, whatsapp, yape, direccion, estado, motivo_estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, nombre, email, whatsapp, estado`,
    [
      overrides.nombre ?? 'Negocio de prueba',
      // Siempre único, aunque se pase `email`: evita colisiones entre
      // corridas repetidas de `npm test` contra la misma base jama_test.
      overrides.emailExacto ?? emailUnico(overrides.email),
      passwordHash,
      overrides.whatsapp ?? whatsappUnico(),
      overrides.yape ?? '900000000',
      overrides.direccion ?? 'Jr. Prueba 1',
      overrides.estado ?? 'ACTIVO',
      overrides.motivoEstado ?? null,
    ]
  );
  return rows[0];
}

export async function crearOfertaDePrueba(pool, negocioId, overrides = {}) {
  const ahora = new Date();
  const horaLimite = overrides.horaLimite ?? new Date(ahora.getTime() + 60 * 60_000);
  const { rows } = await pool.query(
    `INSERT INTO ofertas
       (negocio_id, titulo, descripcion, foto_url, precio_carta, precio_oferta,
        stock, hora_elaboracion, hora_limite, estado, tramos_precio)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING id, stock, estado`,
    [
      negocioId,
      overrides.titulo ?? 'Oferta de prueba',
      overrides.descripcion ?? 'Descripción',
      overrides.fotoUrl ?? 'http://x/foto.jpg',
      overrides.precioCarta ?? 20,
      overrides.precioOferta ?? 10,
      overrides.stock ?? 3,
      overrides.horaElaboracion ?? ahora,
      horaLimite,
      overrides.estado ?? 'ACTIVA',
      JSON.stringify(overrides.tramosPrecio ?? []),
    ]
  );
  return rows[0];
}
