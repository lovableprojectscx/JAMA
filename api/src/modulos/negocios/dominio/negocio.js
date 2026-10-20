export class Negocio {
  constructor({ id, nombre, email, passwordHash, whatsapp, yape, direccion, estado }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = passwordHash;
    this.whatsapp = whatsapp;
    this.yape = yape;
    this.direccion = direccion;
    this.estado = estado;
  }

  estaActivo() {
    return this.estado === 'ACTIVO';
  }
}
