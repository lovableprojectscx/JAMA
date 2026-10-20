import { NegocioRepositoryPg } from './infraestructura/negocio-repository-pg.js';
import { BcryptHasher } from './infraestructura/bcrypt-hasher.js';
import { VerificarCredenciales } from './aplicacion/verificar-credenciales.caso-uso.js';
import { ObtenerContacto } from './aplicacion/obtener-contacto.caso-uso.js';

/**
 * API pública del módulo Negocios. Ningún otro módulo debe importar nada de
 * `negocios/dominio` ni `negocios/infraestructura`: todo pasa por aquí.
 */
export function crearApiNegocios({ pool }) {
  const negocioRepository = new NegocioRepositoryPg(pool);
  const hasher = new BcryptHasher();

  const verificarCredenciales = new VerificarCredenciales({
    negocios: negocioRepository,
    hasher,
  });
  const obtenerContacto = new ObtenerContacto({ negocios: negocioRepository });

  return {
    async verificarCredenciales({ email, password }) {
      return verificarCredenciales.ejecutar({ email, password });
    },
    async obtenerContacto(negocioId, tx) {
      return obtenerContacto.ejecutar({ negocioId }, tx);
    },
  };
}
