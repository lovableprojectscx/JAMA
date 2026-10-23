import { useState, useEffect, useCallback } from 'react';
import { Check, X, MessageCircle, RefreshCw } from 'lucide-react';
import { listarSolicitudesAdmin, resolverSolicitudAdmin } from './api.js';
import logoJama from '../assets/jama-logo.png';
import './admin.css';

export default function AdminPanel({ token, admin, onLogout }) {
  const [pestana, setPestana] = useState('PENDIENTE');
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de acción por negocio
  const [rechazandoId, setRechazandoId] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [accionExitosa, setAccionExitosa] = useState({});

  const cargarDatos = useCallback(async (estadoFiltro = pestana) => {
    setCargando(true);
    setError(null);
    try {
      // Si la pestaña es HISTORIAL, traemos todas o listamos
      const datos = await listarSolicitudesAdmin(token, estadoFiltro === 'HISTORIAL' ? null : estadoFiltro);
      setSolicitudes(datos);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las solicitudes.');
    } finally {
      setCargando(false);
    }
  }, [pestana, token]);

  useEffect(() => {
    cargarDatos(pestana);
  }, [cargarDatos, pestana]);

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
      // Actualizar en la lista local
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

  const solicitudesFiltradas =
    pestana === 'PENDIENTE'
      ? solicitudes.filter((s) => s.estado === 'PENDIENTE' || accionExitosa[s.id])
      : solicitudes.filter((s) => s.estado !== 'PENDIENTE');

  return (
    <div className="admin-app">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header__interior">
          <div className="admin-header__marca">
            <img src={logoJama} alt="JAMA" className="admin-header__logo" />
            <span className="admin-header__tag">ADMIN</span>
          </div>
          <div className="admin-header__usuario">
            <span className="admin-header__nombre">{admin?.nombre ?? 'Administrador'}</span>
            <button type="button" onClick={onLogout} className="admin-header__btn-salir">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <main className="admin-contenido">
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
            className={`admin-pestana ${pestana === 'HISTORIAL' ? 'admin-pestana--activa' : ''}`}
            onClick={() => setPestana('HISTORIAL')}
          >
            Historial (Revisados)
          </button>

          <button
            type="button"
            onClick={() => cargarDatos(pestana)}
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
          <div className="panel-estado">Cargando solicitudes...</div>
        ) : solicitudesFiltradas.length === 0 ? (
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
              return (
                <div key={negocio.id} className="admin-tarjeta-solicitud">
                  <div className="admin-tarjeta-solicitud__cabecera">
                    <div>
                      <h2 className="admin-tarjeta-solicitud__titulo">{negocio.nombre}</h2>
                      <p className="admin-tarjeta-solicitud__responsable">
                        Responsable: <strong>{negocio.responsable}</strong> · Rubro:{' '}
                        <strong>{negocio.tipo}</strong>
                      </p>
                    </div>

                    <span
                      className={`admin-badge-estado ${
                        negocio.estado === 'ACTIVO'
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
                        <a href={`https://wa.me/${negocio.whatsapp.startsWith('51') ? negocio.whatsapp : `51${negocio.whatsapp}`}`} target="_blank" rel="noreferrer">
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

                    {negocio.motivoEstado && (
                      <div className="admin-dato-item" style={{ gridColumn: '1 / -1' }}>
                        <span className="admin-dato-item__etiqueta">Motivo de Estado</span>
                        <span className="admin-dato-item__valor" style={{ color: 'var(--rojo-aviso)' }}>
                          {negocio.motivoEstado}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
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

                  {/* Botón WhatsApp tras Aprobación o Rechazo */}
                  {(negocio.estado === 'ACTIVO' || resExito?.estado === 'ACTIVO') && (
                    <div style={{ marginTop: 6 }}>
                      <a
                        href={enlaceWhatsApp(negocio, 'APROBACION')}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-btn-whatsapp press"
                      >
                        <MessageCircle size={16} /> Avisar aprobación por WhatsApp
                      </a>
                    </div>
                  )}

                  {(negocio.estado === 'RECHAZADO' || resExito?.estado === 'RECHAZADO') && (
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
        )}
      </main>
    </div>
  );
}
