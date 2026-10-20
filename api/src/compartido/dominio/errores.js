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
