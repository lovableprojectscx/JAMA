import { ReglaNegocioError } from '../../../compartido/dominio/errores.js';

const EXTENSION_POR_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export class SubirFotoOferta {
  constructor({ almacenImagenes }) {
    this.almacenImagenes = almacenImagenes;
  }

  /** RN-12: la foto debe ser JPG, PNG o WEBP. El tamaño lo limita la API al recibirla. */
  async ejecutar({ buffer, mimeType }) {
    const extension = EXTENSION_POR_MIME[mimeType];
    if (!extension) {
      throw new ReglaNegocioError('RN-12: la foto debe ser una imagen JPG, PNG o WEBP');
    }

    const { url } = await this.almacenImagenes.subir({ buffer, contentType: mimeType, extension });
    return { fotoUrl: url };
  }
}
