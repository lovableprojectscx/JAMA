import {
  NoEncontradoError,
  OfertaAgotadaError,
  OfertaNoVigenteError,
  ReglaNegocioError,
} from '../../../compartido/dominio/errores.js';

export class PedidosController {
  constructor({ pedirOferta, resolverPedido }) {
    this.pedirOferta = pedirOferta;
    this.resolverPedido = resolverPedido;
  }

  async pedir(req, res, next) {
    try {
      const { codigo, enlaceWhatsapp, expiraEn } = await this.pedirOferta.ejecutar({
        ofertaId: req.params.id,
      });
      return res.status(201).json({ codigo, enlaceWhatsapp, expiraEn });
    } catch (error) {
      if (error instanceof OfertaAgotadaError || error instanceof OfertaNoVigenteError) {
        return res.status(409).json({ error: error.message });
      }
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  }

  async resolver(req, res, next) {
    try {
      const { concretado } = req.body ?? {};
      if (typeof concretado !== 'boolean') {
        return res.status(400).json({ error: 'concretado debe ser true o false' });
      }

      const codigoCanje = await this.resolverPedido.ejecutar({
        codigo: req.params.codigo,
        negocioId: req.usuario.negocioId,
        concretado,
      });

      return res.status(200).json({ codigo: codigoCanje.codigo, estado: codigoCanje.estado });
    } catch (error) {
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof ReglaNegocioError) {
        return res.status(409).json({ error: error.message });
      }
      return next(error);
    }
  }
}
