import { Router } from 'express';
import multer from 'multer';

const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB

const subirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_FOTO },
}).single('foto');

/** El tipo de archivo lo valida el caso de uso (RN-12); aquí solo se acota el tamaño. */
function manejarSubidaFoto(req, res, next) {
  subirFoto(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: 'La foto no debe pesar más de 5 MB' });
    }
    if (error) return next(error);
    return next();
  });
}

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
  router.post('/fotos', requireAuth, manejarSubidaFoto, (req, res, next) => controller.subirFoto(req, res, next));
  router.patch('/:id', requireAuth, (req, res, next) => controller.cambiarEstado(req, res, next));
  return router;
}
