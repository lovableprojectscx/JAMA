import { ArrowUpRight, BellRing, MessageCircle, Sparkles } from 'lucide-react';
import { ENLACES_JAMA } from '../compartido/enlaces-jama.js';
import { FacebookIcon, TikTokIcon } from '../compartido/iconos-redes.jsx';

export default function ComunidadWhatsapp() {
  return (
    <section className="comunidad-wa" aria-labelledby="titulo-comunidad-wa">
      <div className="comunidad-wa__caja">
        <div className="comunidad-wa__contenido">
          <div className="comunidad-wa__badge">
            <span className="comunidad-wa__punto" aria-hidden="true" />
            <BellRing size={13} aria-hidden="true" />
            <span>Comunidad Huamanga · Alertas diarias</span>
          </div>

          <h2 id="titulo-comunidad-wa" className="comunidad-wa__titulo">
            Entérate primero cuando salgan las ofertas de cierre
          </h2>

          <p className="comunidad-wa__texto">
            Únete a nuestro grupo de WhatsApp y recibe cada tarde los platos, postres y packs
            frescos del día con <strong>30% a 50% de descuento</strong> antes de que se agoten.
          </p>

          <div className="comunidad-wa__chips">
            <span>
              <Sparkles size={13} aria-hidden="true" /> Gratis y sin spam
            </span>
            <span>⚡ Aviso directo a tu celular</span>
            <span>📍 Solo locales de Huamanga</span>
          </div>
        </div>

        <div className="comunidad-wa__acciones">
          <a
            className="comunidad-wa__boton press"
            href={ENLACES_JAMA.grupoWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={20} aria-hidden="true" />
            <span>Unirme al grupo de WhatsApp</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>

          <div className="comunidad-wa__redes">
            <a
              className="comunidad-wa__fb press"
              href={ENLACES_JAMA.facebook}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FacebookIcon size={16} />
              <span>Facebook</span>
            </a>
            <a
              className="comunidad-wa__fb press"
              href={ENLACES_JAMA.tiktok}
              target="_blank"
              rel="noopener noreferrer"
            >
              <TikTokIcon size={16} />
              <span>TikTok</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
