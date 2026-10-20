import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CodigoCanje, EstadoCodigo } from '../../src/modulos/pedidos/dominio/codigo-canje.js';
import { ReglaNegocioError } from '../../src/compartido/dominio/errores.js';

const AHORA = new Date('2026-10-20T18:00:00.000Z');

function nuevoCodigo() {
  return CodigoCanje.reservar(
    { id: 'c-1', codigo: 'K7P2', ofertaId: 'of-1', negocioId: 'neg-1' },
    AHORA
  );
}

describe('CodigoCanje.reservar', () => {
  test('RN-06: crea RESERVADO con vencimiento a los 30 minutos', () => {
    const codigo = nuevoCodigo();
    assert.equal(codigo.estado, EstadoCodigo.RESERVADO);
    assert.equal(codigo.expiraEn.getTime(), AHORA.getTime() + 30 * 60_000);
    assert.equal(codigo.historial.length, 1);
    assert.equal(codigo.historial[0].actor, 'CLIENTE');
  });
});

describe('CodigoCanje.perteneceA', () => {
  test('RN-10: identifica si el código es de un negocio dado', () => {
    const codigo = nuevoCodigo();
    assert.equal(codigo.perteneceA('neg-1'), true);
    assert.equal(codigo.perteneceA('otro-negocio'), false);
  });
});

describe('CodigoCanje.estaVencido', () => {
  test('vencido si sigue RESERVADO y ya pasó expiraEn', () => {
    const codigo = nuevoCodigo();
    assert.equal(codigo.estaVencido(AHORA), false);
    assert.equal(codigo.estaVencido(new Date(codigo.expiraEn.getTime() + 1)), true);
  });

  test('no vencido si ya no está RESERVADO, aunque pase el tiempo', () => {
    const codigo = nuevoCodigo();
    codigo.marcarVendido(AHORA);
    assert.equal(codigo.estaVencido(new Date(codigo.expiraEn.getTime() + 1)), false);
  });
});

describe('Máquina de estados RN-07 (solo una salida de RESERVADO)', () => {
  test('marcarVendido transiciona a VENDIDO', () => {
    const codigo = nuevoCodigo();
    codigo.marcarVendido(AHORA);
    assert.equal(codigo.estado, EstadoCodigo.VENDIDO);
    assert.equal(codigo.historial.at(-1).actor, 'NEGOCIO');
  });

  test('marcarNoConcretado transiciona a NO_CONCRETADO', () => {
    const codigo = nuevoCodigo();
    codigo.marcarNoConcretado(AHORA);
    assert.equal(codigo.estado, EstadoCodigo.NO_CONCRETADO);
  });

  test('marcarExpirado transiciona a EXPIRADO con actor SISTEMA', () => {
    const codigo = nuevoCodigo();
    codigo.marcarExpirado(AHORA);
    assert.equal(codigo.estado, EstadoCodigo.EXPIRADO);
    assert.equal(codigo.historial.at(-1).actor, 'SISTEMA');
  });

  test('no permite una segunda transición desde VENDIDO', () => {
    const codigo = nuevoCodigo();
    codigo.marcarVendido(AHORA);
    assert.throws(() => codigo.marcarNoConcretado(AHORA), ReglaNegocioError);
  });

  test('no permite una segunda transición desde EXPIRADO', () => {
    const codigo = nuevoCodigo();
    codigo.marcarExpirado(AHORA);
    assert.throws(() => codigo.marcarVendido(AHORA), ReglaNegocioError);
  });
});
