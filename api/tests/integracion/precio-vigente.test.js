import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { poolDePruebas, crearNegocioDePrueba, crearOfertaDePrueba } from '../soporte/fixtures-pg.js';
import { construirPedidosReales } from '../soporte/wiring-real.js';
import { RelojFijo } from '../../src/compartido/infraestructura/relojes.js';

// Igual que el resto de pruebas de integración: cada prueba crea su propio
// negocio/oferta con UUID y no hace TRUNCATE global (ver nota en
// tests/concurrencia/pedir-oferta.concurrencia.test.js).

let pool;

before(() => {
  pool = poolDePruebas();
});

after(async () => {
  await pool.end();
});

test('el precio vigente al pedir (según el tramo activo) queda guardado en el código de canje', async () => {
  const negocio = await crearNegocioDePrueba(pool);
  const oferta = await crearOfertaDePrueba(pool, negocio.id, {
    precioCarta: 20,
    precioOferta: 15,
    stock: 2,
    horaElaboracion: new Date('2026-10-20T15:00:00.000Z'),
    horaLimite: new Date('2026-10-21T02:00:00.000Z'),
    tramosPrecio: [
      { desde: '17:00', descuentoPct: 30 },
      { desde: '18:30', descuentoPct: 50 },
    ],
  });

  // 18:45 de Lima = 23:45 UTC: ya está vigente el tramo de las 18:30 (-50%).
  const reloj = new RelojFijo(new Date('2026-10-20T23:45:00.000Z'));
  const { pedirOferta } = construirPedidosReales(pool, reloj);

  const { codigo, precio } = await pedirOferta.ejecutar({ ofertaId: oferta.id });
  assert.equal(precio, 10, '20 con 50% de descuento son 10');

  const { rows } = await pool.query('SELECT precio FROM codigos_canje WHERE codigo = $1', [codigo]);
  assert.equal(Number(rows[0].precio), 10, 'el precio debe quedar guardado en el código, no recalculado después');
});

test('sin tramos vigentes todavía, se guarda el precio de oferta fijo', async () => {
  const negocio = await crearNegocioDePrueba(pool);
  const oferta = await crearOfertaDePrueba(pool, negocio.id, {
    precioCarta: 20,
    precioOferta: 15,
    stock: 2,
    horaElaboracion: new Date('2026-10-20T15:00:00.000Z'),
    horaLimite: new Date('2026-10-21T02:00:00.000Z'),
    tramosPrecio: [{ desde: '18:30', descuentoPct: 50 }],
  });

  // 16:00 de Lima = 21:00 UTC: antes de las 18:30, todavía no hay tramo activo.
  const reloj = new RelojFijo(new Date('2026-10-20T21:00:00.000Z'));
  const { pedirOferta } = construirPedidosReales(pool, reloj);

  const { codigo, precio } = await pedirOferta.ejecutar({ ofertaId: oferta.id });
  assert.equal(precio, 15);

  const { rows } = await pool.query('SELECT precio FROM codigos_canje WHERE codigo = $1', [codigo]);
  assert.equal(Number(rows[0].precio), 15);
});
