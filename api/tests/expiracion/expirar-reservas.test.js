import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RelojFijo } from '../../src/compartido/infraestructura/relojes.js';
import { CodigoCanje, EstadoCodigo } from '../../src/modulos/pedidos/dominio/codigo-canje.js';
import { ExpirarReservas } from '../../src/modulos/pedidos/aplicacion/expirar-reservas.caso-uso.js';

class UnidadDeTrabajoMemoria {
  async ejecutar(trabajo) {
    return trabajo({});
  }
}

class CodigosEnMemoria {
  constructor(codigos) {
    this.codigos = codigos;
  }

  async listarReservadosVencidos(ahora) {
    return this.codigos.filter((c) => c.estaVencido(ahora));
  }

  async guardar(codigoCanje) {
    const idx = this.codigos.findIndex((c) => c.id === codigoCanje.id);
    this.codigos[idx] = codigoCanje;
  }
}

class ReservaDeStockEspia {
  constructor() {
    this.liberadas = [];
  }

  async liberar(ofertaId) {
    this.liberadas.push(ofertaId);
  }
}

describe('ExpirarReservas con reloj inyectable', () => {
  test('antes de los 30 minutos todavía no expira', async () => {
    const reloj = new RelojFijo(new Date('2026-10-20T18:00:00.000Z'));
    const codigo = CodigoCanje.reservar({ id: 'c-1', codigo: 'K7P2', ofertaId: 'of-1', negocioId: 'n-1' }, reloj.ahora());
    const codigos = new CodigosEnMemoria([codigo]);
    const reservaDeStock = new ReservaDeStockEspia();
    const expirarReservas = new ExpirarReservas({
      unidadDeTrabajo: new UnidadDeTrabajoMemoria(),
      reloj,
      codigos,
      reservaDeStock,
    });

    reloj.avanzar(30 * 60_000 - 1000);
    const { expirados } = await expirarReservas.ejecutar();

    assert.equal(expirados, 0);
    assert.equal(codigo.estado, EstadoCodigo.RESERVADO);
  });

  test('pasado 30 minutos y 1 segundo, expira y libera el stock', async () => {
    const reloj = new RelojFijo(new Date('2026-10-20T18:00:00.000Z'));
    const codigo = CodigoCanje.reservar({ id: 'c-1', codigo: 'K7P2', ofertaId: 'of-1', negocioId: 'n-1' }, reloj.ahora());
    const codigos = new CodigosEnMemoria([codigo]);
    const reservaDeStock = new ReservaDeStockEspia();
    const expirarReservas = new ExpirarReservas({
      unidadDeTrabajo: new UnidadDeTrabajoMemoria(),
      reloj,
      codigos,
      reservaDeStock,
    });

    reloj.avanzar(30 * 60_000 + 1000);
    const { expirados } = await expirarReservas.ejecutar();

    assert.equal(expirados, 1);
    assert.equal(codigo.estado, EstadoCodigo.EXPIRADO);
    assert.deepEqual(reservaDeStock.liberadas, ['of-1']);
  });

  test('no toca códigos que ya no están RESERVADO', async () => {
    const reloj = new RelojFijo(new Date('2026-10-20T18:00:00.000Z'));
    const codigo = CodigoCanje.reservar({ id: 'c-1', codigo: 'K7P2', ofertaId: 'of-1', negocioId: 'n-1' }, reloj.ahora());
    codigo.marcarVendido(reloj.ahora());
    const codigos = new CodigosEnMemoria([codigo]);
    const expirarReservas = new ExpirarReservas({
      unidadDeTrabajo: new UnidadDeTrabajoMemoria(),
      reloj,
      codigos,
      reservaDeStock: new ReservaDeStockEspia(),
    });

    reloj.avanzar(60 * 60_000);
    const { expirados } = await expirarReservas.ejecutar();

    assert.equal(expirados, 0);
    assert.equal(codigo.estado, EstadoCodigo.VENDIDO);
  });
});
