import { randomUUID } from 'node:crypto';
import { Oferta } from '../dominio/oferta.js';

export class PublicarOferta {
  constructor({ ofertas, negocios, reloj }) {
    this.ofertas = ofertas;
    this.negocios = negocios;
    this.reloj = reloj;
  }

  async ejecutar(datos) {
    // RN-13: un negocio pendiente, rechazado o suspendido no publica, aunque
    // todavía tenga un token vigente de antes del cambio de estado.
    await this.negocios.exigirActivo(datos.negocioId);

    const ahora = this.reloj.ahora();
    const oferta = Oferta.publicar({ id: randomUUID(), ...datos }, ahora);
    await this.ofertas.crear(oferta);
    return oferta;
  }
}
