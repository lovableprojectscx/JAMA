import { CredencialesInvalidasError } from '../../../compartido/dominio/errores.js';

export class LoginAdmin {
  constructor({ administradores, hasher, generadorToken }) {
    this.administradores = administradores;
    this.hasher = hasher;
    this.generadorToken = generadorToken;
  }

  async ejecutar({ email, password }) {
    const emailNormalizado = String(email ?? '').trim().toLowerCase();
    const admin = await this.administradores.obtenerPorEmail(emailNormalizado);

    if (!admin) {
      throw new CredencialesInvalidasError('Correo o contraseña incorrectos');
    }

    const passwordValido = await this.hasher.comparar(password, admin.passwordHash);
    if (!passwordValido) {
      throw new CredencialesInvalidasError('Correo o contraseña incorrectos');
    }

    const token = this.generadorToken.generar({
      adminId: admin.id,
      rol: 'ADMIN',
      nombre: admin.nombre,
      email: admin.email,
    });

    return {
      token,
      admin: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
      },
    };
  }
}
