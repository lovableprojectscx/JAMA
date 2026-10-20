import bcrypt from 'bcrypt';
import { Hasher } from '../dominio/puertos.js';

export class BcryptHasher extends Hasher {
  async comparar(textoPlano, hash) {
    return bcrypt.compare(textoPlano, hash);
  }
}
