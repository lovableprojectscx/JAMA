export class ExpirarReservas {
  constructor({ unidadDeTrabajo, reloj, codigos, reservaDeStock }) {
    this.unidadDeTrabajo = unidadDeTrabajo;
    this.reloj = reloj;
    this.codigos = codigos;
    this.reservaDeStock = reservaDeStock;
  }

  /** RN-06/ADR-005: expira las reservas de 30 min o más y devuelve el stock. */
  async ejecutar() {
    return this.unidadDeTrabajo.ejecutar(async (tx) => {
      const ahora = this.reloj.ahora();
      const vencidos = await this.codigos.listarReservadosVencidos(ahora, tx);

      for (const codigoCanje of vencidos) {
        codigoCanje.marcarExpirado(ahora);
        await this.reservaDeStock.liberar(codigoCanje.ofertaId, tx, ahora);
        await this.codigos.guardar(codigoCanje, tx);
      }

      return { expirados: vencidos.length };
    });
  }
}
