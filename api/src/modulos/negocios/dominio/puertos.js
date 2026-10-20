export class NegocioRepository {
  // eslint-disable-next-line no-unused-vars
  async obtenerPorEmail(email, tx) {
    throw new Error('NegocioRepository.obtenerPorEmail() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async obtenerPorId(id, tx) {
    throw new Error('NegocioRepository.obtenerPorId() no implementado');
  }
}

export class Hasher {
  // eslint-disable-next-line no-unused-vars
  async comparar(textoPlano, hash) {
    throw new Error('Hasher.comparar() no implementado');
  }
}
