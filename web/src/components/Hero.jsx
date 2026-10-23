import { ArrowRight, CalendarCheck, BadgePercent, ShieldCheck } from 'lucide-react';
import heroImg from '../assets/jama-hero.webp';

const INSIGNIAS = [
  { Icono: CalendarCheck, texto: 'Horneado hoy' },
  { Icono: BadgePercent, texto: '50% a 70% menos' },
  { Icono: ShieldCheck, texto: 'Pagas en tienda' },
];

export default function Hero({ onVerOfertas }) {
  return (
    <section className="hero">
      <div className="hero__grid">
        <div className="hero__texto">
          <p className="hero__etiqueta">
            <span className="hero__punto" aria-hidden="true" />
            Huamanga · Centro · Recojo hoy 6 a 7:30 pm
          </p>
          <h1 className="hero__titulo">
            Lo rico del centro,
            <br />
            a <span className="hero__destacado">mitad de precio</span>
          </h1>
          <p className="hero__subtitulo">
            Pastelerías liquidan su lote fresco del día. Apartas en 1 toque, pagas al recoger con Yape.
          </p>
          <button type="button" className="hero__boton press" onClick={onVerOfertas}>
            Ver ofertas de hoy <ArrowRight aria-hidden="true" />
          </button>
        </div>

        <div className="hero__visual">
          <img
            className="hero__imagen"
            src={heroImg}
            alt="Celular mostrando una oferta de JAMA: torta de chocolate de S/25 a S/15, con botón Reservar"
            width="800"
            height="800"
            fetchPriority="high"
          />
        </div>

        <ul className="hero__insignias">
          {INSIGNIAS.map(({ Icono, texto }) => (
            <li key={texto} className="hero__insignia">
              <Icono aria-hidden="true" />
              {texto}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
