import { ReglaNegocioError } from '../../../compartido/dominio/errores.js';

function inicioDeHoyLima(ahora) {
  const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [año, mes, dia] = formateador.format(ahora).split('-').map(Number);
  return new Date(Date.UTC(año, mes - 1, dia, 5, 0, 0));
}

function inicioDeMesLima(ahora) {
  const formateador = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
  });
  const [año, mes] = formateador.format(ahora).split('-').map(Number);
  return new Date(Date.UTC(año, mes - 1, 1, 5, 0, 0));
}

export class ObtenerMetricasNegocio {
  constructor({ codigos, reloj }) {
    this.codigos = codigos;
    this.reloj = reloj;
  }

  /**
   * RF18 / RF19 / HU09: Obtiene el resumen de métricas e impacto comercial del negocio.
   * Periodos admitidos: 'hoy', 'semana', 'mes', 'historico'.
   */
  async ejecutar({ negocioId, periodo = 'mes' }) {
    if (!negocioId) {
      throw new ReglaNegocioError('Se requiere el identificador del negocio');
    }

    const ahora = this.reloj.ahora();
    let desde = null;
    const hasta = ahora;

    switch (periodo) {
      case 'hoy':
        desde = inicioDeHoyLima(ahora);
        break;
      case 'semana':
        desde = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'mes':
        desde = inicioDeMesLima(ahora);
        break;
      case 'historico':
        desde = null;
        break;
      default:
        throw new ReglaNegocioError(`Periodo no válido: ${periodo}. Debe ser hoy, semana, mes o historico.`);
    }

    const raw = await this.codigos.obtenerMetricas(negocioId, { desde, hasta });

    const pedidosResueltos = raw.totalVendidos + raw.totalNoConcretados + raw.totalExpirados;
    const tasaEfectividad = pedidosResueltos > 0
      ? Math.round((raw.totalVendidos / pedidosResueltos) * 100)
      : 100;

    const ahorroClientes = Number(Math.max(0, raw.totalValorOriginal - raw.totalDineroRecuperado).toFixed(2));
    const descuentoPromedio = raw.totalValorOriginal > 0
      ? Math.round((ahorroClientes / raw.totalValorOriginal) * 100)
      : 0;

    return {
      periodo,
      rango: {
        desde: desde ? desde.toISOString() : null,
        hasta: hasta.toISOString(),
      },
      kpis: {
        dineroRecuperado: Number(raw.totalDineroRecuperado.toFixed(2)),
        racionesRescatadas: raw.totalVendidos,
        valorOriginal: Number(raw.totalValorOriginal.toFixed(2)),
        ahorroClientes,
        descuentoPromedio,
        tasaEfectividad,
      },
      pedidosPorEstado: {
        vendidos: raw.totalVendidos,
        reservados: raw.totalReservados,
        noConcretados: raw.totalNoConcretados,
        expirados: raw.totalExpirados,
        total: raw.totalPedidos,
      },
      impactoAmbiental: {
        co2EvitadoKg: Number((raw.totalVendidos * 2.5).toFixed(1)),
        aguaAhorradaLitros: Math.round(raw.totalVendidos * 800),
      },
      topOfertas: raw.topOfertas.map((o) => ({
        id: o.id,
        titulo: o.titulo,
        fotoUrl: o.fotoUrl,
        racionesVendidas: o.racionesVendidas,
        dineroRecuperado: Number(o.dineroRecuperado.toFixed(2)),
      })),
    };
  }
}
