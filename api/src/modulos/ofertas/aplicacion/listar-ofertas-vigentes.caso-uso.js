export class ListarOfertasVigentes {
  constructor({ ofertas, reloj }) {
    this.ofertas = ofertas;
    this.reloj = reloj;
  }

  async ejecutar() {
    const ahora = this.reloj.ahora();
    return this.ofertas.listarVigentes(ahora);
  }
}
