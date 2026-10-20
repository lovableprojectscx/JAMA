export class Login {
  constructor({ negocios, generadorToken }) {
    this.negocios = negocios;
    this.generadorToken = generadorToken;
  }

  async ejecutar({ email, password }) {
    const negocio = await this.negocios.verificarCredenciales({ email, password });
    const token = this.generadorToken.generar({
      negocioId: negocio.id,
      rol: 'NEGOCIO',
    });
    return { token, negocio };
  }
}
