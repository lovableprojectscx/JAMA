import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { ObtenerMetricasNegocio } from '../../src/modulos/pedidos/aplicacion/obtener-metricas-negocio.caso-uso.js';
import { ReglaNegocioError } from '../../src/compartido/dominio/errores.js';

class RelojFijo {
  constructor(fechaIso) {
    this.fecha = new Date(fechaIso);
  }
  ahora() {
    return this.fecha;
  }
}

class CodigoCanjeRepositoryFalso {
  constructor(datos) {
    this.datos = datos;
    this.llamadas = [];
  }

  async obtenerMetricas(negocioId, { desde, hasta }) {
    this.llamadas.push({ negocioId, desde, hasta });
    return this.datos;
  }
}

describe('ObtenerMetricasNegocio (RF18 / RF19 / HU09)', () => {
  const datosMock = {
    totalVendidos: 10,
    totalDineroRecuperado: 120.50,
    totalValorOriginal: 240.00,
    totalReservados: 2,
    totalNoConcretados: 1,
    totalExpirados: 1,
    totalPedidos: 14,
    topOfertas: [
      {
        id: 'oferta-1',
        titulo: 'Croissants de Mantequilla',
        fotoUrl: 'https://ejemplo.pe/croissant.jpg',
        racionesVendidas: 6,
        dineroRecuperado: 60.00,
      },
    ],
  };

  test('calcula KPIs económicos, de efectividad y ecológicos correctamente', async () => {
    const reloj = new RelojFijo('2026-11-13T23:30:00Z'); // 18:30 en Lima
    const codigos = new CodigoCanjeRepositoryFalso(datosMock);
    const casoUso = new ObtenerMetricasNegocio({ codigos, reloj });

    const resultado = await casoUso.ejecutar({ negocioId: 'negocio-1', periodo: 'mes' });

    assert.equal(resultado.periodo, 'mes');
    assert.equal(resultado.kpis.dineroRecuperado, 120.50);
    assert.equal(resultado.kpis.racionesRescatadas, 10);
    assert.equal(resultado.kpis.valorOriginal, 240.00);
    assert.equal(resultado.kpis.ahorroClientes, 119.50);
    assert.equal(resultado.kpis.descuentoPromedio, 50); // (119.50 / 240) * 100
    // 10 vendidos de 12 resueltos (10 + 1 + 1) = 83%
    assert.equal(resultado.kpis.tasaEfectividad, 83);

    // Impacto ambiental
    assert.equal(resultado.impactoAmbiental.co2EvitadoKg, 25.0); // 10 * 2.5
    assert.equal(resultado.impactoAmbiental.aguaAhorradaLitros, 8000); // 10 * 800

    // Top ofertas
    assert.equal(resultado.topOfertas.length, 1);
    assert.equal(resultado.topOfertas[0].titulo, 'Croissants de Mantequilla');
    assert.equal(resultado.topOfertas[0].racionesVendidas, 6);
  });

  test('soporta los periodos hoy, semana, mes e historico', async () => {
    const reloj = new RelojFijo('2026-11-13T23:30:00Z');
    const codigos = new CodigoCanjeRepositoryFalso(datosMock);
    const casoUso = new ObtenerMetricasNegocio({ codigos, reloj });

    // hoy
    await casoUso.ejecutar({ negocioId: 'negocio-1', periodo: 'hoy' });
    const llamadaHoy = codigos.llamadas.at(-1);
    assert.ok(llamadaHoy.desde instanceof Date);
    // 00:00:00 Lima del 13 de noviembre es 05:00:00 UTC
    assert.equal(llamadaHoy.desde.toISOString(), '2026-11-13T05:00:00.000Z');

    // historico
    await casoUso.ejecutar({ negocioId: 'negocio-1', periodo: 'historico' });
    const llamadaHistorico = codigos.llamadas.at(-1);
    assert.equal(llamadaHistorico.desde, null);
  });

  test('rechaza periodo inválido con ReglaNegocioError', async () => {
    const reloj = new RelojFijo('2026-11-13T23:30:00Z');
    const codigos = new CodigoCanjeRepositoryFalso(datosMock);
    const casoUso = new ObtenerMetricasNegocio({ codigos, reloj });

    await assert.rejects(
      () => casoUso.ejecutar({ negocioId: 'negocio-1', periodo: 'invalido' }),
      ReglaNegocioError
    );
  });

  test('rechaza petición sin negocioId con ReglaNegocioError', async () => {
    const reloj = new RelojFijo('2026-11-13T23:30:00Z');
    const codigos = new CodigoCanjeRepositoryFalso(datosMock);
    const casoUso = new ObtenerMetricasNegocio({ codigos, reloj });

    await assert.rejects(
      () => casoUso.ejecutar({ negocioId: null }),
      ReglaNegocioError
    );
  });
});
