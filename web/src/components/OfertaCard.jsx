function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
}

function formatearHora(fechaIso) {
  return new Date(fechaIso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

export default function OfertaCard({ oferta, onPedir, cargando }) {
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
            height="260"
          />
        ) : (
          <div className="oferta-card__foto oferta-card__foto--vacia" aria-hidden="true" />
        )}
        <span className="oferta-card__descuento">-{oferta.porcentajeDescuento}%</span>
      </div>

      <div className="oferta-card__cuerpo">
        <h2 className="oferta-card__titulo">{oferta.titulo}</h2>
        {oferta.descripcion && <p className="oferta-card__descripcion">{oferta.descripcion}</p>}

        <div className="oferta-card__precios">
          <span className="oferta-card__precio-carta">{formatearPrecio(oferta.precioCarta)}</span>
          <span className="oferta-card__precio-oferta">{formatearPrecio(oferta.precioOferta)}</span>
        </div>

        <p className="oferta-card__detalle">
          Quedan {oferta.stock} · recojo hasta las {formatearHora(oferta.horaLimite)}
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
