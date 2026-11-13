import { NoEncontradoError } from '../../../compartido/dominio/errores.js';

export class ObtenerMiPerfil {
  constructor({ negocios }) {
    this.negocios = negocios;
  }

  async ejecutar({ negocioId }) {
    const negocio = await this.negocios.obtenerPorId(negocioId);
    if (!negocio) {
      throw new NoEncontradoError('Negocio no encontrado');
    }

    negocio.exigirQuePuedaOperar();

    return {
      id: negocio.id,
      nombre: negocio.nombre,
      responsable: negocio.responsable,
      tipo: negocio.tipo,
      tipoDetalle: negocio.tipoDetalle,
      slug: negocio.slug,
      logoUrl: negocio.logoUrl,
      portadaUrl: negocio.portadaUrl,
      descripcion: negocio.descripcion,
      direccion: negocio.direccion,
      horarioAtencion: negocio.horarioAtencion,
      whatsapp: negocio.whatsapp,
      yape: negocio.yape,
      email: negocio.email,
      estado: negocio.estado,
    };
  }
}
