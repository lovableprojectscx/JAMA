import { OfertaRepository } from '../dominio/oferta-repository.js';
import { Oferta } from '../dominio/oferta.js';

function filaAOferta(fila) {
  if (!fila) return null;
  return new Oferta({
    id: fila.id,
    negocioId: fila.negocio_id,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    fotoUrl: fila.foto_url,
    precioCarta: Number(fila.precio_carta),
    precioOferta: Number(fila.precio_oferta),
    stock: fila.stock,
    horaElaboracion: fila.hora_elaboracion,
    horaLimite: fila.hora_limite,
    estado: fila.estado,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en,
  });
}

export class OfertaRepositoryPg extends OfertaRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  async crear(oferta, tx) {
    const ejecutor = tx ?? this.pool;
    await ejecutor.query(
      `INSERT INTO ofertas
         (id, negocio_id, titulo, descripcion, foto_url, precio_carta, precio_oferta,
          stock, hora_elaboracion, hora_limite, estado, creado_en, actualizado_en)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        oferta.id,
        oferta.negocioId,
        oferta.titulo,
        oferta.descripcion,
        oferta.fotoUrl,
        oferta.precioCarta,
        oferta.precioOferta,
        oferta.stock,
        oferta.horaElaboracion,
        oferta.horaLimite,
        oferta.estado,
        oferta.creadoEn,
        oferta.actualizadoEn,
      ]
    );
  }

  /** Bloquea la fila con FOR UPDATE: base de ADR-003 para evitar sobreventa. */
  async obtenerParaActualizar(id, tx) {
    const { rows } = await tx.query('SELECT * FROM ofertas WHERE id = $1 FOR UPDATE', [id]);
    return filaAOferta(rows[0]);
  }

  async obtenerPorId(id) {
    const { rows } = await this.pool.query('SELECT * FROM ofertas WHERE id = $1', [id]);
    return filaAOferta(rows[0]);
  }

  async guardar(oferta, tx) {
    const ejecutor = tx ?? this.pool;
    await ejecutor.query(
      `UPDATE ofertas
         SET stock = $1, estado = $2, actualizado_en = $3
       WHERE id = $4`,
      [oferta.stock, oferta.estado, oferta.actualizadoEn, oferta.id]
    );
  }

  async listarVigentes(ahora) {
    const { rows } = await this.pool.query(
      `SELECT * FROM ofertas
        WHERE estado = 'ACTIVA' AND stock > 0 AND hora_limite > $1
        ORDER BY hora_limite ASC`,
      [ahora]
    );
    return rows.map(filaAOferta);
  }
}
