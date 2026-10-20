const PESTANAS = [
  { id: 'ofertas', etiqueta: 'Ofertas' },
  { id: 'publicar', etiqueta: 'Publicar' },
  { id: 'pedidos', etiqueta: 'Pedidos' },
];

export default function NavInferior({ pantallaActiva, onCambiarPantalla }) {
  return (
    <nav className="panel-nav">
      {PESTANAS.map((pestana) => (
        <button
          key={pestana.id}
          type="button"
          className={`panel-nav__boton ${pantallaActiva === pestana.id ? 'panel-nav__boton--activo' : ''}`}
          onClick={() => onCambiarPantalla(pestana.id)}
        >
          {pestana.etiqueta}
        </button>
      ))}
    </nav>
  );
}
