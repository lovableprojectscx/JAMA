import { NegocioRepositoryPg } from './infraestructura/negocio-repository-pg.js';
import { BcryptHasher } from './infraestructura/bcrypt-hasher.js';
import { VerificarCredenciales } from './aplicacion/verificar-credenciales.caso-uso.js';
import { ObtenerContacto } from './aplicacion/obtener-contacto.caso-uso.js';
import { RegistrarSolicitud } from './aplicacion/registrar-solicitud.caso-uso.js';
import { VerificarNegocioActivo } from './aplicacion/verificar-negocio-activo.caso-uso.js';
import { ListarSolicitudes } from './aplicacion/listar-solicitudes.caso-uso.js';
import { ResolverSolicitud } from './aplicacion/resolver-solicitud.caso-uso.js';
import { ObtenerPerfilPublico } from './aplicacion/obtener-perfil-publico.caso-uso.js';
import { ObtenerMiPerfil } from './aplicacion/obtener-mi-perfil.caso-uso.js';
import { ActualizarPerfil } from './aplicacion/actualizar-perfil.caso-uso.js';
import { SubirFotoNegocio } from './aplicacion/subir-foto-negocio.caso-uso.js';
import { NegociosController } from './presentacion/negocios.controller.js';
import { AdminNegociosController } from './presentacion/admin-negocios.controller.js';
import {
  crearRutasSolicitudes,
  crearRutasNegociosPublicas,
  crearRutasNegociosMe,
} from './presentacion/negocios.routes.js';
import { crearRutasAdminNegocios } from './presentacion/admin-negocios.routes.js';

/**
 * API pública del módulo Negocios. Ningún otro módulo debe importar nada de
 * `negocios/dominio` ni `negocios/infraestructura`: todo pasa por aquí.
 */
export function crearApiNegocios({ pool, reloj, limitarSolicitudes, almacenImagenes }) {
  const negocioRepository = new NegocioRepositoryPg(pool);
  const hasher = new BcryptHasher();

  const ofertasApiRef = { current: null };

  const verificarCredenciales = new VerificarCredenciales({ negocios: negocioRepository, hasher });
  const obtenerContacto = new ObtenerContacto({ negocios: negocioRepository });
  const registrarSolicitud = new RegistrarSolicitud({ negocios: negocioRepository, hasher, reloj });
  const verificarNegocioActivo = new VerificarNegocioActivo({ negocios: negocioRepository });
  const listarSolicitudes = new ListarSolicitudes({ negocios: negocioRepository });
  const resolverSolicitud = new ResolverSolicitud({ negocios: negocioRepository, reloj });

  const obtenerPerfilPublico = new ObtenerPerfilPublico({
    negocios: negocioRepository,
    ofertasApi: {
      listarVigentesPorNegocio: (negocioId, ahora) => {
        if (ofertasApiRef.current && typeof ofertasApiRef.current.listarVigentesPorNegocio === 'function') {
          return ofertasApiRef.current.listarVigentesPorNegocio(negocioId, ahora);
        }
        return [];
      },
    },
    reloj,
  });

  const obtenerMiPerfil = new ObtenerMiPerfil({ negocios: negocioRepository });
  const actualizarPerfil = new ActualizarPerfil({ negocios: negocioRepository });
  const subirFotoNegocio = new SubirFotoNegocio({
    negocios: negocioRepository,
    almacenImagenes,
  });

  const controller = new NegociosController({
    registrarSolicitud,
    obtenerPerfilPublico,
    obtenerMiPerfil,
    actualizarPerfil,
    subirFotoNegocio,
  });

  const adminController = new AdminNegociosController({
    listarSolicitudes,
    resolverSolicitud,
    ofertasApiRef,
    reloj,
  });

  return {
    routerSolicitudes: crearRutasSolicitudes(controller, limitarSolicitudes),
    routerPublico: crearRutasNegociosPublicas(controller),
    crearRouterMe(requireAuth) {
      return crearRutasNegociosMe(controller, requireAuth);
    },
    crearRouterAdmin(requireAuth, requireRolAdmin) {
      return crearRutasAdminNegocios(adminController, requireAuth, requireRolAdmin);
    },
    conectarOfertasApi(ofertasApi) {
      ofertasApiRef.current = ofertasApi;
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
    obtenerPerfilPublico,
    obtenerMiPerfil,
    actualizarPerfil,
    subirFotoNegocio,
    negocioRepository,
  };
}
