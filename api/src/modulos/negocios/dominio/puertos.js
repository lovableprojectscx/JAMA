export class NegocioRepository {
  // eslint-disable-next-line no-unused-vars
  async obtenerPorEmail(email, tx) {
    throw new Error('NegocioRepository.obtenerPorEmail() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async obtenerPorId(id, tx) {
    throw new Error('NegocioRepository.obtenerPorId() no implementado');
  }

  /** RN-16: lanza NegocioDuplicadoError si el correo o el WhatsApp ya existen. */
  // eslint-disable-next-line no-unused-vars
  async crear(negocio) {
    throw new Error('NegocioRepository.crear() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async listarActivosConDetalle() {
    throw new Error('NegocioRepository.listarActivosConDetalle() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async listarIdsActivos() {
    throw new Error('NegocioRepository.listarIdsActivos() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async listarPorEstado(estado, tx) {
    throw new Error('NegocioRepository.listarPorEstado() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async guardarEstado(negocio, tx) {
    throw new Error('NegocioRepository.guardarEstado() no implementado');
  }
}

export class Hasher {
  // eslint-disable-next-line no-unused-vars
  async comparar(textoPlano, hash) {
    throw new Error('Hasher.comparar() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async hashear(textoPlano) {
    throw new Error('Hasher.hashear() no implementado');
  }
}
