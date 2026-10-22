import { Router } from 'express';

/** Público: cualquiera puede enviar una solicitud, con límite por IP (RF23). */
export function crearRutasSolicitudes(controller, limitarSolicitudes) {
  const router = Router();
  router.post('/', limitarSolicitudes, (req, res, next) => controller.solicitar(req, res, next));
  return router;
}
