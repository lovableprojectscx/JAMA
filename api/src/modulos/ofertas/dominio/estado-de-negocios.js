/**
 * Puerto: lo que Ofertas necesita saber del estado de los negocios (RN-13),
 * sin leer la tabla `negocios` (ADR-001). Lo implementa un adaptador sobre
 * la API pública del módulo Negocios.
 */
export class EstadoDeNegocios {
  /** Lanza NegocioNoHabilitadoError si el negocio no está ACTIVO. */
  // eslint-disable-next-line no-unused-vars
  async exigirActivo(negocioId, tx) {
    throw new Error('EstadoDeNegocios.exigirActivo() no implementado');
  }

  async negociosActivosDetalle() {
    throw new Error('EstadoDeNegocios.negociosActivosDetalle() no implementado');
  }

  async idsActivos() {
    throw new Error('EstadoDeNegocios.idsActivos() no implementado');
  }
}
