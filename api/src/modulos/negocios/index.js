import { NegocioRepositoryPg } from './infraestructura/negocio-repository-pg.js';
import { BcryptHasher } from './infraestructura/bcrypt-hasher.js';
import { VerificarCredenciales } from './aplicacion/verificar-credenciales.caso-uso.js';
import { ObtenerContacto } from './aplicacion/obtener-contacto.caso-uso.js';
import { RegistrarSolicitud } from './aplicacion/registrar-solicitud.caso-uso.js';
import { VerificarNegocioActivo } from './aplicacion/verificar-negocio-activo.caso-uso.js';
import { ListarSolicitudes } from './aplicacion/listar-solicitudes.caso-uso.js';
import { ResolverSolicitud } from './aplicacion/resolver-solicitud.caso-uso.js';
import { NegociosController } from './presentacion/negocios.controller.js';
import { AdminNegociosController } from './presentacion/admin-negocios.controller.js';
import { crearRutasSolicitudes } from './presentacion/negocios.routes.js';
import { crearRutasAdminNegocios } from './presentacion/admin-negocios.routes.js';

/**
 * API pública del módulo Negocios. Ningún otro módulo debe importar nada de
 * `negocios/dominio` ni `negocios/infraestructura`: todo pasa por aquí.
 */
export function crearApiNegocios({ pool, reloj, limitarSolicitudes }) {
  const negocioRepository = new NegocioRepositoryPg(pool);
  const hasher = new BcryptHasher();

  const verificarCredenciales = new VerificarCredenciales({ negocios: negocioRepository, hasher });
  const obtenerContacto = new ObtenerContacto({ negocios: negocioRepository });
  const registrarSolicitud = new RegistrarSolicitud({ negocios: negocioRepository, hasher, reloj });
  const verificarNegocioActivo = new VerificarNegocioActivo({ negocios: negocioRepository });
  const listarSolicitudes = new ListarSolicitudes({ negocios: negocioRepository });
  const resolverSolicitud = new ResolverSolicitud({ negocios: negocioRepository, reloj });

  const controller = new NegociosController({ registrarSolicitud });
  const adminController = new AdminNegociosController({ listarSolicitudes, resolverSolicitud });

  return {
    routerSolicitudes: crearRutasSolicitudes(controller, limitarSolicitudes),
    crearRouterAdmin(requireAuth, requireRolAdmin) {
      return crearRutasAdminNegocios(adminController, requireAuth, requireRolAdmin);
    },

    async verificarCredenciales({ email, password }) {
      return verificarCredenciales.ejecutar({ email, password });
    },
    async obtenerContacto(negocioId, tx) {
      return obtenerContacto.ejecutar({ negocioId }, tx);
    },
    /** RN-13: lanza NegocioNoHabilitadoError si el negocio no está ACTIVO. */
    async verificarNegocioActivo(negocioId, tx) {
      return verificarNegocioActivo.ejecutar({ negocioId }, tx);
    },
    /** RN-13: para que la vitrina solo muestre ofertas de negocios ACTIVO. */
    async negociosActivosDetalle() {
      return negocioRepository.listarActivosConDetalle();
    },
    async idsDeNegociosActivos() {
      return negocioRepository.listarIdsActivos();
    },
    // Exponer casos de uso para tests de integración
    listarSolicitudes,
    resolverSolicitud,
    negocioRepository,
  };
}
