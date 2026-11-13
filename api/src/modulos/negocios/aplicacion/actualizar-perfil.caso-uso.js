import { NoEncontradoError } from '../../../compartido/dominio/errores.js';

export class ActualizarPerfil {
  constructor({ negocios }) {
    this.negocios = negocios;
  }

  /**
   * RF07 / HU18: edición de datos comerciales desde el panel del negocio.
   * RN-10: solo modifica el negocio autenticado.
   * RN-13: solo negocios ACTIVO.
   */
  async ejecutar({ negocioId, descripcion, direccion, yape, horarioAtencion, tipo, tipoDetalle }) {
    const negocio = await this.negocios.obtenerPorId(negocioId);
    if (!negocio) {
      throw new NoEncontradoError('Negocio no encontrado');
    }

    negocio.actualizarPerfil({ descripcion, direccion, yape, horarioAtencion, tipo, tipoDetalle });
    await this.negocios.guardarPerfil(negocio);

    return {
      id: negocio.id,
      nombre: negocio.nombre,
      slug: negocio.slug,
      tipo: negocio.tipo,
      tipoDetalle: negocio.tipoDetalle,
      descripcion: negocio.descripcion,
      direccion: negocio.direccion,
      yape: negocio.yape,
      horarioAtencion: negocio.horarioAtencion,
      logoUrl: negocio.logoUrl,
      portadaUrl: negocio.portadaUrl,
    };
  }
}
