import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { RelojFijo } from '../../src/compartido/infraestructura/relojes.js';
import { CodigoCanje, EstadoCodigo } from '../../src/modulos/pedidos/dominio/codigo-canje.js';
import { ResolverPedido } from '../../src/modulos/pedidos/aplicacion/resolver-pedido.caso-uso.js';
import { ReglaNegocioError } from '../../src/compartido/dominio/errores.js';

class UnidadDeTrabajoMemoria {
  async ejecutar(trabajo) {
    return trabajo({});
  }
}

class CodigosEnMemoria {
  constructor(codigos) {
    this.codigos = codigos;
  }

  async buscarPorCodigo(codigo) {
    return this.codigos.find((c) => c.codigo === codigo && c.estado === EstadoCodigo.RESERVADO) ?? null;
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

function construir(codigo, reloj) {
  return new ResolverPedido({
    unidadDeTrabajo: new UnidadDeTrabajoMemoria(),
    reloj,
    codigos: new CodigosEnMemoria([codigo]),
    reservaDeStock: new ReservaDeStockEspia(),
  });
}

describe('ResolverPedido: corrección del código ya vencido', () => {
  test('si expira_en ya pasó (aunque ExpirarReservas no haya corrido), responde con error y no marca vendido', async () => {
    const reloj = new RelojFijo(new Date('2026-10-20T18:00:00.000Z'));
    const codigo = CodigoCanje.reservar(
      { id: 'c-1', codigo: 'K7P2', ofertaId: 'of-1', negocioId: 'neg-1', precio: 10 },
      reloj.ahora()
    );
    const resolverPedido = construir(codigo, reloj);

    // Pasaron 30 min y 1 segundo: el código venció, pero sigue RESERVADO
    // en la "base de datos" porque la tarea programada todavía no corrió.
    reloj.avanzar(30 * 60_000 + 1000);

    await assert.rejects(
      () => resolverPedido.ejecutar({ codigo: 'K7P2', negocioId: 'neg-1', concretado: true }),
      ReglaNegocioError
    );
    assert.equal(codigo.estado, EstadoCodigo.RESERVADO, 'el código no debe quedar VENDIDO');
  });

  test('si expira_en ya pasó, tampoco se puede marcar "no vino"', async () => {
    const reloj = new RelojFijo(new Date('2026-10-20T18:00:00.000Z'));
    const codigo = CodigoCanje.reservar(
      { id: 'c-1', codigo: 'K7P2', ofertaId: 'of-1', negocioId: 'neg-1', precio: 10 },
      reloj.ahora()
    );
    const resolverPedido = construir(codigo, reloj);

    reloj.avanzar(30 * 60_000 + 1000);

    await assert.rejects(
      () => resolverPedido.ejecutar({ codigo: 'K7P2', negocioId: 'neg-1', concretado: false }),
      ReglaNegocioError
    );
    assert.equal(codigo.estado, EstadoCodigo.RESERVADO);
  });

  test('justo antes de vencer, sí se puede confirmar', async () => {
    const reloj = new RelojFijo(new Date('2026-10-20T18:00:00.000Z'));
    const codigo = CodigoCanje.reservar(
      { id: 'c-1', codigo: 'K7P2', ofertaId: 'of-1', negocioId: 'neg-1', precio: 10 },
      reloj.ahora()
    );
    const resolverPedido = construir(codigo, reloj);

    reloj.avanzar(30 * 60_000 - 1000);

    const resuelto = await resolverPedido.ejecutar({ codigo: 'K7P2', negocioId: 'neg-1', concretado: true });
    assert.equal(resuelto.estado, EstadoCodigo.VENDIDO);
  });
});
