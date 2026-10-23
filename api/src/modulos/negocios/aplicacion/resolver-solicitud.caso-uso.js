import { NoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores.js';

export class ResolverSolicitud {
  constructor({ negocios, reloj }) {
    this.negocios = negocios;
    this.reloj = reloj;
  }

  async ejecutar({ negocioId, adminId, accion, motivo }) {
    if (!negocioId) {
      throw new ReglaNegocioError('Indica el ID del negocio');
    }
    const accionNormalizada = String(accion ?? '').trim().toUpperCase();
    if (accionNormalizada !== 'APROBAR' && accionNormalizada !== 'RECHAZAR') {
      throw new ReglaNegocioError("La acción debe ser 'APROBAR' o 'RECHAZAR'");
    }

    const negocio = await this.negocios.obtenerPorId(negocioId);
    if (!negocio) {
      throw new NoEncontradoError('Negocio no encontrado');
    }

    const ahora = this.reloj.ahora();
    if (accionNormalizada === 'APROBAR') {
      negocio.aprobar(adminId, ahora);
    } else {
      negocio.rechazar(adminId, motivo, ahora);
    }

    await this.negocios.guardarEstado(negocio);

    return {
      id: negocio.id,
      nombre: negocio.nombre,
      estado: negocio.estado,
      revisadoEn: negocio.revisadoEn,
      revisadoPor: negocio.revisadoPor,
      motivoEstado: negocio.motivoEstado,
    };
  }
}
