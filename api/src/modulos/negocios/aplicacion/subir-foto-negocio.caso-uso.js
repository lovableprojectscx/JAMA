import { ReglaNegocioError, NoEncontradoError } from '../../../compartido/dominio/errores.js';

const EXTENSION_POR_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class SubirFotoNegocio {
  constructor({ negocios, almacenImagenes }) {
    this.negocios = negocios;
    this.almacenImagenes = almacenImagenes;
  }

  /**
   * RN-18: la portada o logo debe ser JPG, PNG o WEBP.
   * RN-13: solo comercios ACTIVO.
   */
  async ejecutar({ negocioId, tipoFoto, buffer, mimeType }) {
    if (tipoFoto !== 'portada' && tipoFoto !== 'logo') {
      throw new ReglaNegocioError('El tipo de foto debe ser portada o logo');
    }

    const extension = EXTENSION_POR_MIME[mimeType];
    if (!extension) {
      throw new ReglaNegocioError('RN-18: la imagen debe ser JPG, PNG o WEBP');
    }

    const negocio = await this.negocios.obtenerPorId(negocioId);
    if (!negocio) {
      throw new NoEncontradoError('Negocio no encontrado');
    }

    negocio.exigirQuePuedaOperar();

    const { url } = await this.almacenImagenes.subir({ buffer, contentType: mimeType, extension });

    if (tipoFoto === 'portada') {
      negocio.actualizarPortada(url);
    } else {
      negocio.actualizarLogo(url);
    }

    await this.negocios.guardarPerfil(negocio);

    return { url };
  }
}
