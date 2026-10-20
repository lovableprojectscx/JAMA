import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { poolDePruebas, crearNegocioDePrueba, crearOfertaDePrueba } from '../soporte/fixtures-pg.js';
import { construirPedidosReales } from '../soporte/wiring-real.js';
import { NoEncontradoError } from '../../src/compartido/dominio/errores.js';
import { PedidosController } from '../../src/modulos/pedidos/presentacion/pedidos.controller.js';

// Cada prueba usa negocios y ofertas con UUID propio; no se hace TRUNCATE
// global (ver nota en tests/concurrencia/pedir-oferta.concurrencia.test.js).

let pool;

before(() => {
  pool = poolDePruebas();
});

after(async () => {
  await pool.end();
});

function respuestaFalsa() {
  const res = {
    statusCode: null,
    body: null,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

test('RN-10: un negocio no puede confirmar el código de otro negocio (responde 404, no 403)', async () => {
  const negocioA = await crearNegocioDePrueba(pool, { email: 'a@jama.pe' });
  const negocioB = await crearNegocioDePrueba(pool, { email: 'b@jama.pe' });
  const ofertaDeA = await crearOfertaDePrueba(pool, negocioA.id, { stock: 1 });

  const { pedirOferta, resolverPedido } = construirPedidosReales(pool);
  const { codigo } = await pedirOferta.ejecutar({ ofertaId: ofertaDeA.id });

  // A nivel de caso de uso: negocio B intenta resolver el código de A.
  await assert.rejects(
    () => resolverPedido.ejecutar({ codigo, negocioId: negocioB.id, concretado: true }),
    NoEncontradoError
  );

  // El código sigue RESERVADO: el intento de B no debe haber cambiado nada.
  const { rows } = await pool.query('SELECT estado FROM codigos_canje WHERE codigo = $1', [codigo]);
  assert.equal(rows[0].estado, 'RESERVADO');

  // A nivel HTTP: el controlador debe responder 404 (nunca 403, ni revelar que existe).
  const controller = new PedidosController({ pedirOferta, resolverPedido });
  const req = { params: { codigo }, body: { concretado: true }, usuario: { negocioId: negocioB.id } };
  const res = respuestaFalsa();
  await controller.resolver(req, res, (err) => {
    throw err;
  });

  assert.equal(res.statusCode, 404);
  assert.notEqual(res.statusCode, 403);
});

test('el negocio dueño del código sí puede confirmarlo', async () => {
  const negocioA = await crearNegocioDePrueba(pool, { email: 'dueno@jama.pe' });
  const ofertaDeA = await crearOfertaDePrueba(pool, negocioA.id, { stock: 1 });

  const { pedirOferta, resolverPedido } = construirPedidosReales(pool);
  const { codigo } = await pedirOferta.ejecutar({ ofertaId: ofertaDeA.id });

  const resuelto = await resolverPedido.ejecutar({ codigo, negocioId: negocioA.id, concretado: true });
  assert.equal(resuelto.estado, 'VENDIDO');
});

test('un código inexistente también responde 404', async () => {
  const negocio = await crearNegocioDePrueba(pool);
  const { resolverPedido } = construirPedidosReales(pool);

  await assert.rejects(
    () => resolverPedido.ejecutar({ codigo: 'ZZZZ', negocioId: negocio.id, concretado: true }),
    NoEncontradoError
  );
});
