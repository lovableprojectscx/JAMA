import rateLimit from 'express-rate-limit';

/**
 * Regla crítica 8: límite de pedidos por IP. Evita que un script reserve
 * todo el stock de una oferta con muchas peticiones en segundos.
 */
export const limitarPedidos = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados pedidos desde esta IP, intenta de nuevo en un momento' },
});
