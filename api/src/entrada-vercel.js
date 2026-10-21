// Entrypoint para Vercel: una función serverless que envuelve la misma app
// de Express (ver crear-aplicacion.js), sin `app.listen` — Vercel maneja el
// socket. La expiración de reservas ya no corre con node-cron aquí: la
// dispara un Vercel Cron Job pegándole a /api/v1/cron/expirar-reservas
// (ver vercel.json y api/app.js).
import { crearAplicacion } from './crear-aplicacion.js';

const { app } = crearAplicacion();

export default app;
