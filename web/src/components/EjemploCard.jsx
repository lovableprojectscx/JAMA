import hojaFotos from '../assets/jama-demo-foods.webp';

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
}

export default function EjemploCard({ ejemplo }) {
  const { recorteFoto } = ejemplo;
  return (
    <article className="ejemplo-card" aria-hidden="true">
      <div className="ejemplo-card__foto-contenedor">
        <img
          className="ejemplo-card__foto"
          src={hojaFotos}
          alt=""
          loading="lazy"
          style={{
            width: `${(100 * recorteFoto.sheetAncho) / recorteFoto.width}%`,
            height: `${(100 * recorteFoto.sheetAlto) / recorteFoto.height}%`,
            left: `${(-100 * recorteFoto.left) / recorteFoto.width}%`,
            top: `${(-100 * recorteFoto.top) / recorteFoto.height}%`,
          }}
        />
      </div>
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
