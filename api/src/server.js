import 'dotenv/config';
import { obtenerPool } from './compartido/infraestructura/db.js';
import { UnidadDeTrabajoPg } from './compartido/infraestructura/unidad-de-trabajo-pg.js';
import { RelojSistema } from './compartido/infraestructura/relojes.js';
import { crearApiNegocios } from './modulos/negocios/index.js';
import { crearApiAcceso } from './modulos/acceso/index.js';
import { crearApiOfertas } from './modulos/ofertas/index.js';
import { SupabaseStorageAdapter } from './modulos/ofertas/infraestructura/supabase-storage-adapter.js';
import { crearModuloPedidos } from './modulos/pedidos/pedidos.module.js';
import { crearRequireAuth } from './api/middlewares/auth.middleware.js';
import { limitarPedidos } from './api/middlewares/rate-limit.middleware.js';
import { crearApp } from './api/app.js';
import { programarExpiracionDeReservas } from './jobs/expirar-reservas.job.js';

const pool = obtenerPool();
const reloj = new RelojSistema();
const unidadDeTrabajo = new UnidadDeTrabajoPg(pool);

const apiNegocios = crearApiNegocios({ pool });
const apiAcceso = crearApiAcceso({
  apiNegocios,
  jwtSecret: process.env.JWT_SECRET,
  duracionToken: process.env.JWT_DURACION ?? '12h',
});
const requireAuth = crearRequireAuth(apiAcceso);
const almacenImagenes = new SupabaseStorageAdapter({
  url: process.env.SUPABASE_URL,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  bucket: process.env.SUPABASE_STORAGE_BUCKET,
});
const apiOfertas = crearApiOfertas({ pool, reloj, requireAuth, almacenImagenes });
const pedidosModule = crearModuloPedidos({
  pool,
  reloj,
  unidadDeTrabajo,
  apiOfertas,
  apiNegocios,
  requireAuth,
  limitarPedidos,
});

const app = crearApp({ apiAcceso, apiOfertas, pedidosModule });

programarExpiracionDeReservas(pedidosModule.expirarReservas);

const puerto = process.env.PORT ?? 3000;
app.listen(puerto, () => {
  console.log(`JAMA API escuchando en el puerto ${puerto}`);
});
