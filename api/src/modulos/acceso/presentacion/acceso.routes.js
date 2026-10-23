import { Router } from 'express';

export function crearRutasAcceso(controller) {
  const router = Router();
  router.post('/login', (req, res, next) => controller.iniciarSesion(req, res, next));
  router.post('/admin/login', (req, res, next) => controller.iniciarSesionAdmin(req, res, next));
  return router;
}
