function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
}

export default function EjemploCard({ ejemplo }) {
  return (
    <article className="ejemplo-card" aria-hidden="true">
      <div className="ejemplo-card__icono">{ejemplo.icono}</div>
      <div className="ejemplo-card__cuerpo">
        <h3 className="ejemplo-card__titulo">{ejemplo.titulo}</h3>
        <p className="ejemplo-card__descripcion">{ejemplo.descripcion}</p>
        <div className="ejemplo-card__precios">
          <span className="ejemplo-card__precio-carta">{formatearPrecio(ejemplo.precioCarta)}</span>
          <span className="ejemplo-card__precio-oferta">{formatearPrecio(ejemplo.precioOferta)}</span>
        </div>
      </div>
    </article>
  );
}
