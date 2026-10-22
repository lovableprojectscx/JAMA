import { NoEncontradoError, NegocioNoHabilitadoError } from '../../../compartido/dominio/errores.js';

export class ObtenerOferta {
  constructor({ ofertas, negocios }) {
    this.ofertas = ofertas;
    this.negocios = negocios;
  }

  async ejecutar({ id }) {
    const oferta = await this.ofertas.obtenerPorId(id);
    if (!oferta) {
      throw new NoEncontradoError('Oferta no encontrada');
    }

    // RN-13: la oferta de un negocio que no está ACTIVO no existe para el público.
    try {
      await this.negocios.exigirActivo(oferta.negocioId);
    } catch (error) {
      if (error instanceof NegocioNoHabilitadoError) {
        throw new NoEncontradoError('Oferta no encontrada');
      }
      throw error;
    }

    return oferta;
  }
}
