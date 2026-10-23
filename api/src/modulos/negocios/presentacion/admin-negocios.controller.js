import {
  NoEncontradoError,
  ReglaNegocioError,
  TransicionNoPermitidaError,
} from '../../../compartido/dominio/errores.js';

export class AdminNegociosController {
  constructor({ listarSolicitudes, resolverSolicitud }) {
    this.listarSolicitudes = listarSolicitudes;
    this.resolverSolicitud = resolverSolicitud;
  }

  async listar(req, res, next) {
    try {
      const estado = req.query.estado ?? 'PENDIENTE';
      const lista = await this.listarSolicitudes.ejecutar({ estado });
      return res.status(200).json(lista);
    } catch (error) {
      return next(error);
    }
  }

  async resolver(req, res, next) {
    try {
      const { id } = req.params;
      const { accion, motivo } = req.body ?? {};
      const adminId = req.usuario?.adminId;

      const resultado = await this.resolverSolicitud.ejecutar({
        negocioId: id,
        adminId,
        accion,
        motivo,
      });

      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof TransicionNoPermitidaError) {
        return res.status(409).json({ error: error.message });
      }
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  }
}
