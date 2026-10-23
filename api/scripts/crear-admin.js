import 'dotenv/config';
import bcrypt from 'bcrypt';
import pg from 'pg';

const { Pool } = pg;

async function crearAdmin() {
  const email = process.argv[2] ?? 'admin@jama.pe';
  const nombre = process.argv[3] ?? 'Administrador JAMA';
  const password = process.argv[4] ?? 'admin1234';

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL no está definida en .env');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO administradores (nombre, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, password_hash = EXCLUDED.password_hash
       RETURNING id, nombre, email, creado_en`,
      [nombre, email.toLowerCase().trim(), passwordHash]
    );

    console.log('✅ Administrador listo:');
    console.log(`- ID: ${rows[0].id}`);
    console.log(`- Nombre: ${rows[0].nombre}`);
    console.log(`- Correo: ${rows[0].email}`);
    console.log(`- Contraseña: ${password}`);
  } finally {
    await pool.end();
  }
}

crearAdmin().catch((err) => {
  console.error('Error al crear administrador:', err);
  process.exit(1);
});
