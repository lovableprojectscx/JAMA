import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Oferta, EstadoOferta } from '../../src/modulos/ofertas/dominio/oferta.js';
import { ReglaNegocioError, OfertaAgotadaError, OfertaNoVigenteError } from '../../src/compartido/dominio/errores.js';

const AHORA = new Date('2026-10-20T18:00:00.000Z');
const EN_UNA_HORA = new Date(AHORA.getTime() + 60 * 60_000);
const HACE_UNA_HORA = new Date(AHORA.getTime() - 60 * 60_000);

function datosValidos(extra = {}) {
  return {
    negocioId: 'negocio-1',
    titulo: 'Torta de chocolate',
    descripcion: 'Rica',
    fotoUrl: 'http://x/foto.jpg',
    precioCarta: 50,
    precioOferta: 25,
    stock: 3,
    horaElaboracion: HACE_UNA_HORA,
    horaLimite: EN_UNA_HORA,
    ...extra,
  };
}

describe('Oferta.publicar', () => {
  test('RN-01: rechaza si el precio de oferta no es menor al de carta', () => {
    assert.throws(
      () => Oferta.publicar(datosValidos({ precioOferta: 50, precioCarta: 50 }), AHORA),
      ReglaNegocioError
    );
  });

  test('RN-03: rechaza stock menor a 1', () => {
    assert.throws(() => Oferta.publicar(datosValidos({ stock: 0 }), AHORA), ReglaNegocioError);
  });

  test('RN-03: rechaza hora límite no futura', () => {
    assert.throws(() => Oferta.publicar(datosValidos({ horaLimite: HACE_UNA_HORA }), AHORA), ReglaNegocioError);
  });

  test('publica una oferta válida como ACTIVA', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    assert.equal(oferta.estado, EstadoOferta.ACTIVA);
    assert.equal(oferta.stock, 3);
  });
});

describe('Oferta.reservarUnidad', () => {
  test('RN-05: descuenta una unidad si está vigente y con stock', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    oferta.reservarUnidad(AHORA);
    assert.equal(oferta.stock, 2);
    assert.equal(oferta.estado, EstadoOferta.ACTIVA);
  });

  test('pasa a AGOTADA cuando el stock llega a 0', () => {
    const oferta = Oferta.publicar(datosValidos({ stock: 1 }), AHORA);
    oferta.reservarUnidad(AHORA);
    assert.equal(oferta.stock, 0);
    assert.equal(oferta.estado, EstadoOferta.AGOTADA);
  });

  test('lanza OfertaAgotadaError sin stock', () => {
    const oferta = Oferta.publicar(datosValidos({ stock: 1 }), AHORA);
    oferta.reservarUnidad(AHORA);
    assert.throws(() => oferta.reservarUnidad(AHORA), OfertaAgotadaError);
  });

  test('lanza OfertaNoVigenteError si ya pasó la hora límite', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    assert.throws(() => oferta.reservarUnidad(new Date(EN_UNA_HORA.getTime() + 1)), OfertaNoVigenteError);
  });

  test('lanza OfertaNoVigenteError si está PAUSADA', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    oferta.estado = EstadoOferta.PAUSADA;
    assert.throws(() => oferta.reservarUnidad(AHORA), OfertaNoVigenteError);
  });
});

describe('Oferta.liberarUnidad', () => {
  test('RN-08: devuelve una unidad y reactiva una oferta AGOTADA', () => {
    const oferta = Oferta.publicar(datosValidos({ stock: 1 }), AHORA);
    oferta.reservarUnidad(AHORA);
    assert.equal(oferta.estado, EstadoOferta.AGOTADA);

    oferta.liberarUnidad(AHORA);
    assert.equal(oferta.stock, 1);
    assert.equal(oferta.estado, EstadoOferta.ACTIVA);
  });
});

describe('Oferta.estaVigente', () => {
  test('es vigente si está ACTIVA, con stock y dentro de hora', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    assert.equal(oferta.estaVigente(AHORA), true);
  });

  test('no es vigente pasada la hora límite', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    assert.equal(oferta.estaVigente(new Date(EN_UNA_HORA.getTime() + 1)), false);
  });
});
