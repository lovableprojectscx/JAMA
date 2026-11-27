import hojaFotos from '../assets/jama-demo-foods.webp';

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
}

export default function EjemploCard({ ejemplo }) {
  const { recorteFoto } = ejemplo;
  // Contenedor 4:3 (alto = 0.75 * ancho). Con height: auto la imagen conserva
  // su proporción natural (0% distorsión) y centramos verticalmente cada celda.
  const RATIO_CONTENEDOR = 3 / 4;
  const topPorcentaje =
    -((recorteFoto.top + recorteFoto.height / 2) / (recorteFoto.width * RATIO_CONTENEDOR) - 0.5) * 100;

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
            height: 'auto',
            left: `${(-100 * recorteFoto.left) / recorteFoto.width}%`,
            top: `${topPorcentaje}%`,
          }}
        />
        <div className="oferta-card__badges-flotantes">
          <span className="oferta-card__descuento-pill">-{ejemplo.porcentajeDescuento}%</span>
          <span className="ejemplo-card__cat-pill">{ejemplo.categoria}</span>
        </div>
      </div>
      <div className="ejemplo-card__cuerpo">
        <h3 className="ejemplo-card__titulo">{ejemplo.titulo}</h3>
        <p className="ejemplo-card__descripcion">{ejemplo.descripcion}</p>
        <div className="ejemplo-card__precios">
          <span className="ejemplo-card__precio-oferta">{formatearPrecio(ejemplo.precioOferta)}</span>
          <span className="ejemplo-card__precio-carta">{formatearPrecio(ejemplo.precioCarta)}</span>
        </div>
        <p className="ejemplo-card__etiqueta">Ejemplo · foto ilustrativa</p>
      </div>
    </article>
  );
}
