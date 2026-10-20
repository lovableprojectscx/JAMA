export class CodigoCanjeRepository {
  // eslint-disable-next-line no-unused-vars
  async guardar(codigoCanje, tx) {
    throw new Error('CodigoCanjeRepository.guardar() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async buscarPorCodigo(codigo, tx) {
    throw new Error('CodigoCanjeRepository.buscarPorCodigo() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async existeCodigoActivo(codigo, tx) {
    throw new Error('CodigoCanjeRepository.existeCodigoActivo() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async listarReservadosVencidos(ahora, tx) {
    throw new Error('CodigoCanjeRepository.listarReservadosVencidos() no implementado');
  }
}

/** Lo que Pedidos necesita de Ofertas, sin conocer su dominio. */
export class ReservaDeStock {
  // eslint-disable-next-line no-unused-vars
  async reservar(ofertaId, tx, ahora) {
    throw new Error('ReservaDeStock.reservar() no implementado');
  }

  // eslint-disable-next-line no-unused-vars
  async liberar(ofertaId, tx, ahora) {
    throw new Error('ReservaDeStock.liberar() no implementado');
  }
}

/** Lo que Pedidos necesita de Negocios. */
export class ContactoNegocio {
  // eslint-disable-next-line no-unused-vars
  async obtenerContacto(negocioId, tx) {
    throw new Error('ContactoNegocio.obtenerContacto() no implementado');
  }
}

export class EnlaceMensajeria {
  // eslint-disable-next-line no-unused-vars
  generarEnlace(telefono, mensaje) {
    throw new Error('EnlaceMensajeria.generarEnlace() no implementado');
  }
}

export class GeneradorCodigo {
  nuevo() {
    throw new Error('GeneradorCodigo.nuevo() no implementado');
  }
}
