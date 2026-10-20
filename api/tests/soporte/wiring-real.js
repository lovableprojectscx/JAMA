import { UnidadDeTrabajoPg } from '../../src/compartido/infraestructura/unidad-de-trabajo-pg.js';
import { RelojSistema } from '../../src/compartido/infraestructura/relojes.js';
import { crearApiNegocios } from '../../src/modulos/negocios/index.js';
import { crearApiOfertas } from '../../src/modulos/ofertas/index.js';
import { CodigoCanjeRepositoryPg } from '../../src/modulos/pedidos/infraestructura/codigo-canje-repository-pg.js';
import { WaMeEnlaceAdapter } from '../../src/modulos/pedidos/infraestructura/wame-enlace.adapter.js';
import { GeneradorCodigoAleatorio } from '../../src/modulos/pedidos/infraestructura/generador-codigo-aleatorio.js';
import {
  ReservaDeStockConOfertas,
  ContactoNegocioConNegocios,
} from '../../src/modulos/pedidos/infraestructura/modulos-vecinos.adapters.js';
import { PedirOferta } from '../../src/modulos/pedidos/aplicacion/pedir-oferta.caso-uso.js';
import { ResolverPedido } from '../../src/modulos/pedidos/aplicacion/resolver-pedido.caso-uso.js';

/**
 * Cablea los módulos Pedidos ↔ Ofertas ↔ Negocios con adaptadores reales de
 * PostgreSQL, igual que en producción, pero apuntando al pool de pruebas.
 * Se usa en las pruebas de integración (concurrencia, seguridad), que
 * necesitan BEGIN/COMMIT/ROLLBACK reales, no dobles en memoria.
 */
export function construirPedidosReales(pool, reloj = new RelojSistema()) {
  const unidadDeTrabajo = new UnidadDeTrabajoPg(pool);
  const apiNegocios = crearApiNegocios({ pool });
  const apiOfertas = crearApiOfertas({ pool, reloj, requireAuth: (req, res, next) => next() });

  const codigos = new CodigoCanjeRepositoryPg(pool);
  const reservaDeStock = new ReservaDeStockConOfertas(apiOfertas);
  const contactoNegocio = new ContactoNegocioConNegocios(apiNegocios);

  const pedirOferta = new PedirOferta({
    unidadDeTrabajo,
    reloj,
    reservaDeStock,
    codigos,
    generadorCodigo: new GeneradorCodigoAleatorio(),
    contactoNegocio,
    mensajeria: new WaMeEnlaceAdapter(),
  });

  const resolverPedido = new ResolverPedido({
    unidadDeTrabajo,
    reloj,
    codigos,
    reservaDeStock,
  });

  return { pedirOferta, resolverPedido, apiOfertas, codigos };
}
