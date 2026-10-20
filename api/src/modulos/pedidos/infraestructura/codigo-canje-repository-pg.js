import { CodigoCanjeRepository } from '../dominio/puertos.js';
import { CodigoCanje } from '../dominio/codigo-canje.js';

function filaACodigoCanje(fila) {
  if (!fila) return null;
  return new CodigoCanje({
    id: fila.id,
    codigo: fila.codigo,
    ofertaId: fila.oferta_id,
    negocioId: fila.negocio_id,
    estado: fila.estado,
    creadoEn: fila.creado_en,
    expiraEn: fila.expira_en,
    historial: fila.historial,
    precio: fila.precio == null ? null : Number(fila.precio),
  });
}

export class CodigoCanjeRepositoryPg extends CodigoCanjeRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async guardar(codigoCanje, tx) {
    const ejecutor = tx ?? this.pool;
    await ejecutor.query(
      `INSERT INTO codigos_canje (id, codigo, oferta_id, negocio_id, estado, creado_en, expira_en, historial, precio)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
         SET estado = EXCLUDED.estado,
             historial = EXCLUDED.historial`,
      [
        codigoCanje.id,
        codigoCanje.codigo,
        codigoCanje.ofertaId,
        codigoCanje.negocioId,
        codigoCanje.estado,
        codigoCanje.creadoEn,
        codigoCanje.expiraEn,
        JSON.stringify(codigoCanje.historial),
        codigoCanje.precio,
      ]
    );
  }

  async buscarPorCodigo(codigo, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query(
      `SELECT * FROM codigos_canje WHERE codigo = $1 AND estado = 'RESERVADO'
       ORDER BY creado_en DESC LIMIT 1 FOR UPDATE`,
      [codigo]
    );
    return filaACodigoCanje(rows[0]);
  }

  async existeCodigoActivo(codigo, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query(
      `SELECT 1 FROM codigos_canje WHERE codigo = $1 AND estado = 'RESERVADO'`,
      [codigo]
    );
    return rows.length > 0;
  }

  async listarReservadosVencidos(ahora, tx) {
    const ejecutor = tx ?? this.pool;
    const { rows } = await ejecutor.query(
      `SELECT * FROM codigos_canje
        WHERE estado = 'RESERVADO' AND expira_en <= $1
        FOR UPDATE SKIP LOCKED`,
      [ahora]
    );
    return rows.map(filaACodigoCanje);
  }

  /** RN-10: el panel del negocio solo ve los códigos de su propio negocio. */
  async listarPorNegocioYEstado(negocioId, estado) {
    const { rows } = await this.pool.query(
      `SELECT * FROM codigos_canje WHERE negocio_id = $1 AND estado = $2 ORDER BY expira_en ASC`,
      [negocioId, estado]
    );
    return rows.map(filaACodigoCanje);
  }
}
