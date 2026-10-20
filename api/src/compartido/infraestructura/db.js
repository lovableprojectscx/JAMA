import pg from 'pg';

const { Pool } = pg;

let pool;

export function obtenerPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL no está definida');
    }
    pool = new Pool({ connectionString });
  }
  return pool;
}

export async function cerrarPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
