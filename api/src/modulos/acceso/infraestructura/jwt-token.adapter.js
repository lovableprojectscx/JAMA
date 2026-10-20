import jwt from 'jsonwebtoken';
import { GeneradorToken } from '../dominio/puertos.js';

export class JwtTokenAdapter extends GeneradorToken {
  constructor({ secreto, duracion = '12h' }) {
    super();
    this.secreto = secreto;
    this.duracion = duracion;
  }

  generar(payload) {
    return jwt.sign(payload, this.secreto, { expiresIn: this.duracion });
  }

  verificar(token) {
    return jwt.verify(token, this.secreto);
  }
}
