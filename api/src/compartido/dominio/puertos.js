/**
 * Puerto: Reloj
 * Permite que el dominio y la aplicación pidan la hora actual sin depender
 * de `Date` directamente, para poder inyectar un reloj fijo en las pruebas.
 */
export class Reloj {
  ahora() {
    throw new Error('Reloj.ahora() no implementado');
  }
}

/**
 * Puerto: UnidadDeTrabajo
 * Representa una transacción. `ejecutar` recibe una función de trabajo y le
 * pasa un objeto `tx` que los repositorios usan para participar en la misma
 * transacción (BEGIN ... COMMIT / ROLLBACK).
 */
export class UnidadDeTrabajo {
  // eslint-disable-next-line no-unused-vars
  async ejecutar(trabajo) {
    throw new Error('UnidadDeTrabajo.ejecutar() no implementado');
  }
}
