import { useEffect, useState, useCallback } from 'react';
import { Edit3, RotateCcw, Clock, X, Calendar, ShoppingBag } from 'lucide-react';
import { obtenerMisOfertasDeHoy, obtenerTodasMisOfertas, cambiarEstadoOferta, editarOferta } from '../api.js';

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
}

function formatearHora(fechaIso) {
  if (!fechaIso) return '';
  return new Date(fechaIso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return '';
  return new Date(fechaIso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

function aDatetimeLocal(fechaIso) {
  if (!fechaIso) return '';
  const d = new Date(fechaIso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const anio = d.getFullYear();
  const mes = pad(d.getMonth() + 1);
  const dia = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${anio}-${mes}-${dia}T${hh}:${mm}`;
}

const PUEDE_CAMBIAR_ESTADO = new Set(['ACTIVA', 'PAUSADA']);

export default function MisOfertasPantalla({ token, onRepublicar, onVerImpacto }) {
  const [tabActiva, setTabActiva] = useState('hoy'); // 'hoy' | 'historial'
  const [ofertasHoy, setOfertasHoy] = useState([]);
  const [ofertasTodas, setOfertasTodas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [ofertaEnProceso, setOfertaEnProceso] = useState(null);

  // Estado para el modal de edición
  const [ofertaEditando, setOfertaEditando] = useState(null);
  const [datosEdit, setDatosEdit] = useState({
    titulo: '',
    descripcion: '',
    precioCarta: '',
    precioOferta: '',
    stock: '',
    horaLimite: '',
  });
  const [guardandoEdit, setGuardandoEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState(null);

  const cargarOfertas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosHoy, datosTodas] = await Promise.all([
        obtenerMisOfertasDeHoy(token),
        obtenerTodasMisOfertas(token),
      ]);
      setOfertasHoy(datosHoy);
      setOfertasTodas(datosTodas);
    } catch {
      setError('No pudimos cargar tus ofertas. Revisa tu conexión.');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarOfertas();
  }, [cargarOfertas]);

  async function handleCambiarEstado(oferta) {
    const nuevoEstado = oferta.estado === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA';
    setOfertaEnProceso(oferta.id);
    setError(null);
    try {
      const actualizada = await cambiarEstadoOferta(token, oferta.id, nuevoEstado);
      setOfertasHoy((prev) => prev.map((o) => (o.id === actualizada.id ? actualizada : o)));
      setOfertasTodas((prev) => prev.map((o) => (o.id === actualizada.id ? actualizada : o)));
    } catch {
      setError('No pudimos cambiar el estado de la oferta.');
    } finally {
      setOfertaEnProceso(null);
    }
  }

  function abrirEdicion(oferta) {
    setErrorEdit(null);
    setOfertaEditando(oferta);
    setDatosEdit({
      titulo: oferta.titulo || '',
      descripcion: oferta.descripcion || '',
      precioCarta: oferta.precioCarta || '',
      precioOferta: oferta.precioOferta || '',
      stock: oferta.stock ?? '',
      horaLimite: aDatetimeLocal(oferta.horaLimite),
    });
  }

  function cerrarEdicion() {
    setOfertaEditando(null);
    setErrorEdit(null);
  }

  async function handleGuardarEdicion(e) {
    e.preventDefault();
    setGuardandoEdit(true);
    setErrorEdit(null);

    try {
      const payload = {
        titulo: datosEdit.titulo.trim(),
        descripcion: datosEdit.descripcion.trim(),
        precioCarta: Number(datosEdit.precioCarta),
        precioOferta: Number(datosEdit.precioOferta),
        stock: Number(datosEdit.stock),
      };

      if (datosEdit.horaLimite) {
        payload.horaLimite = new Date(datosEdit.horaLimite).toISOString();
      }

      const actualizada = await editarOferta(token, ofertaEditando.id, payload);

      setOfertasHoy((prev) => prev.map((o) => (o.id === actualizada.id ? actualizada : o)));
      setOfertasTodas((prev) => prev.map((o) => (o.id === actualizada.id ? actualizada : o)));

      cerrarEdicion();
      setMensajeExito('¡Oferta actualizada con éxito!');
      setTimeout(() => setMensajeExito(null), 3000);
    } catch (err) {
      setErrorEdit(err.message || 'No se pudo guardar la edición de la oferta');
    } finally {
      setGuardandoEdit(false);
    }
  }

  return (
    <div className="panel-pantalla">
      <div className="panel-pantalla__titulo-row">
        <h1 className="panel-pantalla__titulo">Mis ofertas</h1>
        {onVerImpacto && (
          <button
            type="button"
            onClick={onVerImpacto}
            className="panel-btn-impacto-pill press"
            title="Ver métricas de impacto comercial"
          >
            🌱 Ver mi impacto
          </button>
        )}
      </div>

      {/* Selector de pestañas: Hoy vs Historial */}
      <div className="panel-tabs-ofertas" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'hoy'}
          className={`panel-tab-btn ${tabActiva === 'hoy' ? 'panel-tab-btn--activo' : ''}`}
          onClick={() => setTabActiva('hoy')}
        >
          <span>Ofertas de hoy</span>
          {ofertasHoy.length > 0 && <span className="panel-tab-badge">{ofertasHoy.length}</span>}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === 'historial'}
          className={`panel-tab-btn ${tabActiva === 'historial' ? 'panel-tab-btn--activo' : ''}`}
          onClick={() => setTabActiva('historial')}
        >
          <RotateCcw size={14} />
          <span>Historial / Catálogo</span>
        </button>
      </div>

      {mensajeExito && <div className="panel-aviso panel-aviso--exito">{mensajeExito}</div>}
      {error && <div className="panel-aviso panel-aviso--error">{error}</div>}

      {cargando && <p className="panel-estado">Cargando tus ofertas...</p>}

      {/* PESTAÑA 1: OFERTAS DE HOY */}
      {!cargando && tabActiva === 'hoy' && (
        <>
          {ofertasHoy.length === 0 ? (
            <div className="panel-estado">
              <ShoppingBag size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>Todavía no has publicado ninguna oferta hoy.</p>
              <p style={{ fontSize: '13px', color: 'var(--gris-texto)', marginTop: '4px' }}>
                Ve a "Publicar" para crear una nueva o a "Historial" para republicar en 1 clic.
              </p>
            </div>
          ) : (
            <div className="panel-lista">
              {ofertasHoy.map((oferta) => (
                <article key={oferta.id} className="panel-tarjeta">
                  <div className="panel-tarjeta__cabecera">
                    <h2 className="panel-tarjeta__titulo">{oferta.titulo}</h2>
                    <span className={`panel-chip panel-chip--${oferta.estado.toLowerCase()}`}>
                      {oferta.estado}
                    </span>
                  </div>

                  <p className="panel-tarjeta__linea">
                    Quedan <strong>{oferta.stock} unid.</strong> · {formatearPrecio(oferta.precioVigente)}
                    {oferta.precioCarta && (
                      <span className="panel-tarjeta__detalle" style={{ textDecoration: 'line-through', marginLeft: '6px' }}>
                        {formatearPrecio(oferta.precioCarta)}
                      </span>
                    )}
                  </p>

                  {oferta.proximoTramo && (
                    <p className="panel-tarjeta__detalle">
                      Baja a {formatearPrecio(oferta.proximoTramo.precio)} a las {oferta.proximoTramo.desde}
                    </p>
                  )}
                  <p className="panel-tarjeta__detalle">
                    <Clock size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '4px' }} />
                    Recojo hasta las {formatearHora(oferta.horaLimite)}
                  </p>

                  <div className="panel-tarjeta__acciones">
                    {/* Botón de Edición Rápida */}
                    <button
                      type="button"
                      className="panel-boton--editar press"
                      onClick={() => abrirEdicion(oferta)}
                    >
                      <Edit3 size={14} /> Editar
                    </button>

                    {/* Botón Pausar / Reanudar */}
                    {PUEDE_CAMBIAR_ESTADO.has(oferta.estado) && (
                      <button
                        type="button"
                        className="panel-boton panel-boton--secundario press"
                        disabled={ofertaEnProceso === oferta.id}
                        onClick={() => handleCambiarEstado(oferta)}
                        style={{ padding: '8px 14px', minHeight: 'auto' }}
                      >
                        {ofertaEnProceso === oferta.id
                          ? 'Guardando...'
                          : oferta.estado === 'ACTIVA'
                            ? 'Pausar'
                            : 'Reanudar'}
                      </button>
                    )}

                    {/* Botón Republicar para Agotadas */}
                    {oferta.estado === 'AGOTADA' && onRepublicar && (
                      <button
                        type="button"
                        className="panel-boton--republicar press"
                        onClick={() => onRepublicar(oferta)}
                      >
                        <RotateCcw size={14} /> Republicar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* PESTAÑA 2: HISTORIAL COMPLETO / REPUBLICACIÓN EN 1 CLIC */}
      {!cargando && tabActiva === 'historial' && (
        <>
          {ofertasTodas.length === 0 ? (
            <p className="panel-estado">No hay ofertas en el historial aún.</p>
          ) : (
            <div className="panel-lista">
              {ofertasTodas.map((oferta) => (
                <article key={oferta.id} className="panel-tarjeta">
                  <div className="panel-tarjeta__cabecera">
                    <h2 className="panel-tarjeta__titulo">{oferta.titulo}</h2>
                    <span className="panel-tarjeta__detalle">
                      <Calendar size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                      {formatearFecha(oferta.horaElaboracion)}
                    </span>
                  </div>

                  <p className="panel-tarjeta__linea">
                    Precio: <strong>{formatearPrecio(oferta.precioOferta)}</strong> (antes {formatearPrecio(oferta.precioCarta)})
                  </p>

                  {oferta.descripcion && (
                    <p className="panel-tarjeta__detalle" style={{ fontStyle: 'italic' }}>
                      "{oferta.descripcion}"
                    </p>
                  )}

                  <div className="panel-tarjeta__acciones">
                    {onRepublicar && (
                      <button
                        type="button"
                        className="panel-boton--republicar press"
                        onClick={() => onRepublicar(oferta)}
                      >
                        <RotateCcw size={14} /> Republicar para hoy en 1 clic
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {/* MODAL BOTTOM-SHEET DE EDICIÓN DE OFERTA */}
      {ofertaEditando && (
        <div className="panel-modal-overlay" onClick={cerrarEdicion} role="dialog" aria-modal="true">
          <div className="panel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="panel-modal__cabecera">
              <h3 className="panel-modal__titulo">Editar oferta</h3>
              <button
                type="button"
                className="panel-modal__cerrar press"
                onClick={cerrarEdicion}
                aria-label="Cerrar modal de edición"
              >
                <X size={20} />
              </button>
            </div>

            {errorEdit && <div className="panel-aviso panel-aviso--error">{errorEdit}</div>}

            <form onSubmit={handleGuardarEdicion} className="panel-formulario">
              <label className="panel-campo">
                <span className="panel-campo__etiqueta">Título de la oferta</span>
                <input
                  className="panel-campo__input"
                  required
                  maxLength={100}
                  value={datosEdit.titulo}
                  onChange={(e) => setDatosEdit({ ...datosEdit, titulo: e.target.value })}
                />
              </label>

              <div className="panel-fila">
                <label className="panel-campo">
                  <span className="panel-campo__etiqueta">Precio carta (S/)</span>
                  <input
                    className="panel-campo__input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={datosEdit.precioCarta}
                    onChange={(e) => setDatosEdit({ ...datosEdit, precioCarta: e.target.value })}
                  />
                </label>

                <label className="panel-campo">
                  <span className="panel-campo__etiqueta">Precio oferta (S/)</span>
                  <input
                    className="panel-campo__input"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={datosEdit.precioOferta}
                    onChange={(e) => setDatosEdit({ ...datosEdit, precioOferta: e.target.value })}
                  />
                </label>
              </div>

              <div className="panel-fila">
                <label className="panel-campo">
                  <span className="panel-campo__etiqueta">Stock disponible</span>
                  <input
                    className="panel-campo__input"
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={datosEdit.stock}
                    onChange={(e) => setDatosEdit({ ...datosEdit, stock: e.target.value })}
                  />
                </label>

                <label className="panel-campo">
                  <span className="panel-campo__etiqueta">Hora límite recojo</span>
                  <input
                    className="panel-campo__input"
                    type="datetime-local"
                    value={datosEdit.horaLimite}
                    onChange={(e) => setDatosEdit({ ...datosEdit, horaLimite: e.target.value })}
                  />
                </label>
              </div>

              <label className="panel-campo">
                <span className="panel-campo__etiqueta">Descripción (opcional)</span>
                <textarea
                  className="panel-campo__input panel-campo__input--textarea"
                  maxLength={200}
                  value={datosEdit.descripcion}
                  onChange={(e) => setDatosEdit({ ...datosEdit, descripcion: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="panel-boton panel-boton--secundario press"
                  onClick={cerrarEdicion}
                  disabled={guardandoEdit}
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="panel-boton panel-boton--primario press"
                  disabled={guardandoEdit}
                  style={{ flex: 1.5 }}
                >
                  {guardandoEdit ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
