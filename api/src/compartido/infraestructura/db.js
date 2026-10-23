import pg from 'pg';

const { Pool } = pg;

let pool;

export function obtenerPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL no está definida');
    }
    pool = new Pool({
      connectionString,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      max: 10,
    });

    // Evita que un ECONNRESET en un cliente inactivo mate el proceso de Node
    pool.on('error', (err) => {
      console.warn('[db] Advertencia en conexión inactiva del pool (reconexión automática):', err.message);
    });
  }
  return pool;
}

export async function cerrarPool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
