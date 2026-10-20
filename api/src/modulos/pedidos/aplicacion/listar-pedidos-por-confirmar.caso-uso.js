const MS_POR_MINUTO = 60_000;

export class ListarPedidosPorConfirmar {
  constructor({ codigos, reloj, resumenDeOfertas }) {
    this.codigos = codigos;
    this.reloj = reloj;
    this.resumenDeOfertas = resumenDeOfertas;
  }

  /** RN-10: solo los códigos RESERVADO del propio negocio, con los minutos que le quedan. */
  async ejecutar({ negocioId }) {
    const ahora = this.reloj.ahora();
    const reservados = await this.codigos.listarPorNegocioYEstado(negocioId, 'RESERVADO');

    const resultado = [];
    for (const codigoCanje of reservados) {
      const oferta = await this.resumenDeOfertas.obtenerResumen(codigoCanje.ofertaId);
      const minutosRestantes = Math.max(0, Math.ceil((codigoCanje.expiraEn - ahora) / MS_POR_MINUTO));
      resultado.push({ codigoCanje, oferta, minutosRestantes });
    }
    return resultado;
  }
}
