import { NoEncontradoError } from '../../compartido/dominio/errores.js';
import { OfertaRepositoryPg } from './infraestructura/oferta-repository-pg.js';
import { PublicarOferta } from './aplicacion/publicar-oferta.caso-uso.js';
import { ListarOfertasVigentes } from './aplicacion/listar-ofertas-vigentes.caso-uso.js';
import { ObtenerOferta } from './aplicacion/obtener-oferta.caso-uso.js';
import { OfertasController } from './presentacion/ofertas.controller.js';
import { crearRutasOfertasPublicas, crearRutasOfertasNegocio } from './presentacion/ofertas.routes.js';

/**
 * API pública del módulo Ofertas. Pedidos (y cualquier otro módulo) solo
 * puede llegar a las ofertas a través de `reservarUnidad` / `liberarUnidad`,
 * nunca leyendo la tabla `ofertas` directamente (ADR-001).
 */
export function crearApiOfertas({ pool, reloj, requireAuth }) {
  const ofertaRepository = new OfertaRepositoryPg(pool);

  const publicarOferta = new PublicarOferta({ ofertas: ofertaRepository, reloj });
  const listarOfertasVigentes = new ListarOfertasVigentes({ ofertas: ofertaRepository, reloj });
  const obtenerOferta = new ObtenerOferta({ ofertas: ofertaRepository });

  const controller = new OfertasController({ publicarOferta, listarOfertasVigentes, obtenerOferta });

  return {
    routerPublico: crearRutasOfertasPublicas(controller),
    routerNegocio: crearRutasOfertasNegocio(controller, requireAuth),

    /** Usado por Pedidos dentro de la misma transacción (tx) al reservar. */
    async reservarUnidad(ofertaId, tx, ahora) {
      const oferta = await ofertaRepository.obtenerParaActualizar(ofertaId, tx);
      if (!oferta) {
        throw new NoEncontradoError('Oferta no encontrada');
      }
      oferta.reservarUnidad(ahora);
      await ofertaRepository.guardar(oferta, tx);
      return { negocioId: oferta.negocioId, titulo: oferta.titulo };
    },

    /** Usado por Pedidos para devolver stock (NO_CONCRETADO / EXPIRADO). */
    async liberarUnidad(ofertaId, tx, ahora) {
      const oferta = await ofertaRepository.obtenerParaActualizar(ofertaId, tx);
      oferta.liberarUnidad(ahora);
      await ofertaRepository.guardar(oferta, tx);
    },
  };
}
