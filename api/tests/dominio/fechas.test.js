import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { horaMinutoLima, fechaLimaYYYYMMDD, esMismoDiaLima } from '../../src/compartido/dominio/fechas.js';

describe('horaMinutoLima', () => {
  test('18:45 de Lima es 23:45 UTC', () => {
    assert.equal(horaMinutoLima(new Date('2026-10-20T23:45:00.000Z')), '18:45');
  });

  test('19:30 de Lima es 00:30 UTC del día siguiente', () => {
    assert.equal(horaMinutoLima(new Date('2026-10-21T00:30:00.000Z')), '19:30');
  });
});

describe('esMismoDiaLima', () => {
  test('corrección: a las 19:30 de Lima (00:30 UTC del día siguiente) sigue siendo el mismo día de la oferta', () => {
    const horaElaboracion = new Date('2026-10-20T15:00:00.000Z'); // 10:00 de Lima
    const ahora = new Date('2026-10-21T00:30:00.000Z'); // 19:30 de Lima, mismo día en Lima
    assert.equal(esMismoDiaLima(horaElaboracion, ahora), true);
  });

  test('el día calendario de UTC ya habría cambiado (por eso no basta con toISOString)', () => {
    const horaElaboracion = new Date('2026-10-20T15:00:00.000Z');
    const ahora = new Date('2026-10-21T00:30:00.000Z');

    assert.notEqual(horaElaboracion.toISOString().slice(0, 10), ahora.toISOString().slice(0, 10));
    assert.equal(fechaLimaYYYYMMDD(horaElaboracion), fechaLimaYYYYMMDD(ahora));
  });

  test('un día después en Lima sí es un día distinto', () => {
    const horaElaboracion = new Date('2026-10-20T15:00:00.000Z');
    const unDiaDespues = new Date('2026-10-21T15:00:00.000Z');
    assert.equal(esMismoDiaLima(horaElaboracion, unDiaDespues), false);
  });
});
