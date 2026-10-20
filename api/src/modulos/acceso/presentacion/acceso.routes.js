import { Router } from 'express';

export function crearRutasAcceso(controller) {
  const router = Router();
  router.post('/login', (req, res, next) => controller.iniciarSesion(req, res, next));
  return router;
}
