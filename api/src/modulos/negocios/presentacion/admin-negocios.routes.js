import { Router } from 'express';
import multer from 'multer';

const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024; // 5 MB

const subirFoto = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_FOTO },
}).single('foto');

function manejarSubidaFoto(req, res, next) {
  subirFoto(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ error: 'La foto no debe pesar más de 5 MB' });
    }
    if (error) return next(error);
    return next();
  });
}

export function crearRutasAdminNegocios(controller, requireAuth, requireRolAdmin) {
  const router = Router();
  router.use(requireAuth);
  router.use(requireRolAdmin);

  router.get('/', (req, res, next) => controller.listar(req, res, next));
  router.patch('/:id', (req, res, next) => controller.resolver(req, res, next));
  router.post('/:id/ofertas', (req, res, next) => controller.publicarOfertaParaNegocio(req, res, next));
  router.post('/:id/ofertas/fotos', manejarSubidaFoto, (req, res, next) => controller.subirFotoOferta(req, res, next));

  return router;
}
