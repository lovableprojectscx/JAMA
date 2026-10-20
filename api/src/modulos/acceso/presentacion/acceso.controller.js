import { CredencialesInvalidasError } from '../../../compartido/dominio/errores.js';

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
      return next(error);
    }
  }
}
