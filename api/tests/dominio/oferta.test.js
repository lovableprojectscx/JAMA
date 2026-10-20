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

describe('Oferta.publicar tramos de precio (RN-11)', () => {
  test('rechaza un tramo con hora inválida', () => {
    assert.throws(
      () => Oferta.publicar(datosValidos({ tramosPrecio: [{ desde: '25:00', descuentoPct: 10 }] }), AHORA),
      ReglaNegocioError
    );
  });

  test('rechaza un descuento fuera de 1-99', () => {
    assert.throws(
      () => Oferta.publicar(datosValidos({ tramosPrecio: [{ desde: '17:00', descuentoPct: 100 }] }), AHORA),
      ReglaNegocioError
    );
  });

  test('rechaza dos tramos que empiezan a la misma hora', () => {
    assert.throws(
      () =>
        Oferta.publicar(
          datosValidos({
            tramosPrecio: [
              { desde: '17:00', descuentoPct: 60 },
              { desde: '17:00', descuentoPct: 70 },
            ],
          }),
          AHORA
        ),
      ReglaNegocioError
    );
  });

  test('ordena los tramos por hora sin importar el orden de entrada', () => {
    const oferta = Oferta.publicar(
      datosValidos({
        tramosPrecio: [
          { desde: '18:30', descuentoPct: 70 },
          { desde: '17:00', descuentoPct: 60 },
        ],
      }),
      AHORA
    );
    assert.deepEqual(
      oferta.tramosPrecio.map((t) => t.desde),
      ['17:00', '18:30']
    );
  });

  test('rechaza un tramo cuyo precio no es menor al precio de oferta fijo (el precio no puede subir)', () => {
    // carta 40, oferta 20: 17:00 con 30% de descuento da S/ 28, que es MAYOR al precio de oferta (20).
    assert.throws(
      () =>
        Oferta.publicar(
          datosValidos({
            precioCarta: 40,
            precioOferta: 20,
            tramosPrecio: [{ desde: '17:00', descuentoPct: 30 }],
          }),
          AHORA
        ),
      ReglaNegocioError
    );
  });

  test('rechaza tramos cuyo descuento no es estrictamente creciente en el tiempo (el precio no puede subir entre tramos)', () => {
    // carta 40, oferta 20: 17:00 (-30% => 28) ya se rechaza antes, así que usamos
    // descuentos que sí bajan del precio de oferta pero sin seguir subiendo el descuento:
    // 17:00 -50% (20) y 18:30 -40% (24): el segundo tramo es MÁS CARO que el primero.
    assert.throws(
      () =>
        Oferta.publicar(
          datosValidos({
            precioCarta: 40,
            precioOferta: 20,
            tramosPrecio: [
              { desde: '17:00', descuentoPct: 55 },
              { desde: '18:30', descuentoPct: 40 },
            ],
          }),
          AHORA
        ),
      ReglaNegocioError
    );
  });

  test('sin tramos, publica con tramosPrecio vacío', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    assert.deepEqual(oferta.tramosPrecio, []);
  });
});

describe('Oferta.precioVigente (RN-11, hora de Lima)', () => {
  const PUBLICADA_A_MEDIANOCHE = new Date('2026-10-20T00:00:00.000Z');

  function ofertaConTramos() {
    return Oferta.publicar(
      datosValidos({
        precioCarta: 20,
        precioOferta: 15,
        tramosPrecio: [
          { desde: '17:00', descuentoPct: 30 },
          { desde: '18:30', descuentoPct: 50 },
        ],
      }),
      PUBLICADA_A_MEDIANOCHE
    );
  }

  test('sin tramos, el precio vigente es el precio de oferta fijo', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    assert.equal(oferta.precioVigente(AHORA), oferta.precioOferta);
  });

  test('antes del primer tramo, usa el precio de oferta fijo', () => {
    const oferta = ofertaConTramos();
    // 16:00 de Lima = 21:00 UTC, antes del tramo de las 17:00.
    assert.equal(oferta.precioVigente(new Date('2026-10-20T21:00:00.000Z')), 15);
  });

  test('a las 17:15 de Lima (22:15 UTC) se aplica el tramo de las 17:00 (-30%)', () => {
    const oferta = ofertaConTramos();
    assert.equal(oferta.precioVigente(new Date('2026-10-20T22:15:00.000Z')), 14);
  });

  test('corrección: a las 18:45 de Lima (23:45 UTC) se aplica el tramo de las 18:30 (-50%)', () => {
    const oferta = ofertaConTramos();
    assert.equal(oferta.precioVigente(new Date('2026-10-20T23:45:00.000Z')), 10);
  });

  test('el precio vigente siempre es menor al precio de carta', () => {
    const oferta = ofertaConTramos();
    for (const instante of ['2026-10-20T21:00:00.000Z', '2026-10-20T22:15:00.000Z', '2026-10-20T23:45:00.000Z']) {
      assert.ok(oferta.precioVigente(new Date(instante)) < oferta.precioCarta);
    }
  });
});

describe('Oferta.proximoTramo', () => {
  const PUBLICADA_A_MEDIANOCHE = new Date('2026-10-20T00:00:00.000Z');

  function ofertaConTramos() {
    return Oferta.publicar(
      datosValidos({
        precioCarta: 20,
        precioOferta: 15,
        tramosPrecio: [
          { desde: '17:00', descuentoPct: 30 },
          { desde: '18:30', descuentoPct: 50 },
        ],
      }),
      PUBLICADA_A_MEDIANOCHE
    );
  }

  test('avisa la hora y el precio del siguiente tramo', () => {
    const oferta = ofertaConTramos();
    // 16:00 de Lima = 21:00 UTC: el próximo tramo es el de las 17:00.
    assert.deepEqual(oferta.proximoTramo(new Date('2026-10-20T21:00:00.000Z')), { desde: '17:00', precio: 14 });
  });

  test('corrección: a las 19:30 de Lima (00:30 UTC del día siguiente) ya no hay próximo tramo', () => {
    const oferta = ofertaConTramos();
    assert.equal(oferta.proximoTramo(new Date('2026-10-21T00:30:00.000Z')), null);
  });
});

describe('Oferta.cambiarEstado (panel: pausar / reanudar)', () => {
  test('pausa una oferta ACTIVA', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    oferta.cambiarEstado(EstadoOferta.PAUSADA, AHORA);
    assert.equal(oferta.estado, EstadoOferta.PAUSADA);
  });

  test('reanuda una oferta PAUSADA', () => {
    const oferta = Oferta.publicar(datosValidos(), AHORA);
    oferta.cambiarEstado(EstadoOferta.PAUSADA, AHORA);
    oferta.cambiarEstado(EstadoOferta.ACTIVA, AHORA);
    assert.equal(oferta.estado, EstadoOferta.ACTIVA);
  });

  test('no permite cambiar el estado de una oferta AGOTADA', () => {
    const oferta = Oferta.publicar(datosValidos({ stock: 1 }), AHORA);
    oferta.reservarUnidad(AHORA);
    assert.throws(() => oferta.cambiarEstado(EstadoOferta.PAUSADA, AHORA), ReglaNegocioError);
  });
});
