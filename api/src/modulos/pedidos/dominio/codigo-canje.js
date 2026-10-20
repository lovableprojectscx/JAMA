import { ReglaNegocioError } from '../../../compartido/dominio/errores.js';

export const EstadoCodigo = Object.freeze({
  RESERVADO: 'RESERVADO',
  VENDIDO: 'VENDIDO',
  NO_CONCRETADO: 'NO_CONCRETADO',
  EXPIRADO: 'EXPIRADO',
});

const MINUTOS_RESERVA = 30;

export class CodigoCanje {
  constructor({ id, codigo, ofertaId, negocioId, estado, creadoEn, expiraEn, historial }) {
    this.id = id;
    this.codigo = codigo;
    this.ofertaId = ofertaId;
    this.negocioId = negocioId;
    this.estado = estado;
    this.creadoEn = creadoEn;
    this.expiraEn = expiraEn;
    this.historial = historial ?? [];
  }

  /** RN-06: una reserva vence a los 30 minutos. */
  static reservar({ id, codigo, ofertaId, negocioId }, ahora) {
    const expiraEn = new Date(ahora.getTime() + MINUTOS_RESERVA * 60_000);
    return new CodigoCanje({
      id,
      codigo,
      ofertaId,
      negocioId,
      estado: EstadoCodigo.RESERVADO,
      creadoEn: ahora,
      expiraEn,
      historial: [{ estado: EstadoCodigo.RESERVADO, fecha: ahora.toISOString(), actor: 'CLIENTE' }],
    });
  }

  /** RN-10: un negocio solo opera sobre sus propios códigos. */
  perteneceA(negocioId) {
    return this.negocioId === negocioId;
  }

  estaVencido(ahora) {
    return this.estado === EstadoCodigo.RESERVADO && this.expiraEn <= ahora;
  }

  /** RN-07: un código solo sale de RESERVADO, y una sola vez. */
  #transicion(nuevoEstado, ahora, actor) {
    if (this.estado !== EstadoCodigo.RESERVADO) {
      throw new ReglaNegocioError(`RN-07: el código ${this.codigo} ya está ${this.estado}`);
    }
    this.estado = nuevoEstado;
    this.historial.push({ estado: nuevoEstado, fecha: ahora.toISOString(), actor });
  }

  marcarVendido(ahora) {
    this.#transicion(EstadoCodigo.VENDIDO, ahora, 'NEGOCIO');
  }

  marcarNoConcretado(ahora) {
    this.#transicion(EstadoCodigo.NO_CONCRETADO, ahora, 'NEGOCIO');
  }

  marcarExpirado(ahora) {
    this.#transicion(EstadoCodigo.EXPIRADO, ahora, 'SISTEMA');
  }
}
