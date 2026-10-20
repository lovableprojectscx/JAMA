import { ReservaDeStock, ContactoNegocio } from '../dominio/puertos.js';

/** Traduce el puerto ReservaDeStock de Pedidos a la API pública de Ofertas. */
export class ReservaDeStockConOfertas extends ReservaDeStock {
  constructor(apiOfertas) {
    super();
    this.apiOfertas = apiOfertas;
  }

  async reservar(ofertaId, tx, ahora) {
    return this.apiOfertas.reservarUnidad(ofertaId, tx, ahora);
  }

  async liberar(ofertaId, tx, ahora) {
    return this.apiOfertas.liberarUnidad(ofertaId, tx, ahora);
  }
}

/** Traduce el puerto ContactoNegocio de Pedidos a la API pública de Negocios. */
export class ContactoNegocioConNegocios extends ContactoNegocio {
  constructor(apiNegocios) {
    super();
    this.apiNegocios = apiNegocios;
  }

  async obtenerContacto(negocioId, tx) {
    return this.apiNegocios.obtenerContacto(negocioId, tx);
  }
}
