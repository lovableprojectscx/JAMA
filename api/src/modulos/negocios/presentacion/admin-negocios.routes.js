import { Router } from 'express';

export function crearRutasAdminNegocios(controller, requireAuth, requireRolAdmin) {
  const router = Router();
  router.use(requireAuth);
  router.use(requireRolAdmin);

  router.get('/', (req, res, next) => controller.listar(req, res, next));
  router.patch('/:id', (req, res, next) => controller.resolver(req, res, next));

  return router;
}
