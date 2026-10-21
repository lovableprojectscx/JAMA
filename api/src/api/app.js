import express from 'express';
import cors from 'cors';
import { manejarErrores } from './middlewares/error-handler.middleware.js';

export function crearApp({ apiAcceso, apiOfertas, pedidosModule, expirarReservas }) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  const v1 = express.Router();
  v1.use('/auth', apiAcceso.router);
  v1.use('/ofertas', apiOfertas.routerPublico);
  v1.use('/ofertas', pedidosModule.routerPublico);
  v1.use('/negocios/me/ofertas', apiOfertas.routerNegocio);
  v1.use('/negocios/me/pedidos', pedidosModule.routerMeNegocio);
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

  app.use('/api/v1', v1);

  app.use(manejarErrores);

  return app;
}
