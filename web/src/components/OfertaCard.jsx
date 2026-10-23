import { Clock3, MapPin } from 'lucide-react';

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
}

function formatearHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function OfertaCard({ oferta, onPedir, cargando }) {
  const precioVigente = oferta.precioVigente ?? oferta.precioOferta;
  const descuentoVigente =
    oferta.porcentajeDescuento ?? Math.round((1 - precioVigente / oferta.precioCarta) * 100);

  return (
    <article className="oferta-card">
      <div className="oferta-card__foto-contenedor">
        {oferta.fotoUrl ? (
          <img
            className="oferta-card__foto"
            src={oferta.fotoUrl}
            alt={oferta.titulo}
            loading="lazy"
            width="400"
            height="400"
          />
        ) : (
          <div className="oferta-card__foto oferta-card__foto--vacia" aria-hidden="true" />
        )}
        <span className="oferta-card__descuento">-{descuentoVigente}%</span>
      </div>

      <div className="oferta-card__cuerpo">
        {oferta.negocioNombre && (
          <div className="oferta-card__tienda">
            <MapPin size={13} className="oferta-card__pin" aria-hidden="true" />
            <span className="oferta-card__tienda-nombre">{oferta.negocioNombre}</span>
            {oferta.negocioDireccion && (
              <span className="oferta-card__tienda-direccion"> · {oferta.negocioDireccion}</span>
            )}
            {oferta.enlaceMaps && (
              <a
                href={oferta.enlaceMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="oferta-card__tienda-maps"
                onClick={(e) => e.stopPropagation()}
              >
                Mapa ↗
              </a>
            )}
          </div>
        )}

        <h2 className="oferta-card__titulo">{oferta.titulo}</h2>
        {oferta.descripcion && <p className="oferta-card__descripcion">{oferta.descripcion}</p>}

        <div className="oferta-card__precios">
          <span className="oferta-card__precio-carta">{formatearPrecio(oferta.precioCarta)}</span>
          <span className="oferta-card__precio-oferta">{formatearPrecio(precioVigente)}</span>
        </div>

        {oferta.proximoTramo && (
          <p className="oferta-card__proximo-tramo">
            Baja a {formatearPrecio(oferta.proximoTramo.precio)} a las {oferta.proximoTramo.desde}
          </p>
        )}

        <p className="oferta-card__detalle">
          <Clock3 aria-hidden="true" />
          Quedan {oferta.stock} · hasta las {formatearHora(oferta.horaLimite)}
        </p>

        <button
          type="button"
          className="boton-pedir"
          onClick={() => onPedir(oferta)}
          disabled={cargando}
        >
          {cargando ? 'Generando...' : 'Pedir'}
        </button>
      </div>
    </article>
  );
}
