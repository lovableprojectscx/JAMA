import { useState, useEffect, useCallback } from 'react';
import {
  Check,
  X,
  MessageCircle,
  RefreshCw,
  ShoppingBag,
  Plus,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  listarSolicitudesAdmin,
  resolverSolicitudAdmin,
  listarPedidosAdmin,
  resolverPedidoAdmin,
  publicarOfertaAdmin,
  subirFotoOfertaAdmin,
} from './api.js';
import logoJama from '../assets/jama-logo.png';
import './admin.css';

export default function AdminPanel({ token, admin, onLogout }) {
  const [pestana, setPestana] = useState('PENDIENTE');
  const [solicitudes, setSolicitudes] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [filtroPedidos, setFiltroPedidos] = useState('TODOS');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Acciones en solicitudes
  const [rechazandoId, setRechazandoId] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [accionExitosa, setAccionExitosa] = useState({});

  // Acciones en pedidos
  const [procesandoPedidoCodigo, setProcesandoPedidoCodigo] = useState(null);
  const [pedidoExitoso, setPedidoExitoso] = useState({});

  // Modal Publicación Asistida
  const [negocioParaPublicar, setNegocioParaPublicar] = useState(null);
  const [formOferta, setFormOferta] = useState({
    titulo: '',
    descripcion: '',
    precioCarta: '',
    precioOferta: '',
    stock: 5,
    horaLimite: '21:00',
    fotoUrl: '',
  });
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [subiendoOferta, setSubiendoOferta] = useState(false);
  const [errorPublicar, setErrorPublicar] = useState(null);
  const [exitoPublicar, setExitoPublicar] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosSolicitudes, datosPedidos] = await Promise.all([
        listarSolicitudesAdmin(token, null),
        listarPedidosAdmin(token, null),
      ]);
      setSolicitudes(datosSolicitudes);
      setPedidos(datosPedidos);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos del panel.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  async function handleAprobar(negocio) {
    setProcesandoId(negocio.id);
    try {
      const res = await resolverSolicitudAdmin(token, negocio.id, { accion: 'APROBAR' });
      setAccionExitosa((prev) => ({
        ...prev,
        [negocio.id]: {
          estado: 'ACTIVO',
          mensaje: '¡Negocio aprobado con éxito!',
        },
      }));
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === negocio.id ? { ...s, estado: 'ACTIVO', revisadoEn: res.revisadoEn } : s))
      );
    } catch (err) {
      alert(`Error al aprobar: ${err.message}`);
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleRechazar(negocio) {
    if (!motivoRechazo.trim() || motivoRechazo.trim().length < 3) {
      alert('Debes indicar un motivo de rechazo de al menos 3 caracteres.');
      return;
    }
    setProcesandoId(negocio.id);
    try {
      const res = await resolverSolicitudAdmin(token, negocio.id, {
        accion: 'RECHAZAR',
        motivo: motivoRechazo.trim(),
      });
      setAccionExitosa((prev) => ({
        ...prev,
        [negocio.id]: {
          estado: 'RECHAZADO',
          mensaje: 'Solicitud rechazada.',
          motivo: motivoRechazo.trim(),
        },
      }));
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === negocio.id
            ? { ...s, estado: 'RECHAZADO', motivoEstado: motivoRechazo.trim(), revisadoEn: res.revisadoEn }
            : s
        )
      );
      setRechazandoId(null);
      setMotivoRechazo('');
    } catch (err) {
      alert(`Error al rechazar: ${err.message}`);
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleValidarPago(pedido) {
    if (!window.confirm(`¿Confirmas que recibiste el Yape de S/ ${(pedido.precio || 0).toFixed(2)} para el pedido ${pedido.codigo}?`)) {
      return;
    }
    setProcesandoPedidoCodigo(pedido.codigo);
    try {
      await resolverPedidoAdmin(token, pedido.codigo, true);
      setPedidos((prev) =>
        prev.map((p) => (p.codigo === pedido.codigo ? { ...p, estado: 'VENDIDO' } : p))
      );
      setPedidoExitoso((prev) => ({
        ...prev,
        [pedido.codigo]: '¡Pago validado! Ahora avisa a la tienda por WhatsApp para que entregue el pedido.',
      }));
    } catch (err) {
      alert(`Error al validar pago: ${err.message}`);
    } finally {
      setProcesandoPedidoCodigo(null);
    }
  }

  async function handleCancelarPedido(pedido) {
    if (!window.confirm(`¿Marcar el pedido ${pedido.codigo} como no pagado / cancelado? Se devolverá la unidad al stock.`)) {
      return;
    }
    setProcesandoPedidoCodigo(pedido.codigo);
    try {
      await resolverPedidoAdmin(token, pedido.codigo, false);
      setPedidos((prev) =>
        prev.map((p) => (p.codigo === pedido.codigo ? { ...p, estado: 'NO_CONCRETADO' } : p))
      );
    } catch (err) {
      alert(`Error al cancelar: ${err.message}`);
    } finally {
      setProcesandoPedidoCodigo(null);
    }
  }

  function abrirModalPublicar(negocio) {
    setNegocioParaPublicar(negocio);
    setFormOferta({
      titulo: '',
      descripcion: '',
      precioCarta: '',
      precioOferta: '',
      stock: 5,
      horaLimite: '21:00',
      fotoUrl: '',
    });
    setArchivoFoto(null);
    setErrorPublicar(null);
    setExitoPublicar(null);
  }

  async function handlePublicarOferta(e) {
    e.preventDefault();
    if (!formOferta.titulo.trim()) {
      setErrorPublicar('El título es obligatorio.');
      return;
    }
    const pc = Number(formOferta.precioCarta);
    const po = Number(formOferta.precioOferta);
    if (isNaN(pc) || isNaN(po) || po >= pc || po <= 0) {
      setErrorPublicar('El precio de oferta debe ser menor al precio normal de carta.');
      return;
    }

    setSubiendoOferta(true);
    setErrorPublicar(null);
    try {
      let finalFotoUrl = formOferta.fotoUrl;
      if (archivoFoto) {
        const subida = await subirFotoOfertaAdmin(token, negocioParaPublicar.id, archivoFoto);
        finalFotoUrl = subida.fotoUrl;
      }

      // Horas del día de hoy en Lima
      const ahora = new Date();
      const horaElab = new Date(ahora.getTime() - 2 * 60 * 60 * 1000); // 2h antes

      const [hh, mm] = formOferta.horaLimite.split(':');
      const horaLim = new Date();
      horaLim.setHours(Number(hh || 21), Number(mm || 0), 0, 0);
      if (horaLim <= ahora) {
        // Si la hora ya pasó hoy, sumamos 2 horas desde ahora
        horaLim.setTime(ahora.getTime() + 2 * 60 * 60 * 1000);
      }

      await publicarOfertaAdmin(token, negocioParaPublicar.id, {
        titulo: formOferta.titulo.trim(),
        descripcion: formOferta.descripcion.trim(),
        precioCarta: pc,
        precioOferta: po,
        stock: Number(formOferta.stock) || 5,
        horaElaboracion: horaElab.toISOString(),
        horaLimite: horaLim.toISOString(),
        fotoUrl: finalFotoUrl || null,
      });

      setExitoPublicar(`¡Oferta publicada exitosamente para ${negocioParaPublicar.nombre}!`);
      setTimeout(() => {
        setNegocioParaPublicar(null);
        setExitoPublicar(null);
      }, 2500);
    } catch (err) {
      setErrorPublicar(err.message || 'Error al publicar la oferta.');
    } finally {
      setSubiendoOferta(false);
    }
  }

  function enlaceWhatsApp(negocio, tipoAviso, motivo = '') {
    const celular = negocio.whatsapp.startsWith('51') ? negocio.whatsapp : `51${negocio.whatsapp}`;
    let texto = '';
    if (tipoAviso === 'APROBACION') {
      texto = `¡Hola ${negocio.nombre}! 🎉 Te saludamos del equipo de JAMA.\n\nTu solicitud ha sido APROBADA. Ya puedes ingresar a tu panel móvil para publicar tus ofertas del día:\n👉 https://jama.pe/panel\n\nTu correo de acceso: ${negocio.email}`;
    } else {
      texto = `Hola ${negocio.nombre}, te saludamos del equipo de JAMA.\n\nRevisamos tu solicitud de registro y por el momento no pudimos activarla.\nMotivo: ${motivo || negocio.motivoEstado || 'Datos no verificados'}.\n\nCualquier consulta puedes responder a este mensaje.`;
    }
    return `https://wa.me/${celular}?text=${encodeURIComponent(texto)}`;
  }

  function enlaceWhatsappTiendaPedido(p) {
    const cel = (p.negocio?.whatsapp || '').replace(/\D/g, '');
    const numero = cel.startsWith('51') ? cel : `51${cel}`;
    const monto = Number(p.precio || 0).toFixed(2);
    const texto = `¡Hola ${p.negocio?.nombre || 'amigo(a)'}! 🎉 Te saludamos del equipo de operaciones de JAMA Huamanga:\n\nEl cliente con código de canje *${p.codigo}* acaba de pagar su pedido de *${p.oferta?.titulo}* (S/ ${monto}) por Yape a JAMA.\n\n✅ Pago recibido y registrado en JAMA. El monto será liquidado a tu cuenta.\nPor favor entrégale su ración cuando el cliente se presente con el código *${p.codigo}*.\n\n📍 Entrega autorizada. ¡Gracias por sumarte a salvar comida!`;
    return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  }

  const solicitudesFiltradas =
    pestana === 'PENDIENTE'
      ? solicitudes.filter((s) => s.estado === 'PENDIENTE' || accionExitosa[s.id])
      : solicitudes.filter((s) => s.estado !== 'PENDIENTE');

  const pedidosFiltrados =
    filtroPedidos === 'TODOS'
      ? pedidos
      : pedidos.filter((p) => p.estado === filtroPedidos);

  return (
    <div className="admin-app">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header__interior">
          <div className="admin-header__marca">
            <img src={logoJama} alt="JAMA" className="admin-header__logo" />
            <span className="admin-header__tag">ADMIN CONCIERGE</span>
          </div>
          <div className="admin-header__usuario">
            <span className="admin-header__nombre">{admin?.nombre ?? 'Administrador'}</span>
            <button type="button" onClick={onLogout} className="admin-header__btn-salir">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="admin-contenido">
        {/* Pestañas Principales */}
        <div className="admin-pestanas">
          <button
            type="button"
            className={`admin-pestana ${pestana === 'PENDIENTE' ? 'admin-pestana--activa' : ''}`}
            onClick={() => setPestana('PENDIENTE')}
          >
            Pendientes
            <span className="admin-pestana__contador">
              {solicitudes.filter((s) => s.estado === 'PENDIENTE').length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-pestana ${pestana === 'PEDIDOS' ? 'admin-pestana--activa' : ''}`}
            onClick={() => setPestana('PEDIDOS')}
          >
            Pedidos / Canjes Yape
            <span className="admin-pestana__contador" style={{ background: '#7e22ce', color: '#fff' }}>
              {pedidos.filter((p) => p.estado === 'RESERVADO').length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-pestana ${pestana === 'HISTORIAL' ? 'admin-pestana--activa' : ''}`}
            onClick={() => setPestana('HISTORIAL')}
          >
            Comercios Afiliados ({solicitudes.filter((s) => s.estado === 'ACTIVO').length})
          </button>

          <button
            type="button"
            onClick={cargarDatos}
            className="panel-boton--quitar"
            style={{ marginLeft: 'auto', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            title="Refrescar datos"
          >
            <RefreshCw size={14} /> Refrescar
          </button>
        </div>

        {error && (
          <div className="panel-aviso panel-aviso--error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {cargando ? (
          <div className="panel-estado">Cargando panel concierge...</div>
        ) : pestana === 'PEDIDOS' ? (
          /* ==========================================================================
             PESTAÑA PEDIDOS / CANJES CONCIERGE (Cobro Yape y Aviso a Tienda)
             ========================================================================== */
          <div className="admin-seccion-pedidos">
            <div className="admin-subfiltros">
              <button
                type="button"
                className={`admin-subfiltro-btn ${filtroPedidos === 'TODOS' ? 'admin-subfiltro-btn--activo' : ''}`}
                onClick={() => setFiltroPedidos('TODOS')}
              >
                Todos ({pedidos.length})
              </button>
              <button
                type="button"
                className={`admin-subfiltro-btn ${filtroPedidos === 'RESERVADO' ? 'admin-subfiltro-btn--activo' : ''}`}
                onClick={() => setFiltroPedidos('RESERVADO')}
              >
                Por Validar Pago ({pedidos.filter((p) => p.estado === 'RESERVADO').length})
              </button>
              <button
                type="button"
                className={`admin-subfiltro-btn ${filtroPedidos === 'VENDIDO' ? 'admin-subfiltro-btn--activo' : ''}`}
                onClick={() => setFiltroPedidos('VENDIDO')}
              >
                Validados / Vendidos ({pedidos.filter((p) => p.estado === 'VENDIDO').length})
              </button>
            </div>

            {pedidosFiltrados.length === 0 ? (
              <div className="admin-vacio">
                <ShoppingBag size={42} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                <h3>No hay pedidos {filtroPedidos === 'RESERVADO' ? 'por validar' : 'en esta sección'}</h3>
                <p>Cuando los clientes reserven en la vitrina web, sus códigos y pedidos aparecerán aquí para validar su constancia Yape.</p>
              </div>
            ) : (
              <div className="admin-solicitudes-lista">
                {pedidosFiltrados.map((pedido) => {
                  const esReservado = pedido.estado === 'RESERVADO';
                  const esVendido = pedido.estado === 'VENDIDO';
                  const mensajeExito = pedidoExitoso[pedido.codigo];

                  return (
                    <div key={pedido.id || pedido.codigo} className="admin-tarjeta-pedido">
                      <div className="admin-tarjeta-pedido__cabecera">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span className="admin-tarjeta-pedido__codigo">{pedido.codigo}</span>
                          <span
                            className={`admin-badge-estado ${
                              esVendido
                                ? 'admin-badge-estado--activo'
                                : esReservado
                                  ? 'admin-badge-estado--pendiente'
                                  : 'admin-badge-estado--rechazado'
                            }`}
                          >
                            {pedido.estado === 'RESERVADO' ? 'PENDIENTE DE YAPE' : pedido.estado}
                          </span>
                        </div>
                        <div className="admin-tarjeta-pedido__monto">
                          S/ {Number(pedido.precio || 0).toFixed(2)}
                        </div>
                      </div>

                      <div className="admin-tarjeta-pedido__cuerpo">
                        <div className="admin-tarjeta-pedido__item">
                          <span className="admin-tarjeta-pedido__etiqueta">Comercio</span>
                          <span className="admin-tarjeta-pedido__valor">
                            <strong>{pedido.negocio?.nombre}</strong> · {pedido.negocio?.direccion}
                          </span>
                        </div>

                        <div className="admin-tarjeta-pedido__item">
                          <span className="admin-tarjeta-pedido__etiqueta">Oferta</span>
                          <span className="admin-tarjeta-pedido__valor">
                            🛍️ {pedido.oferta?.titulo}
                          </span>
                        </div>

                        <div className="admin-tarjeta-pedido__item">
                          <span className="admin-tarjeta-pedido__etiqueta">Reservado</span>
                          <span className="admin-tarjeta-pedido__valor">
                            <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                            {new Date(pedido.creadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="admin-tarjeta-pedido__item">
                          <span className="admin-tarjeta-pedido__etiqueta">Vence Reserva</span>
                          <span className="admin-tarjeta-pedido__valor" style={{ color: esReservado ? '#b91c1c' : '#64748b' }}>
                            {new Date(pedido.expiraEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {mensajeExito && (
                        <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
                          {mensajeExito}
                        </div>
                      )}

                      <div className="admin-tarjeta-pedido__acciones">
                        {esReservado && (
                          <button
                            type="button"
                            className="admin-btn-validar press"
                            onClick={() => handleValidarPago(pedido)}
                            disabled={procesandoPedidoCodigo === pedido.codigo}
                          >
                            <Check size={16} /> Validar pago Yape (Marcar pagado)
                          </button>
                        )}

                        <a
                          href={enlaceWhatsappTiendaPedido(pedido)}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn-whatsapp press"
                        >
                          <MessageCircle size={16} /> Avisar a tienda por WhatsApp
                        </a>

                        {esReservado && (
                          <button
                            type="button"
                            className="admin-btn-rechazar press"
                            onClick={() => handleCancelarPedido(pedido)}
                            disabled={procesandoPedidoCodigo === pedido.codigo}
                            style={{ padding: '8px 12px', fontSize: 12.5 }}
                          >
                            <X size={14} /> Cancelar reserva
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ==========================================================================
             PESTAÑAS SOLICITUDES: PENDIENTES E HISTORIAL CON PUBLICACIÓN ASISTIDA
             ========================================================================== */
          solicitudesFiltradas.length === 0 ? (
            <div className="admin-vacio">
              <h3>No hay solicitudes {pestana === 'PENDIENTE' ? 'pendientes' : 'en el historial'}</h3>
              <p>
                {pestana === 'PENDIENTE'
                  ? 'Cuando una tienda de Huamanga complete el formulario /negocios/registro aparecerá aquí.'
                  : 'Aún no se ha aprobado o rechazado ninguna solicitud.'}
              </p>
            </div>
          ) : (
            <div className="admin-solicitudes-lista">
              {solicitudesFiltradas.map((negocio) => {
                const resExito = accionExitosa[negocio.id];
                const esActivo = negocio.estado === 'ACTIVO' || resExito?.estado === 'ACTIVO';

                return (
                  <div key={negocio.id} className="admin-tarjeta-solicitud">
                    <div className="admin-tarjeta-solicitud__cabecera">
                      <div>
                        <h2 className="admin-tarjeta-solicitud__titulo">{negocio.nombre}</h2>
                        <p className="admin-tarjeta-solicitud__responsable">
                          Responsable: <strong>{negocio.responsable}</strong> · Rubro:{' '}
                          <strong>
                            {negocio.tipo === 'OTRO' ? `Otro: ${negocio.tipoDetalle ?? '—'}` : negocio.tipo}
                          </strong>
                        </p>
                      </div>

                      <span
                        className={`admin-badge-estado ${
                          esActivo
                            ? 'admin-badge-estado--activo'
                            : negocio.estado === 'RECHAZADO'
                              ? 'admin-badge-estado--rechazado'
                              : 'admin-badge-estado--pendiente'
                        }`}
                      >
                        {negocio.estado}
                      </span>
                    </div>

                    {/* Datos del negocio */}
                    <div className="admin-datos-grid">
                      <div className="admin-dato-item">
                        <span className="admin-dato-item__etiqueta">WhatsApp de Pedidos</span>
                        <span className="admin-dato-item__valor">
                          <a
                            href={`https://wa.me/${negocio.whatsapp.startsWith('51') ? negocio.whatsapp : `51${negocio.whatsapp}`}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {negocio.whatsapp}
                          </a>
                        </span>
                      </div>

                      <div className="admin-dato-item">
                        <span className="admin-dato-item__etiqueta">Dirección en Huamanga</span>
                        <span className="admin-dato-item__valor">{negocio.direccion}</span>
                      </div>

                      <div className="admin-dato-item">
                        <span className="admin-dato-item__etiqueta">Correo de Acceso</span>
                        <span className="admin-dato-item__valor">{negocio.email}</span>
                      </div>

                      <div className="admin-dato-item">
                        <span className="admin-dato-item__etiqueta">Yape</span>
                        <span className="admin-dato-item__valor">{negocio.yape ?? 'No indicado'}</span>
                      </div>

                      {esActivo && negocio.slug && (
                        <div className="admin-dato-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="admin-dato-item__etiqueta">Perfil Público</span>
                          <span className="admin-dato-item__valor">
                            <a
                              href={`/t/${negocio.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'var(--azul-marino)', fontWeight: 800, textDecoration: 'underline' }}
                            >
                              /t/{negocio.slug} ↗
                            </a>
                          </span>
                        </div>
                      )}

                      {negocio.motivoEstado && (
                        <div className="admin-dato-item" style={{ gridColumn: '1 / -1' }}>
                          <span className="admin-dato-item__etiqueta">Motivo de Estado</span>
                          <span className="admin-dato-item__valor" style={{ color: 'var(--rojo-aviso)' }}>
                            {negocio.motivoEstado}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Acciones para Pendientes */}
                    {negocio.estado === 'PENDIENTE' && (
                      <div className="admin-tarjeta-solicitud__acciones">
                        {rechazandoId === negocio.id ? (
                          <div className="admin-caja-rechazo">
                            <label htmlFor={`motivo-${negocio.id}`} style={{ fontSize: 13, fontWeight: 700 }}>
                              Indica el motivo del rechazo (obligatorio, mínimo 3 caracteres):
                            </label>
                            <input
                              id={`motivo-${negocio.id}`}
                              type="text"
                              className="admin-caja-rechazo__input"
                              placeholder="Ej. Local fuera del radio de Huamanga / Teléfono no responde"
                              value={motivoRechazo}
                              onChange={(e) => setMotivoRechazo(e.target.value)}
                            />
                            <div className="admin-caja-rechazo__botones">
                              <button
                                type="button"
                                className="panel-boton--peligro panel-boton"
                                style={{ padding: '8px 14px', minHeight: 'auto' }}
                                onClick={() => handleRechazar(negocio)}
                                disabled={procesandoId === negocio.id}
                              >
                                Confirmar Rechazo
                              </button>
                              <button
                                type="button"
                                className="panel-boton--secundario panel-boton"
                                style={{ padding: '8px 14px', minHeight: 'auto' }}
                                onClick={() => {
                                  setRechazandoId(null);
                                  setMotivoRechazo('');
                                }}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="admin-btn-aprobar press"
                              onClick={() => handleAprobar(negocio)}
                              disabled={procesandoId === negocio.id}
                            >
                              <Check size={16} /> Aprobar Negocio
                            </button>

                            <button
                              type="button"
                              className="admin-btn-rechazar press"
                              onClick={() => {
                                setRechazandoId(negocio.id);
                                setMotivoRechazo('');
                              }}
                              disabled={procesandoId === negocio.id}
                            >
                              <X size={16} /> Rechazar
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* Acciones para Comercios Activos (Publicación asistida + WhatsApp) */}
                    {esActivo && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="admin-btn-publicar-asistida press"
                          onClick={() => abrirModalPublicar(negocio)}
                        >
                          <Plus size={16} /> Publicar oferta asistida
                        </button>

                        <a
                          href={enlaceWhatsApp(negocio, 'APROBACION')}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn-whatsapp press"
                          style={{ marginTop: 6 }}
                        >
                          <MessageCircle size={16} /> Avisar por WhatsApp
                        </a>
                      </div>
                    )}

                    {negocio.estado === 'RECHAZADO' && (
                      <div style={{ marginTop: 6 }}>
                        <a
                          href={enlaceWhatsApp(negocio, 'RECHAZO', resExito?.motivo || negocio.motivoEstado)}
                          target="_blank"
                          rel="noreferrer"
                          className="admin-btn-whatsapp press"
                          style={{ background: '#f5f5f5', color: '#333', borderColor: '#ccc' }}
                        >
                          <MessageCircle size={16} /> Avisar rechazo por WhatsApp
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </main>

      {/* ==========================================================================
          MODAL DE PUBLICACIÓN ASISTIDA CONCIERGE (JAMA Admin)
          ========================================================================== */}
      {negocioParaPublicar && (
        <div className="admin-modal-overlay" onClick={() => setNegocioParaPublicar(null)} role="dialog" aria-modal="true">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="admin-modal__cerrar"
              onClick={() => setNegocioParaPublicar(null)}
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>

            <h3 className="admin-modal__titulo">Publicar oferta asistida</h3>
            <p className="admin-modal__subtitulo">
              Para: <strong>{negocioParaPublicar.nombre}</strong> (enviado por WhatsApp por el dueño)
            </p>

            {errorPublicar && (
              <div className="panel-aviso panel-aviso--error" style={{ marginBottom: 14 }}>
                {errorPublicar}
              </div>
            )}

            {exitoPublicar && (
              <div style={{ background: '#dcfce7', color: '#15803d', padding: '12px 16px', borderRadius: 10, fontWeight: 700, marginBottom: 14 }}>
                <CheckCircle2 size={18} style={{ display: 'inline', marginRight: 6 }} />
                {exitoPublicar}
              </div>
            )}

            <form onSubmit={handlePublicarOferta}>
              <div className="admin-form-grupo">
                <label htmlFor="of-titulo">Título del producto / pack *</label>
                <input
                  id="of-titulo"
                  type="text"
                  className="admin-form-input"
                  placeholder="Ej. Pack de 6 panes de yema y roscas"
                  value={formOferta.titulo}
                  onChange={(e) => setFormOferta({ ...formOferta, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="admin-form-grupo">
                <label htmlFor="of-desc">Descripción (opcional)</label>
                <textarea
                  id="of-desc"
                  rows="2"
                  className="admin-form-textarea"
                  placeholder="Ej. Horneados hoy a las 11 am. Excelente estado."
                  value={formOferta.descripcion}
                  onChange={(e) => setFormOferta({ ...formOferta, descripcion: e.target.value })}
                />
              </div>

              <div className="admin-form-row">
                <div className="admin-form-grupo">
                  <label htmlFor="of-pc">Precio Normal Carta (S/) *</label>
                  <input
                    id="of-pc"
                    type="number"
                    step="0.10"
                    min="0.50"
                    className="admin-form-input"
                    placeholder="12.00"
                    value={formOferta.precioCarta}
                    onChange={(e) => setFormOferta({ ...formOferta, precioCarta: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-grupo">
                  <label htmlFor="of-po">Precio Oferta JAMA (S/) *</label>
                  <input
                    id="of-po"
                    type="number"
                    step="0.10"
                    min="0.50"
                    className="admin-form-input"
                    placeholder="6.00"
                    value={formOferta.precioOferta}
                    onChange={(e) => setFormOferta({ ...formOferta, precioOferta: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-row">
                <div className="admin-form-grupo">
                  <label htmlFor="of-stock">Raciones disponibles (Stock) *</label>
                  <input
                    id="of-stock"
                    type="number"
                    min="1"
                    className="admin-form-input"
                    value={formOferta.stock}
                    onChange={(e) => setFormOferta({ ...formOferta, stock: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-grupo">
                  <label htmlFor="of-hora">Hora límite de recojo *</label>
                  <input
                    id="of-hora"
                    type="time"
                    className="admin-form-input"
                    value={formOferta.horaLimite}
                    onChange={(e) => setFormOferta({ ...formOferta, horaLimite: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="admin-form-grupo">
                <label htmlFor="of-foto">Foto del excedente (opcional)</label>
                <input
                  id="of-foto"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="admin-form-input"
                  onChange={(e) => setArchivoFoto(e.target.files[0] || null)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button
                  type="submit"
                  className="panel-boton panel-boton--primario"
                  style={{ flex: 1, minHeight: 46 }}
                  disabled={subiendoOferta}
                >
                  {subiendoOferta ? 'Publicando oferta...' : 'Publicar oferta en vitrina'}
                </button>
                <button
                  type="button"
                  className="panel-boton panel-boton--secundario"
                  onClick={() => setNegocioParaPublicar(null)}
                  disabled={subiendoOferta}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}