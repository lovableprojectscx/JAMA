import './FiltroCategorias.css';

const DEFINICION_CATEGORIAS = [
  { id: 'TODAS', etiqueta: 'Todas', emoji: '✨' },
  { id: 'PASTELERIA', etiqueta: 'Pastelerías', emoji: '🍰' },
  { id: 'PANADERIA', etiqueta: 'Panaderías', emoji: '🥖' },
  { id: 'CAFETERIA', etiqueta: 'Cafeterías', emoji: '☕' },
  { id: 'RESTAURANTE', etiqueta: 'Comida', emoji: '🍲' },
  { id: 'JUGUERIA', etiqueta: 'Juguerías', emoji: '🥤' },
  { id: 'OTRO', etiqueta: 'Otros', emoji: '🏪' },
];

export default function FiltroCategorias({
  categoriaSeleccionada = 'TODAS',
  onSeleccionarCategoria,
  conteos = {},
}) {
  // Solo mostramos 'TODAS' y las categorías que tienen al menos 1 oferta activa
  const categoriasVisibles = DEFINICION_CATEGORIAS.filter(
    (cat) => cat.id === 'TODAS' || (conteos[cat.id] ?? 0) > 0
  );

  return (
    <nav className="filtro-categorias-contenedor" aria-label="Filtrar por tipo de comercio">
      <div className="filtro-categorias-scroll" role="tablist">
        {categoriasVisibles.map((cat) => {
          const activa = categoriaSeleccionada === cat.id;
          const cantidad = cat.id === 'TODAS' ? conteos.TODAS ?? 0 : conteos[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activa}
              className={`filtro-pill press ${activa ? 'filtro-pill--activa' : ''}`}
              onClick={() => onSeleccionarCategoria(cat.id)}
            >
              <span className="filtro-pill__emoji" aria-hidden="true">
                {cat.emoji}
              </span>
              <span className="filtro-pill__etiqueta">{cat.etiqueta}</span>
              {cantidad > 0 && (
                <span className={`filtro-pill__badge ${activa ? 'filtro-pill__badge--activa' : ''}`}>
                  {cantidad}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
