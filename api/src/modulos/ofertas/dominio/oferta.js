import { ReglaNegocioError, OfertaAgotadaError, OfertaNoVigenteError } from '../../../compartido/dominio/errores.js';

export const EstadoOferta = Object.freeze({
  ACTIVA: 'ACTIVA',
  PAUSADA: 'PAUSADA',
  AGOTADA: 'AGOTADA',
  FINALIZADA: 'FINALIZADA',
});

export class Oferta {
  constructor({
    id,
    negocioId,
    titulo,
    descripcion,
    fotoUrl,
    precioCarta,
    precioOferta,
    stock,
    horaElaboracion,
    horaLimite,
    estado,
    creadoEn,
    actualizadoEn,
  }) {
    this.id = id;
    this.negocioId = negocioId;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.fotoUrl = fotoUrl;
    this.precioCarta = precioCarta;
    this.precioOferta = precioOferta;
    this.stock = stock;
    this.horaElaboracion = horaElaboracion;
    this.horaLimite = horaLimite;
    this.estado = estado;
    this.creadoEn = creadoEn;
    this.actualizadoEn = actualizadoEn;
  }

  /**
   * RN-01: el precio de oferta debe ser menor que el precio de carta.
   * RN-03: la hora límite debe ser futura y la oferta debe tener al menos 1 unidad.
   */
  static publicar(datos, ahora) {
    const { negocioId, titulo, precioCarta, precioOferta, stock, horaElaboracion, horaLimite } = datos;

    if (!(Number(precioOferta) < Number(precioCarta))) {
      throw new ReglaNegocioError('RN-01: el precio de oferta debe ser menor que el precio de carta');
    }
    if (!Number.isInteger(stock) || stock < 1) {
      throw new ReglaNegocioError('RN-03: la oferta debe tener al menos 1 unidad de stock');
    }
    if (!(horaLimite instanceof Date) || Number.isNaN(horaLimite.getTime()) || horaLimite <= ahora) {
      throw new ReglaNegocioError('RN-03: la hora límite debe ser futura');
    }

    return new Oferta({
      ...datos,
      negocioId,
      titulo,
      precioCarta,
      precioOferta,
      stock,
      horaElaboracion,
      horaLimite,
      estado: EstadoOferta.ACTIVA,
      creadoEn: ahora,
      actualizadoEn: ahora,
    });
  }

  /** RF01/ADR-005: una oferta vigente está ACTIVA, con stock y dentro de su hora límite. */
  estaVigente(ahora) {
    return this.estado === EstadoOferta.ACTIVA && this.stock > 0 && this.horaLimite > ahora;
  }

  /** RN-05: solo se reserva una unidad si la oferta está ACTIVA, vigente y con stock. */
  reservarUnidad(ahora) {
    if (this.stock <= 0) {
      throw new OfertaAgotadaError();
    }
    if (this.estado !== EstadoOferta.ACTIVA || this.horaLimite <= ahora) {
      throw new OfertaNoVigenteError();
    }
    this.stock -= 1;
    if (this.stock === 0) {
      this.estado = EstadoOferta.AGOTADA;
    }
    this.actualizadoEn = ahora;
  }

  /** RN-08: un código NO_CONCRETADO o EXPIRADO devuelve su unidad al stock. */
  liberarUnidad(ahora) {
    this.stock += 1;
    if (this.estado === EstadoOferta.AGOTADA) {
      this.estado = EstadoOferta.ACTIVA;
    }
    this.actualizadoEn = ahora;
  }
}
