import {
  NoEncontradoError,
  OfertaAgotadaError,
  OfertaNoVigenteError,
  ReglaNegocioError,
} from '../../../compartido/dominio/errores.js';

function serializarPedidoPorConfirmar({ codigoCanje, oferta, minutosRestantes }) {
  return {
    codigo: codigoCanje.codigo,
    precio: codigoCanje.precio,
    minutosRestantes,
    oferta: { id: oferta.id, titulo: oferta.titulo },
  };
}

export class PedidosController {
  constructor({ pedirOferta, resolverPedido, listarPedidosPorConfirmar }) {
    this.pedirOferta = pedirOferta;
    this.resolverPedido = resolverPedido;
    this.listarPedidosPorConfirmar = listarPedidosPorConfirmar;
  }

  async listarPorConfirmar(req, res, next) {
    try {
      const pedidos = await this.listarPedidosPorConfirmar.ejecutar({ negocioId: req.usuario.negocioId });
      return res.status(200).json(pedidos.map(serializarPedidoPorConfirmar));
    } catch (error) {
      return next(error);
    }
  }

  async pedir(req, res, next) {
    try {
      const { codigo, enlaceWhatsapp, expiraEn, precio, negocioNombre, negocioDireccion, enlaceMaps } =
        await this.pedirOferta.ejecutar({
          ofertaId: req.params.id,
        });
      return res.status(201).json({ codigo, enlaceWhatsapp, expiraEn, precio, negocioNombre, negocioDireccion, enlaceMaps });
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
