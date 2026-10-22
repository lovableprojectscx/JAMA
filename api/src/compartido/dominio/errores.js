export class ErrorDominio extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = this.constructor.name;
  }
}

export class ReglaNegocioError extends ErrorDominio {}

export class OfertaAgotadaError extends ErrorDominio {
  constructor(mensaje = 'La oferta ya no tiene stock disponible') {
    super(mensaje);
  }
}

export class OfertaNoVigenteError extends ErrorDominio {
  constructor(mensaje = 'La oferta ya no está vigente') {
    super(mensaje);
  }
}

export class NoEncontradoError extends ErrorDominio {
  constructor(mensaje = 'No encontrado') {
    super(mensaje);
  }
}

export class CredencialesInvalidasError extends ErrorDominio {
  constructor(mensaje = 'Correo o contraseña inválidos') {
    super(mensaje);
  }
}

/** RN-14: el cambio de estado pedido no está permitido desde el estado actual. */
export class TransicionNoPermitidaError extends ReglaNegocioError {}

/** RN-16: ya existe un negocio con ese correo o ese WhatsApp. */
export class NegocioDuplicadoError extends ErrorDominio {
  constructor(campo) {
    super(
      campo === 'whatsapp'
        ? 'Ya hay un negocio registrado con ese número de WhatsApp'
        : 'Ya hay un negocio registrado con ese correo'
    );
    this.campo = campo;
  }
}

const MENSAJES_NO_HABILITADO = {
  PENDIENTE: 'Tu solicitud está en revisión. Te escribiremos por WhatsApp apenas esté aprobada.',
  RECHAZADO: 'Tu solicitud no fue aprobada.',
  SUSPENDIDO: 'Tu cuenta está suspendida. Escríbenos para revisar tu caso.',
};

/** RN-13: el negocio existe pero no está ACTIVO, así que no puede operar. */
export class NegocioNoHabilitadoError extends ErrorDominio {
  constructor(estado, motivo = null) {
    super(MENSAJES_NO_HABILITADO[estado] ?? 'Tu cuenta no está habilitada.');
    this.estado = estado;
    this.codigo = `NEGOCIO_${estado}`;
    this.motivo = motivo;
  }
}
