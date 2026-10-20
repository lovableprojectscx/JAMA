import { useEffect, useState } from 'react';
import { obtenerMisOfertasDeHoy, cambiarEstadoOferta } from '../api.js';

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
}

function formatearHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

const PUEDE_CAMBIAR_ESTADO = new Set(['ACTIVA', 'PAUSADA']);

export default function MisOfertasPantalla({ token }) {
  const [ofertas, setOfertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [ofertaEnProceso, setOfertaEnProceso] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerMisOfertasDeHoy(token);
      setOfertas(datos);
    } catch {
      setError('No pudimos cargar tus ofertas de hoy.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCambiarEstado(oferta) {
    const nuevoEstado = oferta.estado === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA';
    setOfertaEnProceso(oferta.id);
    try {
      const actualizada = await cambiarEstadoOferta(token, oferta.id, nuevoEstado);
      setOfertas((actuales) => actuales.map((o) => (o.id === actualizada.id ? actualizada : o)));
    } catch {
      setError('No pudimos actualizar esta oferta. Intenta de nuevo.');
    } finally {
      setOfertaEnProceso(null);
    }
  }

  return (
    <div className="panel-pantalla">
      <h1 className="panel-pantalla__titulo">Mis ofertas de hoy</h1>

      {cargando && <p className="panel-estado">Cargando...</p>}
      {!cargando && error && <p className="panel-estado panel-estado--error">{error}</p>}
      {!cargando && !error && ofertas.length === 0 && (
        <p className="panel-estado">Todavía no publicaste ninguna oferta hoy.</p>
      )}

      <div className="panel-lista">
        {ofertas.map((oferta) => (
          <article key={oferta.id} className="panel-tarjeta">
            <div className="panel-tarjeta__cabecera">
              <h2 className="panel-tarjeta__titulo">{oferta.titulo}</h2>
              <span className={`panel-chip panel-chip--${oferta.estado.toLowerCase()}`}>{oferta.estado}</span>
            </div>

            <p className="panel-tarjeta__linea">
              Quedan <strong>{oferta.stock}</strong> · {formatearPrecio(oferta.precioVigente)}
              {oferta.precioVigente < oferta.precioOferta && (
                <span className="panel-tarjeta__detalle"> (ya bajó de {formatearPrecio(oferta.precioOferta)})</span>
              )}
            </p>
            {oferta.proximoTramo && (
              <p className="panel-tarjeta__detalle">
                Baja a {formatearPrecio(oferta.proximoTramo.precio)} a las {oferta.proximoTramo.desde}
              </p>
            )}
            <p className="panel-tarjeta__detalle">Recojo hasta las {formatearHora(oferta.horaLimite)}</p>

            {PUEDE_CAMBIAR_ESTADO.has(oferta.estado) && (
              <button
                type="button"
                className="panel-boton panel-boton--secundario"
                disabled={ofertaEnProceso === oferta.id}
                onClick={() => handleCambiarEstado(oferta)}
              >
                {ofertaEnProceso === oferta.id
                  ? 'Guardando...'
                  : oferta.estado === 'ACTIVA'
                    ? 'Pausar'
                    : 'Reanudar'}
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
