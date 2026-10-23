import { NoEncontradoError } from '../../../compartido/dominio/errores.js';

export class ObtenerContacto {
  constructor({ negocios }) {
    this.negocios = negocios;
  }

  async ejecutar({ negocioId }, tx) {
    const negocio = await this.negocios.obtenerPorId(negocioId, tx);
    if (!negocio) {
      throw new NoEncontradoError('Negocio no encontrado');
    }
    return { id: negocio.id, nombre: negocio.nombre, whatsapp: negocio.whatsapp, direccion: negocio.direccion };
  }
}
