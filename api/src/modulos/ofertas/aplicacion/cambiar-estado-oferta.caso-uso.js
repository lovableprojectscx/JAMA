import { NoEncontradoError } from '../../../compartido/dominio/errores.js';

export class CambiarEstadoDeOferta {
  constructor({ ofertas, reloj }) {
    this.ofertas = ofertas;
    this.reloj = reloj;
  }

  /** RN-10: solo opera sobre una oferta del propio negocio; si no, 404. */
  async ejecutar({ id, negocioId, nuevoEstado }) {
    const ahora = this.reloj.ahora();
    const oferta = await this.ofertas.obtenerPorIdYNegocio(id, negocioId);
    if (!oferta) {
      throw new NoEncontradoError('Oferta no encontrada');
    }

    oferta.cambiarEstado(nuevoEstado, ahora);
    await this.ofertas.guardar(oferta);
    return oferta;
  }
}
