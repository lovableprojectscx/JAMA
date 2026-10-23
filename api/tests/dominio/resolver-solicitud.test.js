import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ResolverSolicitud } from '../../src/modulos/negocios/aplicacion/resolver-solicitud.caso-uso.js';
import { Negocio, EstadoNegocio } from '../../src/modulos/negocios/dominio/negocio.js';
import {
  NoEncontradoError,
  ReglaNegocioError,
  TransicionNoPermitidaError,
} from '../../src/compartido/dominio/errores.js';

class NegocioRepositoryFalso {
  constructor(negocios = []) {
    this.negocios = new Map(negocios.map((n) => [n.id, n]));
    this.guardados = [];
  }
  async obtenerPorId(id) {
    return this.negocios.get(id) ?? null;
  }
  async guardarEstado(negocio) {
    this.guardados.push(negocio);
  }
}

class RelojFalso {
  constructor(fecha) {
    this.fecha = fecha;
  }
  ahora() {
    return this.fecha;
  }
}

describe('ResolverSolicitud', () => {
  const ahora = new Date('2026-10-23T10:00:00Z');
  const reloj = new RelojFalso(ahora);

  function crearNegocioPendiente(id = 'negocio-1') {
    return new Negocio({
      id,
      nombre: 'Panadería Central',
      email: 'central@jama.pe',
      whatsapp: '51987654321',
      direccion: 'Jr. Lima 123',
      estado: EstadoNegocio.PENDIENTE,
    });
  }

  test('APROBAR: pasa a ACTIVO y registra revisadoPor y revisadoEn', async () => {
    const negocio = crearNegocioPendiente();
    const repo = new NegocioRepositoryFalso([negocio]);
    const casoUso = new ResolverSolicitud({ negocios: repo, reloj });

    const resultado = await casoUso.ejecutar({
      negocioId: 'negocio-1',
      adminId: 'admin-uuid-1',
      accion: 'APROBAR',
    });

    assert.equal(resultado.estado, EstadoNegocio.ACTIVO);
    assert.equal(resultado.revisadoPor, 'admin-uuid-1');
    assert.equal(resultado.revisadoEn, ahora);
    assert.equal(repo.guardados.length, 1);
  });

  test('RECHAZAR: pasa a RECHAZADO y guarda el motivo', async () => {
    const negocio = crearNegocioPendiente();
    const repo = new NegocioRepositoryFalso([negocio]);
    const casoUso = new ResolverSolicitud({ negocios: repo, reloj });

    const resultado = await casoUso.ejecutar({
      negocioId: 'negocio-1',
      adminId: 'admin-uuid-1',
      accion: 'RECHAZAR',
      motivo: 'Dirección fuera de la zona de reparto',
    });

    assert.equal(resultado.estado, EstadoNegocio.RECHAZADO);
    assert.equal(resultado.motivoEstado, 'Dirección fuera de la zona de reparto');
    assert.equal(resultado.revisadoPor, 'admin-uuid-1');
    assert.equal(resultado.revisadoEn, ahora);
  });

  test('RECHAZAR sin motivo lanza ReglaNegocioError', async () => {
    const negocio = crearNegocioPendiente();
    const repo = new NegocioRepositoryFalso([negocio]);
    const casoUso = new ResolverSolicitud({ negocios: repo, reloj });

    await assert.rejects(
      async () =>
        casoUso.ejecutar({
          negocioId: 'negocio-1',
          adminId: 'admin-uuid-1',
          accion: 'RECHAZAR',
          motivo: '',
        }),
      ReglaNegocioError
    );
  });

  test('con negocio inexistente lanza NoEncontradoError', async () => {
    const repo = new NegocioRepositoryFalso([]);
    const casoUso = new ResolverSolicitud({ negocios: repo, reloj });

    await assert.rejects(
      async () =>
        casoUso.ejecutar({
          negocioId: 'no-existe',
          adminId: 'admin-uuid-1',
          accion: 'APROBAR',
        }),
      NoEncontradoError
    );
  });

  test('con acción inválida lanza ReglaNegocioError', async () => {
    const negocio = crearNegocioPendiente();
    const repo = new NegocioRepositoryFalso([negocio]);
    const casoUso = new ResolverSolicitud({ negocios: repo, reloj });

    await assert.rejects(
      async () =>
        casoUso.ejecutar({
          negocioId: 'negocio-1',
          adminId: 'admin-uuid-1',
          accion: 'DESCONOCIDA',
        }),
      ReglaNegocioError
    );
  });

  test('RN-14: no permite aprobar un negocio ya RECHAZADO', async () => {
    const negocio = new Negocio({
      id: 'negocio-rechazado',
      nombre: 'Rechazado',
      estado: EstadoNegocio.RECHAZADO,
    });
    const repo = new NegocioRepositoryFalso([negocio]);
    const casoUso = new ResolverSolicitud({ negocios: repo, reloj });

    await assert.rejects(
      async () =>
        casoUso.ejecutar({
          negocioId: 'negocio-rechazado',
          adminId: 'admin-uuid-1',
          accion: 'APROBAR',
        }),
      TransicionNoPermitidaError
    );
  });
});
