import { NoEncontradoError } from '../../../compartido/dominio/errores.js';

/** RN-13: lo usan otros módulos antes de publicar o reservar a nombre de un negocio. */
export class VerificarNegocioActivo {
  constructor({ negocios }) {
    this.negocios = negocios;
  }

  async ejecutar({ negocioId }, tx) {
    const negocio = await this.negocios.obtenerPorId(negocioId, tx);
    if (!negocio) {
      throw new NoEncontradoError('Negocio no encontrado');
    }
    negocio.exigirQuePuedaOperar();
  }
}
