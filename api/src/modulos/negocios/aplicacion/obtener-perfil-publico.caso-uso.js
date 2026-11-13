import { NoEncontradoError } from '../../../compartido/dominio/errores.js';

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ObtenerPerfilPublico {
  constructor({ negocios, ofertasApi, reloj }) {
    this.negocios = negocios;
    this.ofertasApi = ofertasApi;
    this.reloj = reloj;
  }

  /**
   * RF24 / HU19: perfil público del negocio accesible por slug o id.
   * RN-13: si el negocio no está ACTIVO, responde 404 para no exponer datos.
   */
  async ejecutar({ slugOrId }) {
    const identificador = String(slugOrId ?? '').trim().toLowerCase();
    if (!identificador) {
      throw new NoEncontradoError('Tienda no encontrada');
    }

    let negocio = await this.negocios.obtenerPorSlug(identificador);
    if (!negocio && ES_UUID.test(identificador)) {
      negocio = await this.negocios.obtenerPorId(identificador);
    }

    if (!negocio || !negocio.puedeOperar()) {
      throw new NoEncontradoError('Tienda no encontrada');
    }

    const ahora = this.reloj.ahora();
    let ofertas = [];
    if (this.ofertasApi && typeof this.ofertasApi.listarVigentesPorNegocio === 'function') {
      ofertas = await this.ofertasApi.listarVigentesPorNegocio(negocio.id, ahora);
    }

    const queryMaps = encodeURIComponent(`${negocio.nombre} ${negocio.direccion} Huamanga Ayacucho`.trim());

    return {
      id: negocio.id,
      nombre: negocio.nombre,
      slug: negocio.slug,
      tipo: negocio.tipo,
      tipoDetalle: negocio.tipoDetalle,
      logoUrl: negocio.logoUrl,
      portadaUrl: negocio.portadaUrl,
      descripcion: negocio.descripcion,
      direccion: negocio.direccion,
      horarioAtencion: negocio.horarioAtencion,
      whatsapp: negocio.whatsapp,
      yape: negocio.yape,
      enlaceMaps: negocio.direccion ? `https://www.google.com/maps/search/?api=1&query=${queryMaps}` : null,
      ofertas: (ofertas ?? []).map((o) => {
        const precioVigente = typeof o.precioVigente === 'function' ? o.precioVigente(ahora) : o.precioOferta;
        const descuento = Math.round((1 - precioVigente / o.precioCarta) * 100);
        const proximoTramo = typeof o.proximoTramo === 'function' ? o.proximoTramo(ahora) : null;

        return {
          id: o.id,
          negocioId: negocio.id,
          negocioNombre: negocio.nombre,
          negocioDireccion: negocio.direccion,
          negocioSlug: negocio.slug,
          negocioLogoUrl: negocio.logoUrl,
          negocioTipo: negocio.tipo,
          zona: 'Centro',
          titulo: o.titulo,
          descripcion: o.descripcion,
          fotoUrl: o.fotoUrl,
          precioCarta: o.precioCarta,
          precioOferta: o.precioOferta,
          precioVigente,
          porcentajeDescuento: descuento,
          proximoTramo,
          stock: o.stock,
          horaElaboracion: o.horaElaboracion,
          horaLimite: o.horaLimite,
          estado: o.estado,
        };
      }),
    };
  }
}
