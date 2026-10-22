import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';

const { Client } = pg;

const url = process.argv[2] ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Uso: node db/seed.js [DATABASE_URL]  (o define DATABASE_URL en .env)');
  process.exit(1);
}

const client = new Client({ connectionString: url });
await client.connect();

const email = 'panaderia@jama.pe';
const password = 'demo1234';
const passwordHash = await bcrypt.hash(password, 10);

const { rows } = await client.query(
  `INSERT INTO negocios (nombre, email, password_hash, whatsapp, yape, direccion, responsable, tipo, estado)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVO')
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, estado = 'ACTIVO'
   RETURNING id, nombre, email, estado`,
  [
    'Panadería Ejemplo',
    email,
    passwordHash,
    '51987654321',
    '987654321',
    'Jr. Lima 123, Huamanga',
    'Dueño de prueba',
    'PANADERIA',
  ]
);

console.log('Negocio de prueba listo:', rows[0]);
console.log(`Credenciales → email: ${email} · password: ${password}`);

await client.end();
