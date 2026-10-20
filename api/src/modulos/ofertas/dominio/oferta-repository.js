export class OfertaRepository {
  // eslint-disable-next-line no-unused-vars
  async crear(oferta, tx) {
    throw new Error('OfertaRepository.crear() no implementado');
  }

  /** Debe bloquear la fila (SELECT ... FOR UPDATE) cuando se pasa `tx`. */
  // eslint-disable-next-line no-unused-vars
  async obtenerParaActualizar(id, tx) {
    throw new Error('OfertaRepository.obtenerParaActualizar() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async obtenerPorId(id) {
    throw new Error('OfertaRepository.obtenerPorId() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async guardar(oferta, tx) {
    throw new Error('OfertaRepository.guardar() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async listarVigentes(ahora) {
    throw new Error('OfertaRepository.listarVigentes() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async listarPorNegocio(negocioId) {
    throw new Error('OfertaRepository.listarPorNegocio() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async obtenerPorIdYNegocio(id, negocioId) {
    throw new Error('OfertaRepository.obtenerPorIdYNegocio() no implementado');
  }
}
