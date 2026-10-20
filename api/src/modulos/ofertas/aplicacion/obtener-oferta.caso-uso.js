import { NoEncontradoError } from '../../../compartido/dominio/errores.js';

export class ObtenerOferta {
  constructor({ ofertas }) {
    this.ofertas = ofertas;
  }

  async ejecutar({ id }) {
    const oferta = await this.ofertas.obtenerPorId(id);
    if (!oferta) {
      throw new NoEncontradoError('Oferta no encontrada');
    }
    return oferta;
  }
}
