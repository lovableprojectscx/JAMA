const INSIGNIAS = [
  { icono: '🥐', texto: 'Fresco de hoy' },
  { icono: '🏷️', texto: 'Precio claro' },
  { icono: '📍', texto: 'Recojo local' },
];

export default function Hero({ onVerOfertas }) {
  return (
    <section className="hero">
      <h1 className="hero__titulo">Lo rico del día, antes de que se acabe</h1>
      <p className="hero__subtitulo">
        Pastelerías y panaderías de Ayacucho bajan el precio de lo que les queda al cierre.
        Reservas gratis, pagas y recoges directo con el negocio.
      </p>
      <button type="button" className="hero__boton" onClick={onVerOfertas}>
        Ver ofertas de hoy
      </button>
      <ul className="hero__insignias">
        {INSIGNIAS.map((insignia) => (
          <li key={insignia.texto} className="hero__insignia">
            <span aria-hidden="true">{insignia.icono}</span> {insignia.texto}
          </li>
        ))}
      </ul>
    </section>
  );
}
