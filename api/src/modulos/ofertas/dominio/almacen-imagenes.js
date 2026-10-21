/**
 * Puerto: AlmacenImagenes (ADR-007).
 * La infraestructura implementa `subir` contra el proveedor que sea
 * (Supabase Storage hoy; Cloudinary o S3 mañana, sin tocar el caso de uso).
 */
export class AlmacenImagenes {
  // eslint-disable-next-line no-unused-vars
  async subir({ buffer, contentType, extension }) {
    throw new Error('AlmacenImagenes.subir() no implementado');
  }
}
