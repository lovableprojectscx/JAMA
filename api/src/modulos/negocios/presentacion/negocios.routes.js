import { Router } from 'express';
import multer from 'multer';

const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_FOTO },
});

function capturarArchivo(nombreCampo) {
  return (req, res, next) => {
    upload.fields([
      { name: nombreCampo, maxCount: 1 },
      { name: 'foto', maxCount: 1 },
    ])(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return res.status(400).json({ error: 'La imagen no debe pesar más de 5 MB' });
      }
      if (error) return next(error);
      req.file = req.files?.[nombreCampo]?.[0] || req.files?.foto?.[0] || null;
      return next();
    });
  };
}

/** Público: cualquiera puede enviar una solicitud, con límite por IP (RF23). */
export function crearRutasSolicitudes(controller, limitarSolicitudes) {
  const router = Router();
  router.post('/', limitarSolicitudes, (req, res, next) => controller.solicitar(req, res, next));
  return router;
}

/** Público: perfil público de negocio por slug o UUID (/api/v1/negocios/publico/:slugOrId). */
export function crearRutasNegociosPublicas(controller) {
  const router = Router();
  router.get('/:slugOrId', (req, res, next) => controller.obtenerPublico(req, res, next));
  return router;
}

/** Privado: gestión de perfil del negocio autenticado (/api/v1/negocios/me). */
export function crearRutasNegociosMe(controller, requireAuth) {
  const router = Router();
  router.get('/perfil', requireAuth, (req, res, next) => controller.obtenerMiPerfil(req, res, next));
  router.patch('/perfil', requireAuth, (req, res, next) => controller.actualizarMiPerfil(req, res, next));
  router.post(
    '/fotos/portada',
    requireAuth,
    capturarArchivo('portada'),
    (req, res, next) => controller.subirPortada(req, res, next)
  );
  router.post(
    '/fotos/logo',
    requireAuth,
    capturarArchivo('logo'),
    (req, res, next) => controller.subirLogo(req, res, next)
  );
  return router;
}
