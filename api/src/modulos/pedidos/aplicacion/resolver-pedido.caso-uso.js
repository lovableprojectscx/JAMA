import { NoEncontradoError, ReglaNegocioError } from '../../../compartido/dominio/errores.js';

export class ResolverPedido {
  constructor({ unidadDeTrabajo, reloj, codigos, reservaDeStock }) {
    this.unidadDeTrabajo = unidadDeTrabajo;
    this.reloj = reloj;
    this.codigos = codigos;
    this.reservaDeStock = reservaDeStock;
  }

  async ejecutar({ codigo, negocioId, concretado }) {
    return this.unidadDeTrabajo.ejecutar(async (tx) => {
      const ahora = this.reloj.ahora();
      const codigoCanje = await this.codigos.buscarPorCodigo(codigo, tx);

      // RN-10: un negocio solo opera sobre sus propios códigos.
      // Inexistente o de otro negocio responde igual: 404, nunca 403.
      if (!codigoCanje || !codigoCanje.perteneceA(negocioId)) {
        throw new NoEncontradoError('Código no encontrado');
      }

      // Corrección: si ya venció (aunque ExpirarReservas todavía no haya
      // corrido), no se puede confirmar ni rechazar; que expire el cron.
      if (codigoCanje.estaVencido(ahora)) {
        throw new ReglaNegocioError('El código ya venció');
      }

      if (concretado) {
        codigoCanje.marcarVendido(ahora);
      } else {
        codigoCanje.marcarNoConcretado(ahora);
        await this.reservaDeStock.liberar(codigoCanje.ofertaId, tx, ahora);
      }

      await this.codigos.guardar(codigoCanje, tx);
      return codigoCanje;
    });
  }
}
