import { useEffect } from 'react';
import {
  ArrowUpRight,
  Clock,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import logoJama from '../assets/jama-logo.png';
import { ENLACES_JAMA } from '../compartido/enlaces-jama.js';
import { FacebookIcon, TikTokIcon } from '../compartido/iconos-redes.jsx';
import './linkinbio.css';

const ANIO_ACTUAL = new Date().getFullYear();

export default function LinkInBio() {
  useEffect(() => {
    document.title = 'JAMA · Conócenos y únete a la comunidad';
  }, []);

  return (
    <div className="bio-pagina">
      <div className="bio-contenedor">
        {/* Cabecera de marca */}
        <header className="bio-hero">
          <div className="bio-hero__brillo" aria-hidden="true" />

          <a href="/" className="bio-hero__logo-wrap" aria-label="Ir al inicio de JAMA">
            <img src={logoJama} alt="JAMA" className="bio-hero__logo" />
          </a>

          <div className="bio-hero__ubicacion">
            <MapPin size={13} aria-hidden="true" />
            <span>Huamanga, Ayacucho</span>
          </div>

          <h1 className="bio-hero__titulo">La jama de hoy, al precio de cierre.</h1>

          <p className="bio-hero__desc">
            Conectamos negocios de comida local con personas que buscan platos, postres y packs
            frescos del día con <strong>30% a 50% de descuento</strong>. Sin descargar apps.
          </p>

          <div className="bio-hero__pills">
            <span>
              <Smartphone size={13} aria-hidden="true" /> 1 solo link web
            </span>
            <span>
              <Clock size={13} aria-hidden="true" /> Fresco del día
            </span>
            <span>
              <ShieldCheck size={13} aria-hidden="true" /> Pago con Yape
            </span>
          </div>
        </header>

        {/* Tarjeta destacada: Grupo de WhatsApp */}
        <main className="bio-enlaces" aria-label="Enlaces oficiales de JAMA">
          <a
            href={ENLACES_JAMA.grupoWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="bio-card bio-card--destacada press"
          >
            <div className="bio-card__top-badge">
              <span className="bio-card__punto" aria-hidden="true" />
              <Sparkles size={12} aria-hidden="true" />
              <span>Únete ahora · Comunidad de ofertas</span>
            </div>
            <div className="bio-card__fila">
              <span className="bio-card__icono bio-card__icono--wa" aria-hidden="true">
                <MessageCircle size={24} />
              </span>
              <div className="bio-card__texto">
                <strong className="bio-card__titulo">Grupo de WhatsApp JAMA</strong>
                <span className="bio-card__subtitulo">
                  Recibe alertas diarias de ofertas de cierre antes de que se agoten
                </span>
              </div>
              <span className="bio-card__flecha" aria-hidden="true">
                <ArrowUpRight size={20} />
              </span>
            </div>
          </a>

          {/* Enlace 2: Vitrina web de ofertas */}
          <a href="/" className="bio-card press">
            <div className="bio-card__fila">
              <span className="bio-card__icono bio-card__icono--lima" aria-hidden="true">
                <UtensilsCrossed size={22} />
              </span>
              <div className="bio-card__texto">
                <strong className="bio-card__titulo">Ver ofertas de cierre de hoy</strong>
                <span className="bio-card__subtitulo">
                  Explora el catálogo web en vivo y reserva sin crear cuenta
                </span>
              </div>
              <span className="bio-card__flecha" aria-hidden="true">
                <ArrowUpRight size={19} />
              </span>
            </div>
          </a>

          {/* Enlace 3: Afiliar negocio */}
          <a href="/negocios" className="bio-card press">
            <div className="bio-card__fila">
              <span className="bio-card__icono bio-card__icono--azul" aria-hidden="true">
                <Store size={22} />
              </span>
              <div className="bio-card__texto">
                <strong className="bio-card__titulo">¿Tienes un negocio de comida?</strong>
                <span className="bio-card__subtitulo">
                  Afíliate gratis al piloto (S/ 0) y vende hoy lo de hoy
                </span>
              </div>
              <span className="bio-card__flecha" aria-hidden="true">
                <ArrowUpRight size={19} />
              </span>
            </div>
          </a>

          {/* Enlace 4: Facebook oficial */}
          <a
            href={ENLACES_JAMA.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="bio-card press"
          >
            <div className="bio-card__fila">
              <span className="bio-card__icono bio-card__icono--fb" aria-hidden="true">
                <FacebookIcon size={21} />
              </span>
              <div className="bio-card__texto">
                <strong className="bio-card__titulo">Síguenos en Facebook</strong>
                <span className="bio-card__subtitulo">
                  @jamaofertas · Novedades, comercios aliados y avances
                </span>
              </div>
              <span className="bio-card__flecha" aria-hidden="true">
                <ArrowUpRight size={19} />
              </span>
            </div>
          </a>

          {/* Enlace 5: TikTok oficial */}
          <a
            href={ENLACES_JAMA.tiktok}
            target="_blank"
            rel="noopener noreferrer"
            className="bio-card press"
          >
            <div className="bio-card__fila">
              <span className="bio-card__icono bio-card__icono--tt" aria-hidden="true">
                <TikTokIcon size={21} />
              </span>
              <div className="bio-card__texto">
                <strong className="bio-card__titulo">Síguenos en TikTok</strong>
                <span className="bio-card__subtitulo">
                  @jama.app · Videos cortos de ofertas y comercios en Huamanga
                </span>
              </div>
              <span className="bio-card__flecha" aria-hidden="true">
                <ArrowUpRight size={19} />
              </span>
            </div>
          </a>

          {/* Enlace 5: Contacto directo */}
          <a
            href={ENLACES_JAMA.whatsappDirecto}
            target="_blank"
            rel="noopener noreferrer"
            className="bio-card bio-card--suave press"
          >
            <div className="bio-card__fila">
              <span className="bio-card__icono bio-card__icono--neutro" aria-hidden="true">
                <Send size={20} />
              </span>
              <div className="bio-card__texto">
                <strong className="bio-card__titulo">Hablar con el equipo JAMA</strong>
                <span className="bio-card__subtitulo">
                  Alianzas comerciales, consultas o soporte por WhatsApp
                </span>
              </div>
              <span className="bio-card__flecha" aria-hidden="true">
                <ArrowUpRight size={19} />
              </span>
            </div>
          </a>
        </main>

        {/* Pie de página */}
        <footer className="bio-pie">
          <p className="bio-pie__lema">Aquí nada bueno se bota.</p>
          <p className="bio-pie__meta">
            © {ANIO_ACTUAL} JAMA · Huamanga, Ayacucho ·{' '}
            <a href="/terminos" className="bio-pie__link">
              Términos
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
