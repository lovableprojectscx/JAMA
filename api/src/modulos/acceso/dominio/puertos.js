export class GeneradorToken {
  // eslint-disable-next-line no-unused-vars
  generar(payload) {
    throw new Error('GeneradorToken.generar() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  verificar(token) {
    throw new Error('GeneradorToken.verificar() no implementado');
  }
}

export class AdminRepository {
  // eslint-disable-next-line no-unused-vars
  async obtenerPorEmail(email, tx) {
    throw new Error('AdminRepository.obtenerPorEmail() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async obtenerPorId(id, tx) {
    throw new Error('AdminRepository.obtenerPorId() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async crear({ nombre, email, passwordHash }, tx) {
    throw new Error('AdminRepository.crear() no implementado');
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
