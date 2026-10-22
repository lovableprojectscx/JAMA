import { randomUUID } from 'node:crypto';
import { Negocio } from '../dominio/negocio.js';

/** HU15 / RF19: un negocio se registra solo y queda PENDIENTE (ADR-010). */
export class RegistrarSolicitud {
  constructor({ negocios, hasher, reloj }) {
    this.negocios = negocios;
    this.hasher = hasher;
    this.reloj = reloj;
  }

  async ejecutar(datos) {
    const negocio = Negocio.solicitar({ ...datos, id: randomUUID() }, this.reloj.ahora());
    negocio.conPasswordHash(await this.hasher.hashear(datos.password));
    await this.negocios.crear(negocio);
    return negocio;
  }
}
