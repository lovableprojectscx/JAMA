import { ReglaNegocioError, NoEncontradoError, NegocioNoHabilitadoError } from '../../../compartido/dominio/errores.js';

/** Vitrina pública: precio vigente por tramo horario y aviso del próximo tramo. */
function serializarOferta(oferta, ahora) {
  const precioVigente = oferta.precioVigente(ahora);
  const descuento = Math.round((1 - precioVigente / oferta.precioCarta) * 100);
  const proximoTramo = oferta.proximoTramo(ahora);
  const nombre = oferta.negocioNombre || '';
  const dir = oferta.negocioDireccion || '';
  const queryMaps = encodeURIComponent(`${nombre} ${dir} Huamanga Ayacucho`.trim());

  return {
    id: oferta.id,
    negocioId: oferta.negocioId,
    negocioNombre: oferta.negocioNombre ?? null,
    negocioDireccion: oferta.negocioDireccion ?? null,
    zona: 'Centro',
    enlaceMaps: oferta.negocioDireccion
      ? `https://www.google.com/maps/search/?api=1&query=${queryMaps}`
      : null,
    titulo: oferta.titulo,
    descripcion: oferta.descripcion,
    fotoUrl: oferta.fotoUrl,
    precioCarta: oferta.precioCarta,
    precioOferta: oferta.precioOferta,
    precioVigente,
    porcentajeDescuento: descuento,
    proximoTramo,
    stock: oferta.stock,
    horaElaboracion: oferta.horaElaboracion,
    horaLimite: oferta.horaLimite,
    estado: oferta.estado,
  };
}

/** Panel del negocio: además del detalle público, incluye los tramos configurados. */
function serializarOfertaDeNegocio(oferta, ahora) {
  return { ...serializarOferta(oferta, ahora), tramosPrecio: oferta.tramosPrecio };
}

export class OfertasController {
  constructor({
    publicarOferta,
    listarOfertasVigentes,
    obtenerOferta,
    listarMisOfertasDeHoy,
    cambiarEstadoDeOferta,
    subirFotoOferta,
    reloj,
  }) {
    this.publicarOferta = publicarOferta;
    this.listarOfertasVigentes = listarOfertasVigentes;
    this.obtenerOferta = obtenerOferta;
    this.listarMisOfertasDeHoy = listarMisOfertasDeHoy;
    this.cambiarEstadoDeOferta = cambiarEstadoDeOferta;
    this.subirFotoOferta = subirFotoOferta;
    this.reloj = reloj;
  }

  async listar(req, res, next) {
    try {
      const ofertas = await this.listarOfertasVigentes.ejecutar();
      const ahora = this.reloj.ahora();
      return res.status(200).json(ofertas.map((oferta) => serializarOferta(oferta, ahora)));
    } catch (error) {
      return next(error);
    }
  }

  async detalle(req, res, next) {
    try {
      const oferta = await this.obtenerOferta.ejecutar({ id: req.params.id });
      return res.status(200).json(serializarOferta(oferta, this.reloj.ahora()));
    } catch (error) {
      if (error instanceof NoEncontradoError) {
        return res.status(404).json({ error: error.message });
      }
      return next(error);
    }
  }

  async publicar(req, res, next) {
    try {
      const negocioId = req.usuario.negocioId;
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

      const oferta = await this.publicarOferta.ejecutar({
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

      return res.status(201).json(serializarOfertaDeNegocio(oferta, this.reloj.ahora()));
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

  async listarMisDeHoy(req, res, next) {
    try {
      const dia = req.query.dia ?? 'hoy';
      if (dia !== 'hoy') {
        return res.status(400).json({ error: 'El parámetro dia solo acepta el valor "hoy"' });
      }

      const ofertas = await this.listarMisOfertasDeHoy.ejecutar({ negocioId: req.usuario.negocioId });
      const ahora = this.reloj.ahora();
      return res.status(200).json(ofertas.map((oferta) => serializarOfertaDeNegocio(oferta, ahora)));
    } catch (error) {
      return next(error);
    }
  }

  async subirFoto(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Debes adjuntar una foto' });
      }

      const { fotoUrl } = await this.subirFotoOferta.ejecutar({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
      });

      return res.status(201).json({ fotoUrl });
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  }

  async cambiarEstado(req, res, next) {
    try {
      const { estado } = req.body ?? {};
      if (estado !== 'ACTIVA' && estado !== 'PAUSADA') {
        return res.status(400).json({ error: 'estado debe ser ACTIVA o PAUSADA' });
      }

      const oferta = await this.cambiarEstadoDeOferta.ejecutar({
        id: req.params.id,
        negocioId: req.usuario.negocioId,
        nuevoEstado: estado,
      });

      return res.status(200).json(serializarOfertaDeNegocio(oferta, this.reloj.ahora()));
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
