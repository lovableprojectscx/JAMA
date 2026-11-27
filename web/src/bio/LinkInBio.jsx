import { useEffect } from 'react';
import {
  ChevronRight,
  MapPin,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import logoJama from '../assets/jama-logo.png';
import { ENLACES_JAMA } from '../compartido/enlaces-jama.js';
import { FacebookIcon, TikTokIcon, WhatsAppIcon } from '../compartido/iconos-redes.jsx';
import './linkinbio.css';

const ANIO_ACTUAL = new Date().getFullYear();

export default function LinkInBio() {
  useEffect(() => {
    document.title = 'JAMA · Ofertas de cierre en Huamanga';
  }, []);

  return (
    <div className="bio-shell">
      {/* Header full-bleed sin cajas innecesarias */}
      <header className="bio-top">
        <div className="bio-top__glow" aria-hidden="true" />
        <div className="bio-top__inner">
          <a href="/" className="bio-brand" aria-label="Ir al catálogo JAMA">
            <img src={logoJama} alt="JAMA" className="bio-brand__logo" />
          </a>

          <div className="bio-loc">
            <MapPin size={13} aria-hidden="true" />
            <span>Huamanga, Ayacucho</span>
          </div>

          <h1 className="bio-title">La jama de hoy, al precio de cierre.</h1>
          <p className="bio-subtitle">
            Platos, postres y packs frescos del día con <strong>30% a 50% de descuento</strong>.
            Sin app ni registro.
          </p>
        </div>
      </header>

      {/* Contenido principal elevado sobre la curva del header */}
      <main className="bio-main" aria-label="Accesos oficiales de JAMA">
        {/* CTA Principal: Grupo WhatsApp con ícono oficial */}
        <a
          href={ENLACES_JAMA.grupoWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="bio-wa press"
        >
          <span className="bio-wa__icon" aria-hidden="true">
            <WhatsAppIcon size={26} />
          </span>
          <div className="bio-wa__body">
            <span className="bio-wa__kicker">
              <span className="bio-wa__dot" aria-hidden="true" />
              Comunidad · Alertas diarias
            </span>
            <strong className="bio-wa__title">Unirme al grupo de WhatsApp</strong>
            <span className="bio-wa__meta">Entérate primero antes de que se agoten</span>
          </div>
          <ChevronRight size={20} className="bio-wa__chev" aria-hidden="true" />
        </a>

        {/* Bento de 2 acciones clave */}
        <section className="bio-bento" aria-label="Explorar JAMA">
          <a href="/" className="bio-tile bio-tile--lima press">
            <span className="bio-tile__icon">
              <UtensilsCrossed size={21} aria-hidden="true" />
            </span>
            <strong className="bio-tile__title">Ver ofertas de hoy</strong>
            <span className="bio-tile__meta">Catálogo en vivo · 1 link</span>
          </a>

          <a href="/negocios" className="bio-tile bio-tile--navy press">
            <span className="bio-tile__icon">
              <Store size={21} aria-hidden="true" />
            </span>
            <strong className="bio-tile__title">Afilia tu negocio</strong>
            <span className="bio-tile__meta">Piloto gratis (S/ 0)</span>
          </a>
        </section>

        {/* Redes oficiales y contacto directo */}
        <section className="bio-section" aria-label="Redes oficiales">
          <h2 className="bio-section__label">Síguenos y escríbenos</h2>

          <div className="bio-list">
            <a
              href={ENLACES_JAMA.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="bio-row press"
            >
              <span className="bio-row__icon bio-row__icon--fb">
                <FacebookIcon size={20} />
              </span>
              <div className="bio-row__text">
                <strong>Facebook</strong>
                <span>@jamaofertas</span>
              </div>
              <ChevronRight size={18} className="bio-row__chev" aria-hidden="true" />
            </a>

            <a
              href={ENLACES_JAMA.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="bio-row press"
            >
              <span className="bio-row__icon bio-row__icon--tt">
                <TikTokIcon size={19} />
              </span>
              <div className="bio-row__text">
                <strong>TikTok</strong>
                <span>@jama.app</span>
              </div>
              <ChevronRight size={18} className="bio-row__chev" aria-hidden="true" />
            </a>

            <a
              href={ENLACES_JAMA.whatsappDirecto}
              target="_blank"
              rel="noopener noreferrer"
              className="bio-row press"
            >
              <span className="bio-row__icon bio-row__icon--wa">
                <WhatsAppIcon size={19} />
              </span>
              <div className="bio-row__text">
                <strong>WhatsApp directo</strong>
                <span>Alianzas y soporte · 925 176 472</span>
              </div>
              <ChevronRight size={18} className="bio-row__chev" aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>

      <footer className="bio-footer">
        <p className="bio-footer__tagline">Aquí nada bueno se bota.</p>
        <p className="bio-footer__legal">
          © {ANIO_ACTUAL} JAMA · Huamanga, Ayacucho ·{' '}
          <a href="/terminos">Términos</a>
        </p>
      </footer>
    </div>
  );
}
