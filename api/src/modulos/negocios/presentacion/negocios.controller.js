import {
  ReglaNegocioError,
  NegocioDuplicadoError,
  NoEncontradoError,
  NegocioNoHabilitadoError,
} from '../../../compartido/dominio/errores.js';

export class NegociosController {
  constructor({
    registrarSolicitud,
    obtenerPerfilPublico,
    obtenerMiPerfil,
    actualizarPerfil,
    subirFotoNegocio,
  }) {
    this.registrarSolicitud = registrarSolicitud;
    this.obtenerPerfilPublico = obtenerPerfilPublico;
    this._obtenerMiPerfil = obtenerMiPerfil;
    this.actualizarPerfil = actualizarPerfil;
    this.subirFotoNegocio = subirFotoNegocio;
  }

  async solicitar(req, res, next) {
    try {
      const {
        nombre,
        responsable,
        tipo,
        tipoDetalle,
        whatsapp,
        direccion,
        yape,
        email,
        password,
        declaracionAceptada,
      } = req.body ?? {};

      const negocio = await this.registrarSolicitud.ejecutar({
        nombre,
        responsable,
        tipo,
        tipoDetalle,
        whatsapp,
        direccion,
        yape,
        email,
        password,
        declaracionAceptada,
      });

      return res.status(201).json({ id: negocio.id, nombre: negocio.nombre, estado: negocio.estado, slug: negocio.slug });
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

  async obtenerPublico(req, res, next) {
    try {
      const { slugOrId } = req.params;
      const resultado = await this.obtenerPerfilPublico.ejecutar({ slugOrId });
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  }

  async obtenerMiPerfil(req, res, next) {
    try {
      const negocioId = req.usuario?.negocioId;
      const resultado = await this._obtenerMiPerfil.ejecutar({ negocioId });
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof NegocioNoHabilitadoError) {
        return res.status(403).json({ error: error.message, codigo: error.codigo });
      }
      return next(error);
    }
  }

  async actualizarMiPerfil(req, res, next) {
    try {
      const negocioId = req.usuario?.negocioId;
      const { descripcion, direccion, yape, horarioAtencion, tipo, tipoDetalle } = req.body ?? {};
      const resultado = await this.actualizarPerfil.ejecutar({
        negocioId,
        descripcion,
        direccion,
        yape,
        horarioAtencion,
        tipo,
        tipoDetalle,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      if (error instanceof NegocioNoHabilitadoError) {
        return res.status(403).json({ error: error.message, codigo: error.codigo });
      }
      return next(error);
    }
  }

  async subirPortada(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Debes seleccionar una imagen para la portada' });
      }
      const negocioId = req.usuario?.negocioId;
      const resultado = await this.subirFotoNegocio.ejecutar({
        negocioId,
        tipoFoto: 'portada',
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  }

  async subirLogo(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Debes seleccionar una imagen para el logotipo' });
      }
      const negocioId = req.usuario?.negocioId;
      const resultado = await this.subirFotoNegocio.ejecutar({
        negocioId,
        tipoFoto: 'logo',
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });
      return res.status(200).json(resultado);
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  }
}
