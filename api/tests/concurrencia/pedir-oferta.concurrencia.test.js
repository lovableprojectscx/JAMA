import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { poolDePruebas, crearNegocioDePrueba, crearOfertaDePrueba } from '../soporte/fixtures-pg.js';
import { construirPedidosReales } from '../soporte/wiring-real.js';
import { OfertaAgotadaError } from '../../src/compartido/dominio/errores.js';

// Nota: cada prueba crea su propio negocio y oferta (UUID aleatorio) y
// filtra siempre por su propio oferta_id/negocio_id. No se usa TRUNCATE
// aquí a propósito: `node --test` puede ejecutar varios archivos de
// prueba en paralelo contra la misma base de datos jama_test, y un
// TRUNCATE global borraría las filas que otro archivo está usando.

let pool;

before(() => {
  pool = poolDePruebas();
});

after(async () => {
  await pool.end();
});

test(
  '50 pedidos simultáneos sobre 3 unidades de stock: exactamente 3 reservas, 0 sobreventas (ADR-003)',
  { timeout: 30_000 },
  async () => {
    const negocio = await crearNegocioDePrueba(pool);
    const oferta = await crearOfertaDePrueba(pool, negocio.id, { stock: 3 });

    const { pedirOferta } = construirPedidosReales(pool);

    const resultados = await Promise.allSettled(
      Array.from({ length: 50 }, () => pedirOferta.ejecutar({ ofertaId: oferta.id }))
    );

    const exitosos = resultados.filter((r) => r.status === 'fulfilled');
    const fallidos = resultados.filter((r) => r.status === 'rejected');

    assert.equal(exitosos.length, 3, 'deben reservarse exactamente 3 unidades');
    assert.equal(fallidos.length, 47, 'las 47 peticiones restantes deben rechazarse');
    assert.ok(
      fallidos.every((r) => r.reason instanceof OfertaAgotadaError),
      'todos los rechazos deben ser por falta de stock'
    );

    // Los 3 códigos generados deben ser distintos (sin colisiones).
    const codigosGenerados = new Set(exitosos.map((r) => r.value.codigo));
    assert.equal(codigosGenerados.size, 3);

    const { rows: filaOferta } = await pool.query('SELECT stock, estado FROM ofertas WHERE id = $1', [
      oferta.id,
    ]);
    assert.equal(filaOferta[0].stock, 0, 'el stock final en la base de datos debe ser 0');
    assert.equal(filaOferta[0].estado, 'AGOTADA');

    const { rows: codigosReservados } = await pool.query(
      `SELECT codigo FROM codigos_canje WHERE oferta_id = $1 AND estado = 'RESERVADO'`,
      [oferta.id]
    );
    assert.equal(codigosReservados.length, 3, 'debe haber exactamente 3 códigos RESERVADO en la base de datos');
  }
);
