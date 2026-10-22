import rateLimit from 'express-rate-limit';

/**
 * Regla crítica 8: límite de pedidos por IP. Evita que un script reserve
 * todo el stock de una oferta con muchas peticiones en segundos.
 * 30/min (y no 10) porque en Perú muchos celulares comparten la misma IP
 * (NAT de operador) y 10 generaba falsos positivos entre clientes reales.
 */
export const limitarPedidos = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos desde esta IP, intenta de nuevo en un momento' },
});

/**
 * RF23: como mucho 5 solicitudes de registro creadas por hora desde una IP.
 * Solo cuentan las que se crean (las que fallan por un dato mal escrito no
 * castigan a quien se equivocó). Es una función para que cada app, y cada
 * prueba, tenga su propio contador.
 */
export function crearLimitarSolicitudes() {
  return rateLimit({
    windowMs: 60 * 60_000,
    limit: 5,
    skipFailedRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Ya se enviaron varias solicitudes desde esta conexión. Intenta de nuevo en una hora.' },
  });
}
