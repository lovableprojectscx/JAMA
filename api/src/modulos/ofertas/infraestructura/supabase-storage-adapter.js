import { randomUUID } from 'node:crypto';
import { AlmacenImagenes } from '../dominio/almacen-imagenes.js';

/** Nombre de archivo único para no pisar fotos de otras ofertas. */
export function construirNombreArchivo(extension, id = randomUUID()) {
  return `${id}.${extension}`;
}

function quitarBarraFinal(url) {
  return url?.replace(/\/$/, '') ?? '';
}

/** Endpoint de subida de la API de Storage de Supabase (requiere service role key). */
export function construirUrlSubida(url, bucket, nombreArchivo) {
  return `${quitarBarraFinal(url)}/storage/v1/object/${bucket}/${nombreArchivo}`;
}

/** URL pública y estable una vez subida (el bucket debe ser público). */
export function construirUrlPublica(url, bucket, nombreArchivo) {
  return `${quitarBarraFinal(url)}/storage/v1/object/public/${bucket}/${nombreArchivo}`;
}

export class SupabaseStorageAdapter extends AlmacenImagenes {
  constructor({ url, serviceRoleKey, bucket }) {
    super();
    this.url = url;
    this.serviceRoleKey = serviceRoleKey;
    this.bucket = bucket;
  }

  async subir({ buffer, contentType, extension }) {
    if (!this.url || !this.serviceRoleKey || !this.bucket) {
      throw new Error(
        'Supabase Storage no está configurado: define SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y SUPABASE_STORAGE_BUCKET'
      );
    }

    const nombreArchivo = construirNombreArchivo(extension);
    const respuesta = await fetch(construirUrlSubida(this.url, this.bucket, nombreArchivo), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.serviceRoleKey}`,
        apikey: this.serviceRoleKey,
        'Content-Type': contentType,
      },
      body: buffer,
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text().catch(() => '');
      throw new Error(`No se pudo subir la imagen a Supabase Storage (${respuesta.status}): ${detalle}`);
    }

    return { url: construirUrlPublica(this.url, this.bucket, nombreArchivo) };
  }
}
