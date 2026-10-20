import { Router } from 'express';

/** Se monta en /api/v1/ofertas → POST /ofertas/:id/pedidos (cliente anónimo). */
export function crearRutasPedidosPublicas(controller, limitarPedidos) {
  const router = Router();
  router.post('/:id/pedidos', limitarPedidos, (req, res, next) => controller.pedir(req, res, next));
  return router;
}

/** Se monta en /api/v1/pedidos → PATCH /pedidos/:codigo (negocio autenticado). */
export function crearRutasPedidosNegocio(controller, requireAuth) {
  const router = Router();
  router.patch('/:codigo', requireAuth, (req, res, next) => controller.resolver(req, res, next));
  return router;
}
