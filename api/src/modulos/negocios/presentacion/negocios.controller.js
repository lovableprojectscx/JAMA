import { ReglaNegocioError, NegocioDuplicadoError } from '../../../compartido/dominio/errores.js';

export class NegociosController {
  constructor({ registrarSolicitud }) {
    this.registrarSolicitud = registrarSolicitud;
  }

  async solicitar(req, res, next) {
    try {
      const { nombre, responsable, tipo, whatsapp, direccion, yape, email, password, declaracionAceptada } =
        req.body ?? {};

      const negocio = await this.registrarSolicitud.ejecutar({
        nombre,
        responsable,
        tipo,
        whatsapp,
        direccion,
        yape,
        email,
        password,
        declaracionAceptada,
      });

      return res.status(201).json({ id: negocio.id, nombre: negocio.nombre, estado: negocio.estado });
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof NegocioDuplicadoError) {
        return res.status(409).json({ error: error.message, campo: error.campo });
      }
      return next(error);
    }
  }
}
