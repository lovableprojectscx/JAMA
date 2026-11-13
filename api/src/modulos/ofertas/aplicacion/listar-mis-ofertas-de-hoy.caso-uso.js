import { esMismoDiaLima } from '../../../compartido/dominio/fechas.js';

export class ListarMisOfertasDeHoy {
  constructor({ ofertas, reloj }) {
    this.ofertas = ofertas;
    this.reloj = reloj;
  }

  /**
   * "Hoy" es el día calendario de Lima de la hora de elaboración de la oferta.
   * Si filtro === 'todas', devuelve el historial de ofertas del comercio para permitir republicación.
   */
  async ejecutar({ negocioId, filtro = 'hoy' }) {
    const todas = await this.ofertas.listarPorNegocio(negocioId);
    if (filtro === 'todas') {
      return todas;
    }
    const ahora = this.reloj.ahora();
    return todas.filter((oferta) => esMismoDiaLima(oferta.horaElaboracion, ahora));
  }
}
