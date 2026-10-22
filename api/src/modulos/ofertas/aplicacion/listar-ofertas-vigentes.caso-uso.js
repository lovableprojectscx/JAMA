export class ListarOfertasVigentes {
  constructor({ ofertas, negocios, reloj }) {
    this.ofertas = ofertas;
    this.negocios = negocios;
    this.reloj = reloj;
  }

  /** RN-13: la vitrina solo muestra ofertas de negocios ACTIVO. */
  async ejecutar() {
    const ahora = this.reloj.ahora();
    const negociosActivos = await this.negocios.idsActivos();
    if (negociosActivos.length === 0) return [];
    return this.ofertas.listarVigentes(ahora, negociosActivos);
  }
}
