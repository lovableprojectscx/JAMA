import { CredencialesInvalidasError } from '../../../compartido/dominio/errores.js';

export class VerificarCredenciales {
  constructor({ negocios, hasher }) {
    this.negocios = negocios;
    this.hasher = hasher;
  }

  async ejecutar({ email, password }) {
    const negocio = await this.negocios.obtenerPorEmail(email);
    if (!negocio) {
      throw new CredencialesInvalidasError();
    }

    const coincide = await this.hasher.comparar(password, negocio.passwordHash);
    if (!coincide) {
      throw new CredencialesInvalidasError();
    }

    // RN-13: el estado se revisa recién después de la contraseña, para no
    // revelarle a quien no la tiene si un correo está pendiente o rechazado.
    negocio.exigirQuePuedaOperar();

    return { id: negocio.id, nombre: negocio.nombre, whatsapp: negocio.whatsapp };
  }
}
