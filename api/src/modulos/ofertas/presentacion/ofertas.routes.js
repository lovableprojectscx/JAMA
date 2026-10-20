import { Router } from 'express';

export function crearRutasOfertasPublicas(controller) {
  const router = Router();
  router.get('/', (req, res, next) => controller.listar(req, res, next));
  router.get('/:id', (req, res, next) => controller.detalle(req, res, next));
  return router;
}

/** Se monta en /api/v1/negocios/me/ofertas (negocio autenticado). */
export function crearRutasOfertasNegocio(controller, requireAuth) {
  const router = Router();
  router.post('/', requireAuth, (req, res, next) => controller.publicar(req, res, next));
  router.get('/', requireAuth, (req, res, next) => controller.listarMisDeHoy(req, res, next));
  router.patch('/:id', requireAuth, (req, res, next) => controller.cambiarEstado(req, res, next));
  return router;
}
