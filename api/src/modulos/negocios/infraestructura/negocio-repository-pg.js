import { NegocioRepository } from '../dominio/puertos.js';
import { Negocio } from '../dominio/negocio.js';
import { NegocioDuplicadoError } from '../../../compartido/dominio/errores.js';

const VIOLACION_UNICA = '23505';

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
    responsable: fila.responsable,
    tipo: fila.tipo,
    declaracionAceptadaEn: fila.declaracion_aceptada_en,
    creadoEn: fila.creado_en,
    revisadoEn: fila.revisado_en,
    revisadoPor: fila.revisado_por,
    motivoEstado: fila.motivo_estado,
  });
}

export class NegocioRepositoryPg extends NegocioRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async obtenerPorEmail(email, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query('SELECT * FROM negocios WHERE email = $1', [
      String(email ?? '').trim().toLowerCase(),
    ]);
    return filaANegocio(rows[0]);
  }

  async obtenerPorId(id, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query('SELECT * FROM negocios WHERE id = $1', [id]);
    return filaANegocio(rows[0]);
  }

  /** RN-16: la base garantiza la unicidad (índices); aquí se traduce a un error del dominio. */
  async crear(negocio) {
    try {
      await this.pool.query(
        `INSERT INTO negocios
           (id, nombre, responsable, tipo, email, password_hash, whatsapp, yape, direccion,
            estado, declaracion_aceptada_en, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          negocio.id,
          negocio.nombre,
          negocio.responsable,
          negocio.tipo,
          negocio.email,
          negocio.passwordHash,
          negocio.whatsapp,
          negocio.yape,
          negocio.direccion,
          negocio.estado,
          negocio.declaracionAceptadaEn,
          negocio.creadoEn,
        ]
      );
    } catch (error) {
      if (error.code === VIOLACION_UNICA) {
        throw new NegocioDuplicadoError(error.constraint === 'uq_negocios_whatsapp' ? 'whatsapp' : 'email');
      }
      throw error;
    }
  }

  async listarActivosConDetalle() {
    const { rows } = await this.pool.query(
      `SELECT id, nombre, direccion, whatsapp FROM negocios WHERE estado = 'ACTIVO'`
    );
    return rows;
  }

  async listarIdsActivos() {
    const { rows } = await this.pool.query(`SELECT id FROM negocios WHERE estado = 'ACTIVO'`);
    return rows.map((fila) => fila.id);
  }

  async listarPorEstado(estado, tx) {
    const ejecutor = tx ?? this.pool;
    let query = 'SELECT * FROM negocios';
    const params = [];
    if (estado) {
      query += ' WHERE estado = $1';
      params.push(estado);
    }
    query += ' ORDER BY creado_en DESC';
    const { rows } = await ejecutor.query(query, params);
    return rows.map(filaANegocio);
  }

  async guardarEstado(negocio, tx) {
    const ejecutor = tx ?? this.pool;
    await ejecutor.query(
      `UPDATE negocios
       SET estado = $1, revisado_en = $2, revisado_por = $3, motivo_estado = $4
       WHERE id = $5`,
      [negocio.estado, negocio.revisadoEn, negocio.revisadoPor, negocio.motivoEstado, negocio.id]
    );
  }
}
