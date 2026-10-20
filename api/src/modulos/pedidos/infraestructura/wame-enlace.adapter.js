import { EnlaceMensajeria } from '../dominio/puertos.js';

export class WaMeEnlaceAdapter extends EnlaceMensajeria {
  generarEnlace(telefono, mensaje) {
    const soloDigitos = String(telefono).replace(/\D/g, '');
    return `https://wa.me/${soloDigitos}?text=${encodeURIComponent(mensaje)}`;
  }
}
