import { Reloj } from '../dominio/puertos.js';

export class RelojSistema extends Reloj {
  ahora() {
    return new Date();
  }
}

/**
 * Reloj fijo para pruebas: permite avanzar el tiempo sin esperar minutos
 * reales (p. ej. para probar la expiración de reservas a los 30 minutos).
 */
export class RelojFijo extends Reloj {
  constructor(fechaInicial = new Date()) {
    super();
    this.fecha = fechaInicial;
  }

  ahora() {
    return this.fecha;
  }

  avanzar(ms) {
    this.fecha = new Date(this.fecha.getTime() + ms);
  }

  fijar(fecha) {
    this.fecha = fecha;
  }
}
