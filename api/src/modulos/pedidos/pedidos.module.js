import { CodigoCanjeRepositoryPg } from './infraestructura/codigo-canje-repository-pg.js';
import { WaMeEnlaceAdapter } from './infraestructura/wame-enlace.adapter.js';
import { GeneradorCodigoAleatorio } from './infraestructura/generador-codigo-aleatorio.js';
import {
  ReservaDeStockConOfertas,
  ContactoNegocioConNegocios,
  ResumenDeOfertasConOfertas,
} from './infraestructura/modulos-vecinos.adapters.js';
import { PedirOferta } from './aplicacion/pedir-oferta.caso-uso.js';
import { ResolverPedido } from './aplicacion/resolver-pedido.caso-uso.js';
import { ExpirarReservas } from './aplicacion/expirar-reservas.caso-uso.js';
import { ListarPedidosPorConfirmar } from './aplicacion/listar-pedidos-por-confirmar.caso-uso.js';
import { PedidosController } from './presentacion/pedidos.controller.js';
import {
  crearRutasPedidosPublicas,
  crearRutasPedidosNegocio,
  crearRutasPedidosMeNegocio,
} from './presentacion/pedidos.routes.js';

/**
 * Raíz de composición del módulo Pedidos. Nada más depende de Pedidos
 * (no tiene fachada `index.js`), así que solo expone routers y el caso de
 * uso de expiración para la tarea programada.
 */
export function crearModuloPedidos({
  pool,
  reloj,
  unidadDeTrabajo,
  apiOfertas,
  apiNegocios,
  requireAuth,
  limitarPedidos,
}) {
  const codigoCanjeRepository = new CodigoCanjeRepositoryPg(pool);
  const reservaDeStock = new ReservaDeStockConOfertas(apiOfertas);
  const contactoNegocio = new ContactoNegocioConNegocios(apiNegocios);
  const resumenDeOfertas = new ResumenDeOfertasConOfertas(apiOfertas);
  const mensajeria = new WaMeEnlaceAdapter();
  const generadorCodigo = new GeneradorCodigoAleatorio();

  const pedirOferta = new PedirOferta({
    unidadDeTrabajo,
    reloj,
    reservaDeStock,
    codigos: codigoCanjeRepository,
    generadorCodigo,
    contactoNegocio,
    mensajeria,
  });

  const resolverPedido = new ResolverPedido({
    unidadDeTrabajo,
    reloj,
    codigos: codigoCanjeRepository,
    reservaDeStock,
  });

  const expirarReservas = new ExpirarReservas({
    unidadDeTrabajo,
    reloj,
    codigos: codigoCanjeRepository,
    reservaDeStock,
  });

  const listarPedidosPorConfirmar = new ListarPedidosPorConfirmar({
    codigos: codigoCanjeRepository,
    reloj,
    resumenDeOfertas,
  });

  const controller = new PedidosController({ pedirOferta, resolverPedido, listarPedidosPorConfirmar });

  return {
    routerPublico: crearRutasPedidosPublicas(controller, limitarPedidos),
    routerNegocio: crearRutasPedidosNegocio(controller, requireAuth),
    routerMeNegocio: crearRutasPedidosMeNegocio(controller, requireAuth),
    expirarReservas,
  };
}
