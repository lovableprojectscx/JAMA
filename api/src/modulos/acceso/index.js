import { JwtTokenAdapter } from './infraestructura/jwt-token.adapter.js';
import { Login } from './aplicacion/login.caso-uso.js';
import { AccesoController } from './presentacion/acceso.controller.js';
import { crearRutasAcceso } from './presentacion/acceso.routes.js';

/**
 * API pública del módulo Acceso: expone el router de autenticación y
 * `verificarToken`, que usa el middleware de la API para proteger rutas.
 */
export function crearApiAcceso({ apiNegocios, jwtSecret, duracionToken }) {
  const generadorToken = new JwtTokenAdapter({ secreto: jwtSecret, duracion: duracionToken });
  const login = new Login({ negocios: apiNegocios, generadorToken });
  const controller = new AccesoController({ login });
  const router = crearRutasAcceso(controller);

  return {
    router,
    verificarToken(token) {
      return generadorToken.verificar(token);
    },
  };
}
