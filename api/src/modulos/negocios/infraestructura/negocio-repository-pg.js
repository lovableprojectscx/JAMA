import { NegocioRepository } from '../dominio/puertos.js';
import { Negocio } from '../dominio/negocio.js';

function filaANegocio(fila) {
  if (!fila) return null;
  return new Negocio({
    id: fila.id,
    nombre: fila.nombre,
    email: fila.email,
    passwordHash: fila.password_hash,
    whatsapp: fila.whatsapp,
    yape: fila.yape,
    direccion: fila.direccion,
    estado: fila.estado,
  });
}

export class NegocioRepositoryPg extends NegocioRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async obtenerPorEmail(email, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query('SELECT * FROM negocios WHERE email = $1', [email]);
    return filaANegocio(rows[0]);
  }

  async obtenerPorId(id, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query('SELECT * FROM negocios WHERE id = $1', [id]);
    return filaANegocio(rows[0]);
  }
}
