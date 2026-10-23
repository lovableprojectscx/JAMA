export class ListarSolicitudes {
  constructor({ negocios }) {
    this.negocios = negocios;
  }

  async ejecutar({ estado = 'PENDIENTE' } = {}) {
    const lista = await this.negocios.listarPorEstado(estado);
    return lista.map((n) => ({
      id: n.id,
      nombre: n.nombre,
      responsable: n.responsable,
      tipo: n.tipo,
      whatsapp: n.whatsapp,
      yape: n.yape,
      direccion: n.direccion,
      email: n.email,
      estado: n.estado,
      creadoEn: n.creadoEn,
      revisadoEn: n.revisadoEn,
      revisadoPor: n.revisadoPor,
      motivoEstado: n.motivoEstado,
    }));
  }
}
