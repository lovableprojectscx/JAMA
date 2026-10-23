import { Clock3, MapPin, Navigation, ShoppingBag, Store } from 'lucide-react';

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

  const nombreTienda = oferta.negocioNombre || 'Pastelería / Panadería';
  const direccionTienda = oferta.negocioDireccion
    ? `${oferta.negocioDireccion} (Centro)`
    : 'Centro, Huamanga';

  return (
    <article className="oferta-card">
      {/* Contenedor de Foto con Badges */}
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
          <div className="oferta-card__foto-placeholder">
            <div className="oferta-card__placeholder-icon-wrap">
              <ShoppingBag size={32} />
            </div>
            <span className="oferta-card__placeholder-texto">Lote fresco de hoy</span>
          </div>
        )}

        <div className="oferta-card__badges-flotantes">
          <span className="oferta-card__descuento-pill">-{descuentoVigente}%</span>
          {oferta.stock <= 3 && oferta.stock > 0 && (
            <span className="oferta-card__urgencia-pill">¡Quedan {oferta.stock}!</span>
          )}
        </div>
      </div>

      {/* Cuerpo de la tarjeta */}
      <div className="oferta-card__cuerpo">
        {/* Cabecera del Comercio y Ubicación en Centro */}
        <div className="oferta-card__comercio-cabecera">
          <div className="oferta-card__comercio-datos">
            <div className="oferta-card__comercio-nombre-row">
              <Store size={14} className="oferta-card__icono-tienda" aria-hidden="true" />
              <span className="oferta-card__comercio-nombre">{nombreTienda}</span>
            </div>
            <p className="oferta-card__comercio-direccion">
              <MapPin size={12} className="oferta-card__icono-pin" aria-hidden="true" />
              <span>{direccionTienda}</span>
            </p>
          </div>

          {oferta.enlaceMaps && (
            <a
              href={oferta.enlaceMaps}
              target="_blank"
              rel="noopener noreferrer"
              className="oferta-card__link-maps press"
              onClick={(e) => e.stopPropagation()}
              title="Abrir ubicación en Google Maps"
            >
              <Navigation size={12} aria-hidden="true" />
              <span>Mapa</span>
            </a>
          )}
        </div>

        {/* Título y descripción */}
        <h3 className="oferta-card__titulo">{oferta.titulo}</h3>
        {oferta.descripcion && <p className="oferta-card__descripcion">{oferta.descripcion}</p>}

        {/* Precios y Horario */}
        <div className="oferta-card__meta-bloque">
          <div className="oferta-card__precios-fila">
            <div className="oferta-card__precios">
              <span className="oferta-card__precio-vigente">{formatearPrecio(precioVigente)}</span>
              <span className="oferta-card__precio-original">{formatearPrecio(oferta.precioCarta)}</span>
            </div>
            <div className="oferta-card__horario-badge">
              <Clock3 size={13} aria-hidden="true" />
              <span>Hasta {formatearHora(oferta.horaLimite)}</span>
            </div>
          </div>

          {oferta.proximoTramo && (
            <div className="oferta-card__aviso-tramo">
              ⏳ Baja a <strong>{formatearPrecio(oferta.proximoTramo.precio)}</strong> a las {oferta.proximoTramo.desde}
            </div>
          )}
        </div>

        {/* Botón de acción */}
        <button
          type="button"
          className="oferta-card__btn-pedir press"
          onClick={() => onPedir(oferta)}
          disabled={cargando}
        >
          {cargando ? 'Apartando...' : `Reservar · ${formatearPrecio(precioVigente)}`}
        </button>
      </div>
    </article>
  );
}
