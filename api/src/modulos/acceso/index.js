import { JwtTokenAdapter } from './infraestructura/jwt-token.adapter.js';
import { BcryptHasher } from './infraestructura/bcrypt-hasher.js';
import { AdminRepositoryPg } from './infraestructura/admin-repository-pg.js';
import { Login } from './aplicacion/login.caso-uso.js';
import { LoginAdmin } from './aplicacion/login-admin.caso-uso.js';
import { AccesoController } from './presentacion/acceso.controller.js';
import { crearRutasAcceso } from './presentacion/acceso.routes.js';

/**
 * API pública del módulo Acceso: expone el router de autenticación y
 * `verificarToken`, que usa el middleware de la API para proteger rutas.
 */
export function crearApiAcceso({ pool, apiNegocios, jwtSecret, duracionToken }) {
  const generadorToken = new JwtTokenAdapter({ secreto: jwtSecret, duracion: duracionToken });
  const adminRepository = new AdminRepositoryPg(pool);
  const hasher = new BcryptHasher();

  const login = new Login({ negocios: apiNegocios, generadorToken });
  const loginAdmin = new LoginAdmin({ administradores: adminRepository, hasher, generadorToken });

  const controller = new AccesoController({ login, loginAdmin });
  const router = crearRutasAcceso(controller);

  return {
    router,
    verificarToken(token) {
      return generadorToken.verificar(token);
    },
    adminRepository,
    hasher,
  };
}
