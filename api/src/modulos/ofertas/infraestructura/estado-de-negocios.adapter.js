import { EstadoDeNegocios } from '../dominio/estado-de-negocios.js';

/** Traduce el puerto EstadoDeNegocios de Ofertas a la API pública de Negocios. */
export class EstadoDeNegociosConNegocios extends EstadoDeNegocios {
  constructor(apiNegocios) {
    super();
    this.apiNegocios = apiNegocios;
  }

  async exigirActivo(negocioId, tx) {
    return this.apiNegocios.verificarNegocioActivo(negocioId, tx);
  }

  async negociosActivosDetalle() {
    return this.apiNegocios.negociosActivosDetalle();
  }

  async idsActivos() {
    return this.apiNegocios.idsDeNegociosActivos();
  }
}
