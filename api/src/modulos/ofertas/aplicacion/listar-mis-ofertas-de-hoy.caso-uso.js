import { esMismoDiaLima } from '../../../compartido/dominio/fechas.js';

export class ListarMisOfertasDeHoy {
  constructor({ ofertas, reloj }) {
    this.ofertas = ofertas;
    this.reloj = reloj;
  }

  /** "Hoy" es el día calendario de Lima de la hora de elaboración de la oferta. */
  async ejecutar({ negocioId }) {
    const ahora = this.reloj.ahora();
    const todas = await this.ofertas.listarPorNegocio(negocioId);
    return todas.filter((oferta) => esMismoDiaLima(oferta.horaElaboracion, ahora));
  }
}
