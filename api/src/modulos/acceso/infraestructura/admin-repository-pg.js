import { AdminRepository } from '../dominio/puertos.js';

function filaAAdmin(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    passwordHash: fila.password_hash,
    creadoEn: fila.creado_en,
  };
}

export class AdminRepositoryPg extends AdminRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async obtenerPorEmail(email, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query(
      'SELECT id, nombre, email, password_hash, creado_en FROM administradores WHERE email = $1',
      [String(email ?? '').trim().toLowerCase()]
    );
    return filaAAdmin(rows[0]);
  }

  async obtenerPorId(id, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query(
      'SELECT id, nombre, email, password_hash, creado_en FROM administradores WHERE id = $1',
      [id]
    );
    return filaAAdmin(rows[0]);
  }

  async crear({ id, nombre, email, passwordHash }, tx) {
    const ejecutor = tx ?? this.pool;
    const query = id
      ? `INSERT INTO administradores (id, nombre, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, creado_en`
      : `INSERT INTO administradores (nombre, email, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, email, creado_en`;
    const params = id ? [id, nombre, email.toLowerCase().trim(), passwordHash] : [nombre, email.toLowerCase().trim(), passwordHash];

    const { rows } = await ejecutor.query(query, params);
    return filaAAdmin(rows[0]);
  }
}
