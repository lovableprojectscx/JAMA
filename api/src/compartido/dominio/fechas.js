const ZONA_LIMA = 'America/Lima';

const formateador = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_LIMA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/**
 * Descompone un instante en sus componentes de calendario y hora en
 * America/Lima. No usa el offset fijo (UTC-5) a mano: usa Intl, que es
 * correcto incluso si alguna vez cambia la regla horaria de Perú.
 */
function partesEnLima(fecha) {
  const partes = Object.fromEntries(
    formateador.formatToParts(fecha).map((p) => [p.type, p.value])
  );
  return {
    anio: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    hora: Number(partes.hour),
    minuto: Number(partes.minute),
    segundo: Number(partes.second),
  };
}

/**
 * Fecha de calendario (YYYY-MM-DD) en Lima para un instante dado.
 * Importante: a las 19:00 en Lima ya puede ser "mañana" en UTC, así que
 * nunca se debe usar `fecha.toISOString().slice(0, 10)` para esto.
 */
export function fechaCalendarioLima(fecha) {
  const { anio, mes, dia } = partesEnLima(fecha);
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function esMismoDiaLima(a, b) {
  return fechaCalendarioLima(a) === fechaCalendarioLima(b);
}

export function esFechaCalendarioPasada(fechaISO, ahora) {
  return fechaISO < fechaCalendarioLima(ahora);
}
