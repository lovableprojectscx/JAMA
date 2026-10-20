import { randomInt } from 'node:crypto';
import { GeneradorCodigo } from '../dominio/puertos.js';

// Sin caracteres ambiguos: 0/O, 1/I/L.
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LONGITUD = 4;

export class GeneradorCodigoAleatorio extends GeneradorCodigo {
  nuevo() {
    let codigo = '';
    for (let i = 0; i < LONGITUD; i += 1) {
      codigo += ALFABETO[randomInt(ALFABETO.length)];
    }
    return codigo;
  }
}
