import bcrypt from 'bcrypt';
import { Hasher } from '../dominio/puertos.js';

const COSTO = 10;

export class BcryptHasher extends Hasher {
  async comparar(textoPlano, hash) {
    return bcrypt.compare(textoPlano, hash);
  }

  async hashear(textoPlano) {
    return bcrypt.hash(textoPlano, COSTO);
  }
}
