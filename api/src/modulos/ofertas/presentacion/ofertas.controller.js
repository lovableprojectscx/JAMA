import { ReglaNegocioError, NoEncontradoError } from '../../../compartido/dominio/errores.js';

function serializarOferta(oferta) {
  const descuento = Math.round((1 - oferta.precioOferta / oferta.precioCarta) * 100);
  return {
    id: oferta.id,
    titulo: oferta.titulo,
    descripcion: oferta.descripcion,
    fotoUrl: oferta.fotoUrl,
    precioCarta: oferta.precioCarta,
    precioOferta: oferta.precioOferta,
    porcentajeDescuento: descuento,
    stock: oferta.stock,
    horaElaboracion: oferta.horaElaboracion,
    horaLimite: oferta.horaLimite,
    estado: oferta.estado,
  };
}

export class OfertasController {
  constructor({ publicarOferta, listarOfertasVigentes, obtenerOferta }) {
    this.publicarOferta = publicarOferta;
    this.listarOfertasVigentes = listarOfertasVigentes;
    this.obtenerOferta = obtenerOferta;
  }

  async listar(req, res, next) {
    try {
      const ofertas = await this.listarOfertasVigentes.ejecutar();
      return res.status(200).json(ofertas.map(serializarOferta));
    } catch (error) {
      return next(error);
    }
  }

  async detalle(req, res, next) {
    try {
      const oferta = await this.obtenerOferta.ejecutar({ id: req.params.id });
      return res.status(200).json(serializarOferta(oferta));
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
      const { titulo, descripcion, fotoUrl, precioCarta, precioOferta, stock, horaElaboracion, horaLimite } =
        req.body ?? {};

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
      });

      return res.status(201).json(serializarOferta(oferta));
    } catch (error) {
      if (error instanceof ReglaNegocioError) {
        return res.status(400).json({ error: error.message });
      }
      return next(error);
    }
  }
}
