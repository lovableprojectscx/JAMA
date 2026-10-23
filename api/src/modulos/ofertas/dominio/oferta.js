import { ReglaNegocioError, OfertaAgotadaError, OfertaNoVigenteError } from '../../../compartido/dominio/errores.js';
import { horaMinutoLima } from '../../../compartido/dominio/fechas.js';

export const EstadoOferta = Object.freeze({
  ACTIVA: 'ACTIVA',
  PAUSADA: 'PAUSADA',
  AGOTADA: 'AGOTADA',
  FINALIZADA: 'FINALIZADA',
});

const PATRON_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

function calcularPrecioConDescuento(precioCarta, descuentoPct) {
  return Number((Number(precioCarta) * (1 - descuentoPct / 100)).toFixed(2));
}

/**
 * RN-11: valida y ordena los tramos de precio opcionales de una oferta.
 * El precio solo puede bajar con la hora: cada tramo debe ser más barato
 * que el precio de oferta fijo, y más barato que el tramo anterior.
 */
function validarTramos(tramos, precioCarta, precioOferta) {
  if (tramos == null || tramos.length === 0) return [];

  const ordenados = [...tramos].sort((a, b) => (a.desde < b.desde ? -1 : 1));
  const vistos = new Set();
  let descuentoAnterior = 0;

  for (const tramo of ordenados) {
    if (!PATRON_HORA.test(tramo.desde)) {
      throw new ReglaNegocioError(`RN-11: "${tramo.desde}" no es una hora válida (formato HH:MM)`);
    }
    if (vistos.has(tramo.desde)) {
      throw new ReglaNegocioError(`RN-11: hay dos tramos que empiezan a las ${tramo.desde}`);
    }
    vistos.add(tramo.desde);

    if (!Number.isInteger(tramo.descuentoPct) || tramo.descuentoPct < 1 || tramo.descuentoPct > 99) {
      throw new ReglaNegocioError('RN-11: el descuento de un tramo debe ser un entero entre 1 y 99');
    }

    if (tramo.descuentoPct <= descuentoAnterior) {
      throw new ReglaNegocioError(
        `RN-11: el tramo de las ${tramo.desde} debe tener un descuento mayor al del tramo anterior (el precio solo puede bajar con la hora, nunca subir)`
      );
    }
    descuentoAnterior = tramo.descuentoPct;

    const precioTramo = calcularPrecioConDescuento(precioCarta, tramo.descuentoPct);
    if (!(precioTramo < Number(precioOferta))) {
      throw new ReglaNegocioError(
        `RN-11: el precio del tramo de las ${tramo.desde} (S/ ${precioTramo.toFixed(2)}) debe ser menor al precio de oferta (S/ ${Number(precioOferta).toFixed(2)})`
      );
    }
  }

  return ordenados.map(({ desde, descuentoPct }) => ({ desde, descuentoPct }));
}

export class Oferta {
  constructor({
    id,
    negocioId,
    negocioNombre,
    negocioDireccion,
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
    tramosPrecio,
  }) {
    this.id = id;
    this.negocioId = negocioId;
    this.negocioNombre = negocioNombre ?? null;
    this.negocioDireccion = negocioDireccion ?? null;
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
    this.tramosPrecio = tramosPrecio ?? [];
  }

  /**
   * RN-01: el precio de oferta debe ser menor que el precio de carta.
   * RN-03: la hora límite debe ser futura y la oferta debe tener al menos 1 unidad.
   */
  static publicar(datos, ahora) {
    const { negocioId, titulo, precioCarta, precioOferta, stock, horaElaboracion, horaLimite, tramosPrecio } = datos;

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
      tramosPrecio: validarTramos(tramosPrecio, precioCarta, precioOferta),
    });
  }

  /** RN-11: precio que paga el cliente ahora mismo, en hora de Lima. */
  precioVigente(ahora) {
    const tramo = this.#tramoActivo(ahora);
    if (!tramo) return Number(this.precioOferta);
    return calcularPrecioConDescuento(this.precioCarta, tramo.descuentoPct);
  }

  /** El próximo tramo que todavía no se activa (para avisar en la vitrina), o null. */
  proximoTramo(ahora) {
    const horaActual = horaMinutoLima(ahora);
    const siguiente = this.tramosPrecio.find((tramo) => tramo.desde > horaActual);
    if (!siguiente) return null;
    return { desde: siguiente.desde, precio: calcularPrecioConDescuento(this.precioCarta, siguiente.descuentoPct) };
  }

  #tramoActivo(ahora) {
    const horaActual = horaMinutoLima(ahora);
    let activo = null;
    for (const tramo of this.tramosPrecio) {
      if (tramo.desde <= horaActual) activo = tramo;
    }
    return activo;
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

  /** El dueño pausa o reanuda manualmente su oferta desde el panel. */
  cambiarEstado(nuevoEstado, ahora) {
    if (![EstadoOferta.ACTIVA, EstadoOferta.PAUSADA].includes(nuevoEstado)) {
      throw new ReglaNegocioError('Solo se puede cambiar una oferta a ACTIVA o PAUSADA');
    }
    if (![EstadoOferta.ACTIVA, EstadoOferta.PAUSADA].includes(this.estado)) {
      throw new ReglaNegocioError(`No se puede cambiar el estado de una oferta ${this.estado}`);
    }
    this.estado = nuevoEstado;
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
