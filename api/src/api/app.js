import express from 'express';
import cors from 'cors';
import { manejarErrores } from './middlewares/error-handler.middleware.js';

export function crearApp({ apiAcceso, apiOfertas, pedidosModule }) {
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

  app.use('/api/v1', v1);

  app.use(manejarErrores);

  return app;
}
