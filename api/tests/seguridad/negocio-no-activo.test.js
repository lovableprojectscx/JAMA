import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from 'express';
import { poolDePruebas, crearNegocioDePrueba, crearOfertaDePrueba } from '../soporte/fixtures-pg.js';
import { construirPedidosReales } from '../soporte/wiring-real.js';
import { levantarServidor, enviarJson } from '../soporte/servidor-http.js';
import { crearApiOfertas } from '../../src/modulos/ofertas/index.js';
import { RelojSistema } from '../../src/compartido/infraestructura/relojes.js';
import { OfertaNoVigenteError } from '../../src/compartido/dominio/errores.js';
import { crearApp } from '../../src/api/app.js';
import { crearLimitarSolicitudes } from '../../src/api/middlewares/rate-limit.middleware.js';

// RN-13: un negocio PENDIENTE, RECHAZADO o SUSPENDIDO no aparece en la
// vitrina, no recibe pedidos y no publica, aunque tenga un token vigente.

let pool;
let servidor;
let negocioIdDelToken;

before(async () => {
  pool = poolDePruebas();
  const { apiNegocios } = construirPedidosReales(pool);
  // requireAuth de prueba: simula el token del negocio que indique cada prueba.
  const requireAuth = (req, res, next) => {
    req.usuario = { negocioId: negocioIdDelToken, rol: 'NEGOCIO' };
    next();
  };
  const apiOfertas = crearApiOfertas({ pool, reloj: new RelojSistema(), requireAuth, apiNegocios });

  servidor = await levantarServidor((app) => {
    app.use('/ofertas', apiOfertas.routerPublico);
    app.use('/negocios/me/ofertas', apiOfertas.routerNegocio);
  });
});

after(async () => {
  await servidor.cerrar();
  await pool.end();
});

for (const estado of ['PENDIENTE', 'RECHAZADO', 'SUSPENDIDO']) {
  test(`${estado}: su oferta no aparece en la vitrina y el detalle responde 404`, async () => {
    const activo = await crearNegocioDePrueba(pool);
    const noActivo = await crearNegocioDePrueba(pool, { estado });
    const ofertaVisible = await crearOfertaDePrueba(pool, activo.id);
    const ofertaOculta = await crearOfertaDePrueba(pool, noActivo.id);

    const listado = await enviarJson(`${servidor.url}/ofertas`, 'GET');
    const ids = listado.body.map((oferta) => oferta.id);
    assert.ok(ids.includes(ofertaVisible.id), 'la oferta del negocio ACTIVO sí debe verse');
    assert.ok(!ids.includes(ofertaOculta.id), `la oferta del negocio ${estado} no debe verse`);

    const detalle = await enviarJson(`${servidor.url}/ofertas/${ofertaOculta.id}`, 'GET');
    assert.equal(detalle.status, 404);
  });
}

test('SUSPENDIDO: no se puede pedir su oferta y el stock no se toca', async () => {
  const negocio = await crearNegocioDePrueba(pool);
  const oferta = await crearOfertaDePrueba(pool, negocio.id, { stock: 2 });
  // Se suspende después de publicar: la oferta ya existía y seguía ACTIVA.
  await pool.query(`UPDATE negocios SET estado = 'SUSPENDIDO' WHERE id = $1`, [negocio.id]);

  const { pedirOferta } = construirPedidosReales(pool);
  await assert.rejects(() => pedirOferta.ejecutar({ ofertaId: oferta.id }), OfertaNoVigenteError);

  const { rows } = await pool.query('SELECT stock FROM ofertas WHERE id = $1', [oferta.id]);
  assert.equal(rows[0].stock, 2);
  const codigos = await pool.query('SELECT 1 FROM codigos_canje WHERE oferta_id = $1', [oferta.id]);
  assert.equal(codigos.rows.length, 0);
});

test('PENDIENTE con un token: publicar responde 403 NEGOCIO_PENDIENTE y no crea la oferta', async () => {
  const negocio = await crearNegocioDePrueba(pool, { estado: 'PENDIENTE' });
  negocioIdDelToken = negocio.id;

  const ahora = Date.now();
  const { status, body } = await enviarJson(`${servidor.url}/negocios/me/ofertas`, 'POST', {
    titulo: 'Torta',
    precioCarta: 30,
    precioOferta: 15,
    stock: 2,
    horaElaboracion: new Date(ahora - 60 * 60_000).toISOString(),
    horaLimite: new Date(ahora + 60 * 60_000).toISOString(),
  });

  assert.equal(status, 403);
  assert.equal(body.codigo, 'NEGOCIO_PENDIENTE');
  const { rows } = await pool.query('SELECT 1 FROM ofertas WHERE negocio_id = $1', [negocio.id]);
  assert.equal(rows.length, 0);
});

test('Detrás del proxy de Vercel, el límite por IP cuenta a cada cliente por separado', async () => {
  // Regresión: sin `trust proxy`, todos los clientes compartían la IP del
  // proxy y un solo contador. Se usa la app real con routers mínimos.
  const vacio = Router();
  const solicitudes = Router();
  solicitudes.post('/', crearLimitarSolicitudes(), (req, res) => res.status(201).json({}));

  const app = crearApp({
    apiAcceso: { router: vacio },
    apiNegocios: { routerSolicitudes: solicitudes },
    apiOfertas: { routerPublico: vacio, routerNegocio: vacio },
    pedidosModule: { routerPublico: vacio, routerNegocio: vacio, routerMeNegocio: vacio },
    expirarReservas: { ejecutar: async () => ({}) },
  });
  const http = await new Promise((resolver) => {
    const s = app.listen(0, '127.0.0.1', () => resolver(s));
  });
  const url = `http://127.0.0.1:${http.address().port}/api/v1/negocios/solicitudes`;

  try {
    for (let i = 0; i < 5; i += 1) {
      const r = await enviarJson(url, 'POST', {}, { 'X-Forwarded-For': '200.1.1.1' });
      assert.equal(r.status, 201);
    }
    const sextaMismaIp = await enviarJson(url, 'POST', {}, { 'X-Forwarded-For': '200.1.1.1' });
    assert.equal(sextaMismaIp.status, 429);

    const otroCliente = await enviarJson(url, 'POST', {}, { 'X-Forwarded-For': '200.2.2.2' });
    assert.equal(otroCliente.status, 201);
  } finally {
    await new Promise((resolver) => http.close(resolver));
  }
});
