import { NoEncontradoError } from '../../../compartido/dominio/errores.js';

export class EditarOferta {
  constructor({ ofertas, negocios, reloj }) {
    this.ofertas = ofertas;
    this.negocios = negocios;
    this.reloj = reloj;
  }

  /**
   * RF09: Permite al negocio editar una oferta propia.
   * RN-10: solo opera sobre una oferta del propio negocio (aislamiento).
   * RN-13: el negocio debe poder operar (ACTIVO).
   */
  async ejecutar({ id, negocioId, datos }) {
    if (this.negocios && typeof this.negocios.exigirActivo === 'function') {
      await this.negocios.exigirActivo(negocioId);
    }

    const ahora = this.reloj.ahora();
    const oferta = await this.ofertas.obtenerPorIdYNegocio(id, negocioId);
    if (!oferta) {
      throw new NoEncontradoError('Oferta no encontrada');
    }

    oferta.editar(datos, ahora);
    await this.ofertas.actualizar(oferta);
    return oferta;
  }
}
