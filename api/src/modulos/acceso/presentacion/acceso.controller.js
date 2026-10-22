import { CredencialesInvalidasError, NegocioNoHabilitadoError } from '../../../compartido/dominio/errores.js';

export class AccesoController {
  constructor({ login }) {
    this.login = login;
  }

  async iniciarSesion(req, res, next) {
    try {
      const { email, password } = req.body ?? {};
      if (!email || !password) {
        return res.status(400).json({ error: 'email y password son obligatorios' });
      }
      const resultado = await this.login.ejecutar({ email, password });
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof CredencialesInvalidasError) {
        return res.status(401).json({ error: error.message });
      }
      // RN-13 / RF20: la contraseña es correcta, pero el negocio no está ACTIVO.
      if (error instanceof NegocioNoHabilitadoError) {
        return res.status(403).json({ error: error.message, codigo: error.codigo, motivo: error.motivo });
      }
      return next(error);
    }
  }
}
