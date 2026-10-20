import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

async function migrar(databaseUrl) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migraciones_aplicadas (
        nombre text PRIMARY KEY,
        aplicada_en timestamptz NOT NULL DEFAULT now()
      );
    `);

    const carpeta = path.join(import.meta.dirname, 'migrations');
    const archivos = (await readdir(carpeta)).filter((f) => f.endsWith('.sql')).sort();

    for (const archivo of archivos) {
      const { rows } = await client.query(
        'SELECT 1 FROM migraciones_aplicadas WHERE nombre = $1',
        [archivo]
      );
      if (rows.length > 0) continue;

      const sql = await readFile(path.join(carpeta, archivo), 'utf8');
      console.log(`Aplicando migración: ${archivo}`);
      await client.query(sql);
      await client.query('INSERT INTO migraciones_aplicadas (nombre) VALUES ($1)', [archivo]);
    }
  } finally {
    await client.end();
  }
}

const url = process.argv[2] ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Uso: node db/migrate.js [DATABASE_URL]  (o define DATABASE_URL en .env)');
  process.exit(1);
}

await migrar(url);
console.log('Migraciones al día.');
