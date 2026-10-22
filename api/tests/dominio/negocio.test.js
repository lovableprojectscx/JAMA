import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Negocio, EstadoNegocio } from '../../src/modulos/negocios/dominio/negocio.js';
import {
  ReglaNegocioError,
  TransicionNoPermitidaError,
  NegocioNoHabilitadoError,
} from '../../src/compartido/dominio/errores.js';

const AHORA = new Date('2026-10-22T15:00:00.000Z');
const ADMIN = 'admin-1';

function solicitudValida(extra = {}) {
  return {
    id: 'negocio-1',
    nombre: '  Pastelería Dulce Huamanga ',
    responsable: 'Rosa Quispe',
    tipo: 'pasteleria',
    whatsapp: '987 654 321',
    direccion: 'Jr. Asamblea 220, Huamanga',
    yape: '',
    email: '  Rosa@Dulce.PE ',
    password: 'secreta123',
    declaracionAceptada: true,
    ...extra,
  };
}

function negocioEn(estado) {
  return new Negocio({ id: 'n', nombre: 'N', email: 'n@x.pe', whatsapp: '51911111111', estado });
}

describe('Negocio.solicitar (RN-15)', () => {
  test('crea el negocio PENDIENTE con los datos normalizados', () => {
    const negocio = Negocio.solicitar(solicitudValida(), AHORA);

    assert.equal(negocio.estado, EstadoNegocio.PENDIENTE);
    assert.equal(negocio.nombre, 'Pastelería Dulce Huamanga');
    assert.equal(negocio.tipo, 'PASTELERIA');
    assert.equal(negocio.email, 'rosa@dulce.pe');
    assert.equal(negocio.whatsapp, '51987654321');
    assert.equal(negocio.yape, null);
    assert.equal(negocio.declaracionAceptadaEn, AHORA);
    assert.equal(negocio.passwordHash, null);
    assert.equal(negocio.puedeOperar(), false);
  });

  test('acepta el WhatsApp con el 51 delante y lo guarda igual', () => {
    const negocio = Negocio.solicitar(solicitudValida({ whatsapp: '+51 987-654-321' }), AHORA);
    assert.equal(negocio.whatsapp, '51987654321');
  });

  test('guarda el Yape cuando viene', () => {
    const negocio = Negocio.solicitar(solicitudValida({ yape: '912345678' }), AHORA);
    assert.equal(negocio.yape, '912345678');
  });

  const casosInvalidos = [
    ['nombre muy corto', { nombre: 'A' }],
    ['sin responsable', { responsable: '' }],
    ['tipo no permitido (supermercado, RC09)', { tipo: 'SUPERMERCADO' }],
    ['WhatsApp fijo', { whatsapp: '066312345' }],
    ['WhatsApp de 8 dígitos', { whatsapp: '98765432' }],
    ['Yape inválido', { yape: '12345' }],
    ['dirección muy corta', { direccion: 'Jr' }],
    ['correo sin dominio', { email: 'rosa@' }],
    ['contraseña de 7 caracteres', { password: '1234567' }],
    ['sin aceptar la declaración (RC08)', { declaracionAceptada: false }],
  ];

  for (const [caso, cambio] of casosInvalidos) {
    test(`rechaza: ${caso}`, () => {
      assert.throws(() => Negocio.solicitar(solicitudValida(cambio), AHORA), ReglaNegocioError);
    });
  }
});

describe('Ciclo de vida del negocio (RN-14)', () => {
  test('PENDIENTE → ACTIVO al aprobar, registrando quién y cuándo', () => {
    const negocio = negocioEn('PENDIENTE');
    negocio.aprobar(ADMIN, AHORA);

    assert.equal(negocio.estado, 'ACTIVO');
    assert.equal(negocio.revisadoPor, ADMIN);
    assert.equal(negocio.revisadoEn, AHORA);
    assert.equal(negocio.puedeOperar(), true);
  });

  test('PENDIENTE → RECHAZADO guarda el motivo', () => {
    const negocio = negocioEn('PENDIENTE');
    negocio.rechazar(ADMIN, ' Los datos de contacto no responden ', AHORA);

    assert.equal(negocio.estado, 'RECHAZADO');
    assert.equal(negocio.motivoEstado, 'Los datos de contacto no responden');
  });

  test('rechazar sin motivo no está permitido', () => {
    assert.throws(() => negocioEn('PENDIENTE').rechazar(ADMIN, '  ', AHORA), ReglaNegocioError);
  });

  test('ACTIVO → SUSPENDIDO → ACTIVO', () => {
    const negocio = negocioEn('ACTIVO');
    negocio.suspender(ADMIN, 'Reporte de producto vencido', AHORA);
    assert.equal(negocio.estado, 'SUSPENDIDO');

    negocio.reactivar(ADMIN, AHORA);
    assert.equal(negocio.estado, 'ACTIVO');
    assert.equal(negocio.motivoEstado, null);
  });

  const prohibidas = [
    ['RECHAZADO', (n) => n.aprobar(ADMIN, AHORA)],
    ['ACTIVO', (n) => n.aprobar(ADMIN, AHORA)],
    ['ACTIVO', (n) => n.rechazar(ADMIN, 'motivo', AHORA)],
    ['PENDIENTE', (n) => n.suspender(ADMIN, 'motivo', AHORA)],
    ['SUSPENDIDO', (n) => n.rechazar(ADMIN, 'motivo', AHORA)],
  ];

  for (const [estado, accion] of prohibidas) {
    test(`no permite ${accion.toString().match(/n\.(\w+)/)[1]} desde ${estado}`, () => {
      const negocio = negocioEn(estado);
      assert.throws(() => accion(negocio), TransicionNoPermitidaError);
      assert.equal(negocio.estado, estado);
    });
  }
});

describe('Negocio.exigirQuePuedaOperar (RN-13)', () => {
  for (const estado of ['PENDIENTE', 'RECHAZADO', 'SUSPENDIDO']) {
    test(`un negocio ${estado} no puede operar y el error lleva su código`, () => {
      const negocio = negocioEn(estado);
      negocio.motivoEstado = estado === 'RECHAZADO' ? 'Fotos que no son del local' : null;

      assert.throws(
        () => negocio.exigirQuePuedaOperar(),
        (error) =>
          error instanceof NegocioNoHabilitadoError &&
          error.codigo === `NEGOCIO_${estado}` &&
          error.motivo === negocio.motivoEstado
      );
    });
  }

  test('un negocio ACTIVO sí puede operar', () => {
    assert.doesNotThrow(() => negocioEn('ACTIVO').exigirQuePuedaOperar());
  });
});
