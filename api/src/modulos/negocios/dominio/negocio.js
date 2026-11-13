import {
  ReglaNegocioError,
  TransicionNoPermitidaError,
  NegocioNoHabilitadoError,
} from '../../../compartido/dominio/errores.js';

export const EstadoNegocio = Object.freeze({
  PENDIENTE: 'PENDIENTE',
  ACTIVO: 'ACTIVO',
  RECHAZADO: 'RECHAZADO',
  SUSPENDIDO: 'SUSPENDIDO',
});

/** RC09: el piloto no incluye supermercados; un "OTRO" lo revisa el administrador al aprobar. */
export const TIPOS_DE_NEGOCIO = Object.freeze([
  'PANADERIA',
  'PASTELERIA',
  'POLLERIA',
  'RESTAURANTE',
  'CAFETERIA',
  'OTRO',
]);

/** RN-14: a qué estados se puede pasar desde cada estado. RECHAZADO es final. */
const TRANSICIONES = Object.freeze({
  PENDIENTE: ['ACTIVO', 'RECHAZADO'],
  ACTIVO: ['SUSPENDIDO'],
  SUSPENDIDO: ['ACTIVO'],
  RECHAZADO: [],
});

const LARGO_MINIMO_CONTRASENA = 8;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function exigirLargo(valor, campo, minimo, maximo) {
  if (valor.length < minimo || valor.length > maximo) {
    throw new ReglaNegocioError(`RN-15: ${campo} debe tener entre ${minimo} y ${maximo} caracteres`);
  }
  return valor;
}

function limpiarRedSocial(valor) {
  if (typeof valor !== 'string') return null;
  let v = valor.trim();
  if (!v) return null;
  // Si introducen URL completa, quitamos el dominio y protocolo
  v = v.replace(/^https?:\/\/(www\.)?(instagram\.com\/?|facebook\.com\/?|tiktok\.com\/@?)/i, '');
  // Quitar @ inicial, slashes iniciales o finales
  v = v.replace(/^[@/]+/, '').replace(/\/+$/, '').trim();
  if (!v) return null;
  if (v.length > 60) {
    throw new ReglaNegocioError('El nombre de usuario de red social no debe superar 60 caracteres');
  }
  return v;
}

/** Celular peruano: 9 dígitos que empiezan en 9, con o sin el 51 delante. */
function nueveDigitosDeCelular(valor) {
  let digitos = String(valor ?? '').replace(/\D/g, '');
  if (digitos.length === 11 && digitos.startsWith('51')) digitos = digitos.slice(2);
  return /^9\d{8}$/.test(digitos) ? digitos : null;
}

function exigirMotivo(motivo) {
  const limpio = texto(motivo);
  if (limpio.length < 3 || limpio.length > 300) {
    throw new ReglaNegocioError('Indica un motivo de entre 3 y 300 caracteres');
  }
  return limpio;
}

export function generarSlug(nombre, id = '') {
  const base = String(nombre ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  if (!base) {
    const sufijo = id ? String(id).replace(/-/g, '').slice(0, 6) : 'local';
    return `tienda-${sufijo}`;
  }
  return base.slice(0, 80);
}

export class Negocio {
  constructor({
    id,
    nombre,
    email,
    passwordHash,
    whatsapp,
    yape,
    direccion,
    estado,
    responsable = null,
    tipo = null,
    tipoDetalle = null,
    declaracionAceptadaEn = null,
    creadoEn = null,
    revisadoEn = null,
    revisadoPor = null,
    motivoEstado = null,
    slug = null,
    logoUrl = null,
    portadaUrl = null,
    descripcion = null,
    horarioAtencion = null,
    instagram = null,
    facebook = null,
    tiktok = null,
  }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = passwordHash;
    this.whatsapp = whatsapp;
    this.yape = yape;
    this.direccion = direccion;
    this.estado = estado;
    this.responsable = responsable;
    this.tipo = tipo;
    this.tipoDetalle = tipoDetalle;
    this.declaracionAceptadaEn = declaracionAceptadaEn;
    this.creadoEn = creadoEn;
    this.revisadoEn = revisadoEn;
    this.revisadoPor = revisadoPor;
    this.motivoEstado = motivoEstado;
    this.slug = slug;
    this.logoUrl = logoUrl;
    this.portadaUrl = portadaUrl;
    this.descripcion = descripcion;
    this.horarioAtencion = horarioAtencion;
    this.instagram = instagram ?? null;
    this.facebook = facebook ?? null;
    this.tiktok = tiktok ?? null;
  }

  /**
   * RN-15: crea un negocio a partir de una solicitud pública. Queda PENDIENTE
   * hasta que un administrador lo apruebe (ADR-010). La contraseña solo se
   * valida aquí; el caso de uso guarda su hash con `conPasswordHash`.
   */
  static solicitar(datos, ahora) {
    const nombre = exigirLargo(texto(datos.nombre), 'El nombre del negocio', 2, 80);
    const responsable = exigirLargo(texto(datos.responsable), 'El nombre del responsable', 2, 80);
    const direccion = exigirLargo(texto(datos.direccion), 'La dirección', 5, 160);

    const tipo = texto(datos.tipo).toUpperCase();
    if (!TIPOS_DE_NEGOCIO.includes(tipo)) {
      throw new ReglaNegocioError('RN-15: elige un tipo de negocio válido');
    }

    // Con "OTRO" hay que decir qué es; con los demás tipos el detalle no aplica.
    const tipoDetalle =
      tipo === 'OTRO' ? exigirLargo(texto(datos.tipoDetalle), 'El tipo de negocio', 2, 60) : null;

    const whatsapp = nueveDigitosDeCelular(datos.whatsapp);
    if (!whatsapp) {
      throw new ReglaNegocioError('RN-15: el WhatsApp debe ser un celular de 9 dígitos que empiece en 9');
    }

    let yape = null;
    if (texto(datos.yape)) {
      yape = nueveDigitosDeCelular(datos.yape);
      if (!yape) {
        throw new ReglaNegocioError('RN-15: el número de Yape debe ser un celular de 9 dígitos que empiece en 9');
      }
    }

    const email = texto(datos.email).toLowerCase();
    if (!FORMATO_EMAIL.test(email) || email.length > 120) {
      throw new ReglaNegocioError('RN-15: el correo no es válido');
    }

    if (typeof datos.password !== 'string' || datos.password.length < LARGO_MINIMO_CONTRASENA) {
      throw new ReglaNegocioError(`RN-15: la contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`);
    }

    if (datos.declaracionAceptada !== true) {
      throw new ReglaNegocioError(
        'RN-15: debes aceptar que solo publicarás productos aptos para el consumo y dentro de su fecha'
      );
    }

    const slug = datos.slug ? texto(datos.slug).toLowerCase() : generarSlug(nombre, datos.id);

    return new Negocio({
      id: datos.id,
      nombre,
      responsable,
      tipo,
      tipoDetalle,
      direccion,
      email,
      passwordHash: null,
      whatsapp: `51${whatsapp}`,
      yape,
      estado: EstadoNegocio.PENDIENTE,
      declaracionAceptadaEn: ahora,
      creadoEn: ahora,
      slug,
      logoUrl: null,
      portadaUrl: null,
      descripcion: null,
      horarioAtencion: null,
    });
  }

  conPasswordHash(passwordHash) {
    this.passwordHash = passwordHash;
    return this;
  }

  /** RN-13: solo un negocio ACTIVO inicia sesión, publica y recibe pedidos. */
  puedeOperar() {
    return this.estado === EstadoNegocio.ACTIVO;
  }

  /** RN-13: lanza el error con el estado y el motivo, para que la interfaz los explique. */
  exigirQuePuedaOperar() {
    if (!this.puedeOperar()) {
      throw new NegocioNoHabilitadoError(this.estado, this.motivoEstado);
    }
  }

  actualizarPerfil({ descripcion, direccion, yape, horarioAtencion, tipo, tipoDetalle, instagram, facebook, tiktok }) {
    this.exigirQuePuedaOperar();
    if (typeof tipo !== 'undefined' && texto(tipo)) {
      const tipoLimpio = texto(tipo).toUpperCase();
      if (!TIPOS_DE_NEGOCIO.includes(tipoLimpio)) {
        throw new ReglaNegocioError(`RN-15: Tipo de negocio inválido. Opciones: ${TIPOS_DE_NEGOCIO.join(', ')}`);
      }
      this.tipo = tipoLimpio;
      if (this.tipo !== 'OTRO') {
        this.tipoDetalle = null;
      }
    }
    if (this.tipo === 'OTRO' && typeof tipoDetalle !== 'undefined') {
      const detalle = texto(tipoDetalle);
      if (detalle) {
        if (detalle.length < 2 || detalle.length > 60) {
          throw new ReglaNegocioError('RN-15: El detalle del tipo debe tener entre 2 y 60 caracteres');
        }
        this.tipoDetalle = detalle;
      }
    }
    if (typeof descripcion !== 'undefined') {
      this.descripcion = texto(descripcion).slice(0, 200) || null;
    }
    if (typeof direccion !== 'undefined' && texto(direccion)) {
      this.direccion = exigirLargo(texto(direccion), 'La dirección', 5, 160);
    }
    if (typeof yape !== 'undefined') {
      if (texto(yape)) {
        const yapeLimpio = nueveDigitosDeCelular(yape);
        if (!yapeLimpio) {
          throw new ReglaNegocioError('RN-15: el número de Yape debe ser un celular de 9 dígitos que empiece en 9');
        }
        this.yape = yapeLimpio;
      } else {
        this.yape = null;
      }
    }
    if (typeof horarioAtencion !== 'undefined') {
      this.horarioAtencion = texto(horarioAtencion).slice(0, 100) || null;
    }
    if (typeof instagram !== 'undefined') {
      this.instagram = limpiarRedSocial(instagram);
    }
    if (typeof facebook !== 'undefined') {
      this.facebook = limpiarRedSocial(facebook);
    }
    if (typeof tiktok !== 'undefined') {
      this.tiktok = limpiarRedSocial(tiktok);
    }
  }

  actualizarPortada(portadaUrl) {
    this.exigirQuePuedaOperar();
    if (!portadaUrl || typeof portadaUrl !== 'string') {
      throw new ReglaNegocioError('Indica una URL de portada válida');
    }
    this.portadaUrl = portadaUrl.trim();
  }

  actualizarLogo(logoUrl) {
    this.exigirQuePuedaOperar();
    if (!logoUrl || typeof logoUrl !== 'string') {
      throw new ReglaNegocioError('Indica una URL de logo válida');
    }
    this.logoUrl = logoUrl.trim();
  }

  aprobar(adminId, ahora) {
    this.#transicion(EstadoNegocio.ACTIVO, adminId, ahora, null);
  }

  rechazar(adminId, motivo, ahora) {
    this.#transicion(EstadoNegocio.RECHAZADO, adminId, ahora, exigirMotivo(motivo));
  }

  suspender(adminId, motivo, ahora) {
    this.#transicion(EstadoNegocio.SUSPENDIDO, adminId, ahora, exigirMotivo(motivo));
  }

  reactivar(adminId, ahora) {
    this.#transicion(EstadoNegocio.ACTIVO, adminId, ahora, null);
  }

  /** RN-14: única puerta para cambiar el estado; deja registrado quién y cuándo. */
  #transicion(nuevoEstado, adminId, ahora, motivo) {
    const permitidos = TRANSICIONES[this.estado] ?? [];
    if (!permitidos.includes(nuevoEstado)) {
      throw new TransicionNoPermitidaError(
        `RN-14: un negocio ${this.estado} no puede pasar a ${nuevoEstado}`
      );
    }
    this.estado = nuevoEstado;
    this.revisadoPor = adminId;
    this.revisadoEn = ahora;
    this.motivoEstado = motivo;
  }
}
