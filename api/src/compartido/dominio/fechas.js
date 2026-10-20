const ZONA_LIMA = 'America/Lima';

const formatoHoraMinuto = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_LIMA,
  hour12: false,
  hour: '2-digit',
  minute: '2-digit',
});

const formatoFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_LIMA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Hora y minuto del instante `fecha`, en la zona de Lima, como "HH:MM".
 * Sirve para comparar contra los tramos de precio (que se definen como hora
 * local de Lima), sin depender de la zona horaria del servidor.
 */
export function horaMinutoLima(fecha) {
  return formatoHoraMinuto.format(fecha);
}

/**
 * Fecha calendario del instante `fecha`, en la zona de Lima, como "YYYY-MM-DD".
 * A las 19:30 de Lima (00:30 UTC del día siguiente) esto sigue devolviendo el
 * día de Lima, no el de UTC.
 */
export function fechaLimaYYYYMMDD(fecha) {
  return formatoFecha.format(fecha);
}

/** true si ambos instantes caen en el mismo día calendario de Lima. */
export function esMismoDiaLima(fechaA, fechaB) {
  return fechaLimaYYYYMMDD(fechaA) === fechaLimaYYYYMMDD(fechaB);
}
