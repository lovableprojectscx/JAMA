import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { fileURLToPath } from 'url';
import { manejarErrores } from './middlewares/error-handler.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerPath = path.join(__dirname, '../../docs/openapi.yaml');
let swaggerDocument = null;
try {
  swaggerDocument = YAML.load(swaggerPath);
} catch (e) {
  // En caso de que no se encuentre el archivo en entornos aislados
}

export function crearApp({
  apiAcceso,
  apiNegocios,
  routerAdminNegocios,
  routerMeNegocios,
  apiOfertas,
  pedidosModule,
  expirarReservas,
}) {
  const app = express();

  // En Vercel la petición llega a través de un proxy, que pone la IP real del
  // cliente en X-Forwarded-For (y sobrescribe la que mande el cliente). Sin
  // esto, req.ip es la del proxy y los límites por IP cuentan a todos los
  // clientes como si fueran uno solo.
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json());

  const v1 = express.Router();
  v1.use('/auth', apiAcceso.router);
  if (apiNegocios.routerSolicitudes) {
    v1.use('/negocios/solicitudes', apiNegocios.routerSolicitudes);
  }
  if (apiNegocios.routerPublico) {
    v1.use('/negocios/publico', apiNegocios.routerPublico);
  }
  if (routerAdminNegocios) {
    v1.use('/admin/negocios', routerAdminNegocios);
  }
  if (pedidosModule.routerAdminPedidos) {
    v1.use('/admin/pedidos', pedidosModule.routerAdminPedidos);
  }
  if (routerMeNegocios) {
    v1.use('/negocios/me', routerMeNegocios);
  }
  v1.use('/ofertas', apiOfertas.routerPublico);
  v1.use('/ofertas', pedidosModule.routerPublico);
  v1.use('/negocios/me/ofertas', apiOfertas.routerNegocio);
  v1.use('/negocios/me/pedidos', pedidosModule.routerMeNegocio);
  if (pedidosModule.routerMetricas) {
    v1.use('/negocios/me/metricas', pedidosModule.routerMetricas);
  }
  v1.use('/pedidos', pedidosModule.routerNegocio);

  // Disparado por un Vercel Cron Job (ver vercel.json); en desarrollo local
  // esta misma tarea corre con node-cron (jobs/expirar-reservas.job.js).
  // Vercel manda el secreto como "Authorization: Bearer <CRON_SECRET>"; sin
  // CRON_SECRET configurado, el endpoint se cierra por defecto (falla cerrado).
  v1.get('/cron/expirar-reservas', async (req, res, next) => {
    const secreto = process.env.CRON_SECRET;
    if (!secreto || req.headers.authorization !== `Bearer ${secreto}`) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    try {
      const resultado = await expirarReservas.ejecutar();
      return res.status(200).json(resultado);
    } catch (error) {
      return next(error);
    }
  });

  if (swaggerDocument) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    v1.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
    v1.get('/docs.json', (req, res) => res.json(swaggerDocument));
  }

  app.use('/api/v1', v1);

  app.use(manejarErrores);

  return app;
}
