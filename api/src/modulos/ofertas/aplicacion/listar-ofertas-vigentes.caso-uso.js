export class ListarOfertasVigentes {
  constructor({ ofertas, negocios, reloj }) {
    this.ofertas = ofertas;
    this.negocios = negocios;
    this.reloj = reloj;
  }

  /** RN-13: la vitrina solo muestra ofertas de negocios ACTIVO. */
  async ejecutar() {
    const ahora = this.reloj.ahora();
    if (typeof this.negocios.negociosActivosDetalle === 'function') {
      const listaNegocios = await this.negocios.negociosActivosDetalle();
      if (!listaNegocios || listaNegocios.length === 0) return [];
      const mapaNegocios = new Map(listaNegocios.map((n) => [n.id, n]));
      const ids = listaNegocios.map((n) => n.id);
      const ofertas = await this.ofertas.listarVigentes(ahora, ids);
      return ofertas.map((o) => {
        const info = mapaNegocios.get(o.negocioId);
        if (info) {
          o.negocioNombre = info.nombre;
          o.negocioDireccion = info.direccion;
        }
        return o;
      });
    }

    const negociosActivos = await this.negocios.idsActivos();
    if (negociosActivos.length === 0) return [];
    return this.ofertas.listarVigentes(ahora, negociosActivos);
  }
}
