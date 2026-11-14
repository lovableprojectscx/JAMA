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
  constructor({ pedirOferta, resolverPedido, listarPedidosPorConfirmar, obtenerMetricasNegocio, codigos }) {
    this.pedirOferta = pedirOferta;
    this.resolverPedido = resolverPedido;
    this.listarPedidosPorConfirmar = listarPedidosPorConfirmar;
    this.obtenerMetricasNegocio = obtenerMetricasNegocio;
    this.codigos = codigos;
  }

  async obtenerMetricas(req, res, next) {
    try {
      const periodo = req.query.periodo || 'mes';
      const metricas = await this.obtenerMetricasNegocio.ejecutar({
        negocioId: req.usuario.negocioId,
        periodo,
      });
      return res.status(200).json(metricas);
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
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
      const resultado = await this.pedirOferta.ejecutar({
        ofertaId: req.params.id,
      });
      return res.status(201).json(resultado);
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

  async listarAdmin(req, res, next) {
    try {
      const estado = req.query.estado || null;
      const limite = req.query.limite ? Number(req.query.limite) : 50;
      const pedidos = await this.codigos.listarParaAdmin({ estado, limite });
      return res.status(200).json(pedidos);
    } catch (error) {
      return next(error);
    }
  }

  async resolverAdmin(req, res, next) {
    try {
      const { concretado } = req.body ?? {};
      if (typeof concretado !== 'boolean') {
        return res.status(400).json({ error: 'concretado debe ser true o false' });
      }

      const codigoCanje = await this.resolverPedido.ejecutar({
        codigo: req.params.codigo,
        concretado,
        esAdmin: true,
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
