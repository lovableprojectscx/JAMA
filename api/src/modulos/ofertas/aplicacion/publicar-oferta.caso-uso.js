import { randomUUID } from 'node:crypto';
import { Oferta } from '../dominio/oferta.js';

export class PublicarOferta {
  constructor({ ofertas, reloj }) {
    this.ofertas = ofertas;
    this.reloj = reloj;
  }

  async ejecutar(datos) {
    const ahora = this.reloj.ahora();
    const oferta = Oferta.publicar({ id: randomUUID(), ...datos }, ahora);
    await this.ofertas.crear(oferta);
    return oferta;
  }
}
