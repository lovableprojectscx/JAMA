import {
  NoEncontradoError,
  ReglaNegocioError,
  TransicionNoPermitidaError,
  NegocioNoHabilitadoError,
} from '../../../compartido/dominio/errores.js';

export class AdminNegociosController {
  constructor({ listarSolicitudes, resolverSolicitud, ofertasApiRef, reloj }) {
    this.listarSolicitudes = listarSolicitudes;
    this.resolverSolicitud = resolverSolicitud;
    this.ofertasApiRef = ofertasApiRef;
    this.reloj = reloj;
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

  async publicarOfertaParaNegocio(req, res, next) {
    try {
      const negocioId = req.params.id;
      const {
        titulo,
        descripcion,
        fotoUrl,
        precioCarta,
        precioOferta,
        stock,
        horaElaboracion,
        horaLimite,
        tramosPrecio,
      } = req.body ?? {};

      if (!this.ofertasApiRef?.current) {
        return res.status(500).json({ error: 'Módulo de ofertas no conectado' });
      }

      const oferta = await this.ofertasApiRef.current.publicarParaNegocio({
        negocioId,
        titulo,
        descripcion,
        fotoUrl,
        precioCarta: Number(precioCarta),
        precioOferta: Number(precioOferta),
        stock: Number(stock),
        horaElaboracion: new Date(horaElaboracion),
        horaLimite: new Date(horaLimite),
        tramosPrecio,
      });

      return res.status(201).json(oferta);
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof NegocioNoHabilitadoError) {
        return res.status(403).json({ error: error.message, codigo: error.codigo, motivo: error.motivo });
      }
      return next(error);
    }
  }

  async subirFotoOferta(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Debes enviar un archivo con el campo "foto"' });
      }
      if (!this.ofertasApiRef?.current) {
        return res.status(500).json({ error: 'Módulo de ofertas no conectado' });
      }
      const fotoUrl = await this.ofertasApiRef.current.subirFoto({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
      });
      return res.status(200).json({ fotoUrl });
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  }
}
