import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { poolDePruebas, crearNegocioDePrueba, crearOfertaDePrueba } from '../soporte/fixtures-pg.js';
import { construirPedidosReales } from '../soporte/wiring-real.js';
import { NoEncontradoError } from '../../src/compartido/dominio/errores.js';
import { PedidosController } from '../../src/modulos/pedidos/presentacion/pedidos.controller.js';
import { RelojSistema } from '../../src/compartido/infraestructura/relojes.js';
import { OfertaRepositoryPg } from '../../src/modulos/ofertas/infraestructura/oferta-repository-pg.js';
import { ListarMisOfertasDeHoy } from '../../src/modulos/ofertas/aplicacion/listar-mis-ofertas-de-hoy.caso-uso.js';
import { CambiarEstadoDeOferta } from '../../src/modulos/ofertas/aplicacion/cambiar-estado-oferta.caso-uso.js';
import { OfertasController } from '../../src/modulos/ofertas/presentacion/ofertas.controller.js';
import { ListarPedidosPorConfirmar } from '../../src/modulos/pedidos/aplicacion/listar-pedidos-por-confirmar.caso-uso.js';
import { ResumenDeOfertasConOfertas } from '../../src/modulos/pedidos/infraestructura/modulos-vecinos.adapters.js';

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

// --- Aislamiento en los 3 endpoints nuevos del panel del negocio (Etapa 3) ---

function construirOfertasController(pool) {
  const reloj = new RelojSistema();
  const ofertaRepository = new OfertaRepositoryPg(pool);
  const listarMisOfertasDeHoy = new ListarMisOfertasDeHoy({ ofertas: ofertaRepository, reloj });
  const cambiarEstadoDeOferta = new CambiarEstadoDeOferta({ ofertas: ofertaRepository, reloj });
  const controller = new OfertasController({
    publicarOferta: null,
    listarOfertasVigentes: null,
    obtenerOferta: null,
    listarMisOfertasDeHoy,
    cambiarEstadoDeOferta,
    reloj,
  });
  return { controller, listarMisOfertasDeHoy, cambiarEstadoDeOferta };
}

test('GET /negocios/me/ofertas: negocio B no ve las ofertas de negocio A', async () => {
  const negocioA = await crearNegocioDePrueba(pool, { email: 'ofertas-a@jama.pe' });
  const negocioB = await crearNegocioDePrueba(pool, { email: 'ofertas-b@jama.pe' });
  await crearOfertaDePrueba(pool, negocioA.id, { horaElaboracion: new Date() });

  const { listarMisOfertasDeHoy } = construirOfertasController(pool);

  const ofertasDeB = await listarMisOfertasDeHoy.ejecutar({ negocioId: negocioB.id });
  assert.deepEqual(ofertasDeB, []);

  const ofertasDeA = await listarMisOfertasDeHoy.ejecutar({ negocioId: negocioA.id });
  assert.equal(ofertasDeA.length, 1);
});

test('PATCH /negocios/me/ofertas/:id: negocio B no puede pausar una oferta de negocio A (404, no 403)', async () => {
  const negocioA = await crearNegocioDePrueba(pool, { email: 'pausar-a@jama.pe' });
  const negocioB = await crearNegocioDePrueba(pool, { email: 'pausar-b@jama.pe' });
  const ofertaDeA = await crearOfertaDePrueba(pool, negocioA.id);

  const { controller, cambiarEstadoDeOferta } = construirOfertasController(pool);

  await assert.rejects(
    () => cambiarEstadoDeOferta.ejecutar({ id: ofertaDeA.id, negocioId: negocioB.id, nuevoEstado: 'PAUSADA' }),
    NoEncontradoError
  );

  const req = { params: { id: ofertaDeA.id }, body: { estado: 'PAUSADA' }, usuario: { negocioId: negocioB.id } };
  const res = respuestaFalsa();
  await controller.cambiarEstado(req, res, (err) => {
    throw err;
  });
  assert.equal(res.statusCode, 404);
  assert.notEqual(res.statusCode, 403);

  // La oferta de A sigue ACTIVA: el intento de B no debe haber cambiado nada.
  const { rows } = await pool.query('SELECT estado FROM ofertas WHERE id = $1', [ofertaDeA.id]);
  assert.equal(rows[0].estado, 'ACTIVA');
});

test('PATCH /negocios/me/ofertas/:id: el dueño sí puede pausar su propia oferta', async () => {
  const negocio = await crearNegocioDePrueba(pool, { email: 'pausar-dueno@jama.pe' });
  const oferta = await crearOfertaDePrueba(pool, negocio.id);

  const { cambiarEstadoDeOferta } = construirOfertasController(pool);
  const ofertaPausada = await cambiarEstadoDeOferta.ejecutar({
    id: oferta.id,
    negocioId: negocio.id,
    nuevoEstado: 'PAUSADA',
  });
  assert.equal(ofertaPausada.estado, 'PAUSADA');
});

test('GET /negocios/me/pedidos: negocio B no ve los códigos reservados de negocio A', async () => {
  const negocioA = await crearNegocioDePrueba(pool, { email: 'pedidos-a@jama.pe' });
  const negocioB = await crearNegocioDePrueba(pool, { email: 'pedidos-b@jama.pe' });
  const ofertaDeA = await crearOfertaDePrueba(pool, negocioA.id, { stock: 1 });

  const { pedirOferta, apiOfertas, codigos } = construirPedidosReales(pool);
  await pedirOferta.ejecutar({ ofertaId: ofertaDeA.id });

  const resumenDeOfertas = new ResumenDeOfertasConOfertas(apiOfertas);
  const listarPedidosPorConfirmar = new ListarPedidosPorConfirmar({
    codigos,
    reloj: new RelojSistema(),
    resumenDeOfertas,
  });

  const pedidosDeB = await listarPedidosPorConfirmar.ejecutar({ negocioId: negocioB.id });
  assert.deepEqual(pedidosDeB, []);

  const pedidosDeA = await listarPedidosPorConfirmar.ejecutar({ negocioId: negocioA.id });
  assert.equal(pedidosDeA.length, 1);
  assert.equal(pedidosDeA[0].oferta.id, ofertaDeA.id);
});
