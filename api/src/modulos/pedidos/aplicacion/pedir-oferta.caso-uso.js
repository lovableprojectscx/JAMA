import { randomUUID } from 'node:crypto';
import { CodigoCanje } from '../dominio/codigo-canje.js';

const INTENTOS_MAX_CODIGO = 10;

export class PedirOferta {
  constructor({ unidadDeTrabajo, reloj, reservaDeStock, codigos, generadorCodigo, contactoNegocio, mensajeria }) {
    this.unidadDeTrabajo = unidadDeTrabajo;
    this.reloj = reloj;
    this.reservaDeStock = reservaDeStock;
    this.codigos = codigos;
    this.generadorCodigo = generadorCodigo;
    this.contactoNegocio = contactoNegocio;
    this.mensajeria = mensajeria;
  }

  async ejecutar({ ofertaId }) {
    return this.unidadDeTrabajo.ejecutar(async (tx) => {
      const ahora = this.reloj.ahora();

      // RN-05: reserva la unidad dentro de la misma transacción (ADR-003).
      const reserva = await this.reservaDeStock.reservar(ofertaId, tx, ahora);

      const codigo = await this.#codigoUnico(tx);
      const codigoCanje = CodigoCanje.reservar(
        { id: randomUUID(), codigo, ofertaId, negocioId: reserva.negocioId, precio: reserva.precioVigente },
        ahora
      );
      await this.codigos.guardar(codigoCanje, tx);

      const contacto = await this.contactoNegocio.obtenerContacto(reserva.negocioId, tx);

      // Flujo de Cobro Centralizado Concierge (JAMA Huamanga)
      const jamaWhatsapp = process.env.JAMA_WHATSAPP || '51987654321';
      const jamaYapeNumero = process.env.JAMA_YAPE_NUMERO || '987654321';
      const jamaYapeTitular = process.env.JAMA_YAPE_TITULAR || 'JAMA Huamanga';

      const precioFormateado = Number(codigoCanje.precio ?? 0).toFixed(2);
      const mensajeJama = `¡Hola JAMA! Quiero confirmar mi pedido y pagar con Yape:\n🛍️ Oferta: ${reserva.titulo}\n🏪 Local: ${contacto.nombre}\n💰 Monto a Yapear: S/ ${precioFormateado}\n🔑 Código de reserva: ${codigo}\n\nAdjunto mi comprobante para que me emitan mi orden de recojo.`;
      const enlaceWhatsapp = this.mensajeria.generarEnlace(jamaWhatsapp, mensajeJama);

      const mensajeTienda = `Hola ${contacto.nombre}, vi tu oferta "${reserva.titulo}" en JAMA. Quiero recogerla hoy. Mi código es ${codigo}.`;
      const enlaceWhatsappTienda = this.mensajeria.generarEnlace(contacto.whatsapp, mensajeTienda);

      const queryMaps = encodeURIComponent(`${contacto.nombre} ${contacto.direccion ?? ''} Huamanga Ayacucho`.trim());
      const enlaceMaps = contacto.direccion ? `https://www.google.com/maps/search/?api=1&query=${queryMaps}` : null;

      return {
        codigo,
        enlaceWhatsapp,
        enlaceWhatsappTienda,
        expiraEn: codigoCanje.expiraEn,
        precio: codigoCanje.precio,
        negocioNombre: contacto.nombre,
        negocioDireccion: contacto.direccion,
        enlaceMaps,
        pago: {
          yapeNumero: jamaYapeNumero,
          yapeTitular: jamaYapeTitular,
          monto: codigoCanje.precio,
        },
      };
    });
  }

  async #codigoUnico(tx) {
    for (let intento = 0; intento < INTENTOS_MAX_CODIGO; intento += 1) {
      const codigo = this.generadorCodigo.nuevo();
      const yaActivo = await this.codigos.existeCodigoActivo(codigo, tx);
      if (!yaActivo) return codigo;
    }
    throw new Error('No se pudo generar un código de canje único');
  }
}
