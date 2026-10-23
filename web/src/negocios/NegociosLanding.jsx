import {
  TrendingUp,
  Users,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Banknote,
  Sparkles,
} from 'lucide-react';
import logoJama from '../assets/jama-logo.png';
import './negocios.css';

const ANIO_ACTUAL = 2026;

export default function NegociosLanding() {
  return (
    <div className="negocios-pagina">
      {/* Header */}
      <header className="negocios-header">
        <div className="negocios-header__interior">
          <a href="/" aria-label="JAMA, inicio">
            <img src={logoJama} alt="JAMA" width="92" height="44" />
          </a>
          <div className="negocios-header__acciones">
            <a href="/panel" className="negocios-header__link-panel">
              Ya tengo cuenta
            </a>
            <a href="/negocios/registro" className="negocios-header__btn-unirme press">
              Quiero unirme
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="negocios-hero">
        <span className="negocios-hero__tag">Huamanga · Pastelerías y panaderías</span>
        <h1 className="negocios-hero__titulo">
          Vende lo que te queda al cierre,{' '}
          <span className="negocios-hero__resalte">en vez de perderlo</span>
        </h1>
        <p className="negocios-hero__bajada">
          Ayudamos a los negocios de Huamanga a recuperar el valor de sus productos del día. Publica
          en un minuto desde tu celular, tus vecinos compran a precio de cierre y recogen en tu
          local.
        </p>

        <div className="negocios-hero__acciones">
          <a href="/negocios/registro" className="negocios-btn-primario press">
            Quiero unirme a JAMA <ArrowRight size={18} />
          </a>
          <a href="/panel" className="negocios-btn-secundario">
            ¿Ya tienes cuenta? Ingresar al panel →
          </a>
        </div>

        {/* Insignias de confianza */}
        <div className="negocios-insignias">
          <span className="negocios-insignia">
            <Sparkles size={15} color="#7a5e0b" /> Gratis durante el piloto
          </span>
          <span className="negocios-insignia">
            <Banknote size={15} color="#2f6b1f" /> Cobras directo por Yape o efectivo
          </span>
          <span className="negocios-insignia">
            <ShieldCheck size={15} color="#1e2b4d" /> Sin comisiones por venta
          </span>
        </div>
      </section>

      {/* 1. Por qué te conviene */}
      <section className="negocios-seccion">
        <div className="negocios-seccion__header">
          <span className="negocios-seccion__kicker">Beneficios</span>
          <h2 className="negocios-seccion__titulo">¿Por qué vender en JAMA?</h2>
          <p className="negocios-seccion__subtitulo">
            Diseñado para que recuperes costos y ganes visibilidad sin complicar tu cierre de caja.
          </p>
        </div>

        <div className="negocios-beneficios-grid">
          <div className="negocios-tarjeta-beneficio">
            <div className="negocios-tarjeta-beneficio__icono">
              <TrendingUp size={24} />
            </div>
            <h3 className="negocios-tarjeta-beneficio__titulo">Recuperas tu inversión</h3>
            <p className="negocios-tarjeta-beneficio__desc">
              Cada pastel o pan que queda en vitrina es costo perdido. Con JAMA recuperas el costo
              de los insumos en vez de desecharlo.
            </p>
          </div>

          <div className="negocios-tarjeta-beneficio">
            <div className="negocios-tarjeta-beneficio__icono">
              <Users size={24} />
            </div>
            <h3 className="negocios-tarjeta-beneficio__titulo">Clientes nuevos de tu zona</h3>
            <p className="negocios-tarjeta-beneficio__desc">
              Vecinos de Huamanga que aún no te conocían prueban tus productos al cierre y regresan
              después como clientes habituales a precio regular.
            </p>
          </div>

          <div className="negocios-tarjeta-beneficio">
            <div className="negocios-tarjeta-beneficio__icono">
              <Sliders size={24} />
            </div>
            <h3 className="negocios-tarjeta-beneficio__titulo">Tú tienes el control total</h3>
            <p className="negocios-tarjeta-beneficio__desc">
              Tú decides qué publicar, cuántas unidades te quedaron, qué descuento poner y a qué hora
              se recoge. Puedes pausar tu oferta en cualquier momento.
            </p>
          </div>

          <div className="negocios-tarjeta-beneficio">
            <div className="negocios-tarjeta-beneficio__icono">
              <Banknote size={24} />
            </div>
            <h3 className="negocios-tarjeta-beneficio__titulo">Cero comisiones por ahora</h3>
            <p className="negocios-tarjeta-beneficio__desc">
              Durante la etapa piloto en Huamanga, JAMA es 100% gratuito. No cobramos mensualidades
              ni comisión por venta. Todo lo que cobras es íntegro para ti.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Cómo funciona */}
      <section className="negocios-seccion">
        <div className="negocios-seccion__header">
          <span className="negocios-seccion__kicker">Así de fácil</span>
          <h2 className="negocios-seccion__titulo">Cómo funciona para tu negocio</h2>
          <p className="negocios-seccion__subtitulo">
            En 3 pasos simples, sin instalaciones complicadas ni sistemas raros.
          </p>
        </div>

        <div className="negocios-pasos-lista">
          <div className="negocios-paso-card">
            <div className="negocios-paso-card__numero">1</div>
            <div className="negocios-paso-card__contenido">
              <h3>Publicas en 1 minuto</h3>
              <p>
                Al caer la tarde, entras a tu panel desde el celular. Subes una foto rápida, pones el
                precio de oferta y cuántas unidades te sobraron hoy.
              </p>
            </div>
          </div>

          <div className="negocios-paso-card">
            <div className="negocios-paso-card__numero">2</div>
            <div className="negocios-paso-card__contenido">
              <h3>El cliente te escribe</h3>
              <p>
                El cliente reserva en la web y WhatsApp se abre automáticamente con su código de 4
                letras para coordinar el pago por Yape y confirmar su recojo.
              </p>
            </div>
          </div>

          <div className="negocios-paso-card">
            <div className="negocios-paso-card__numero">3</div>
            <div className="negocios-paso-card__contenido">
              <h3>Entregas y confirmas</h3>
              <p>
                El cliente recoge en tu local (6 a 7 pm). Le cobras por Yape o efectivo, marcas el
                código en tu panel en un toque y listo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Qué necesitas */}
      <section className="negocios-seccion">
        <div className="negocios-seccion__header">
          <span className="negocios-seccion__kicker">Requisitos</span>
          <h2 className="negocios-seccion__titulo">Qué necesitas para empezar</h2>
        </div>

        <div className="negocios-requisitos-caja">
          <ul className="negocios-requisitos-lista">
            <li className="negocios-requisito-item">
              <span className="negocios-requisito-check">✓</span>
              <div>
                <strong>Local físico de pastelería, panadería o afín en Huamanga</strong>
                <span>Donde los clientes puedan acercarse a recoger sus pedidos.</span>
              </div>
            </li>
            <li className="negocios-requisito-item">
              <span className="negocios-requisito-check">✓</span>
              <div>
                <strong>Celular con WhatsApp activo</strong>
                <span>Para recibir los mensajes con los códigos de pedido de tus clientes.</span>
              </div>
            </li>
            <li className="negocios-requisito-item">
              <span className="negocios-requisito-check">✓</span>
              <div>
                <strong>Yape o cobro en efectivo</strong>
                <span>Para cobrar directamente sin intermediarios ni demoras bancarias.</span>
              </div>
            </li>
            <li className="negocios-requisito-item">
              <span className="negocios-requisito-check">✓</span>
              <div>
                <strong>Compromiso de frescura y calidad (RC08)</strong>
                <span>
                  Solo se publican productos del día aptos para el consumo y dentro de su fecha.
                </span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* 4. Preguntas Frecuentes */}
      <section className="negocios-seccion">
        <div className="negocios-seccion__header">
          <span className="negocios-seccion__kicker">Dudas frecuentes</span>
          <h2 className="negocios-seccion__titulo">Preguntas de negocios</h2>
        </div>

        <div className="negocios-faq-tarjeta">
          <div className="negocios-faq-item">
            <h4>¿Cuánto cuesta vender en JAMA?</h4>
            <p>
              Durante el programa piloto en Huamanga es <strong>100% gratuito</strong>. No pagas
              inscripción, ni mensualidades, ni comisiones por producto vendido.
            </p>
          </div>

          <div className="negocios-faq-item">
            <h4>¿JAMA procesa o retiene los pagos?</h4>
            <p>
              No. JAMA no cobra ni procesa dinero. El cliente te paga directamente a ti por Yape o en
              efectivo al momento de coordinar o recoger su pedido.
            </p>
          </div>

          <div className="negocios-faq-item">
            <h4>¿Qué pasa si un cliente pide pero no viene a recoger?</h4>
            <p>
              La reserva tiene un tiempo de tolerancia de 30 minutos. Si no te escribe o no aparece,
              puedes marcar el código como "No vino" en tu panel para liberar el stock de inmediato.
            </p>
          </div>

          <div className="negocios-faq-item">
            <h4>¿Cuánto demora la aprobación de mi solicitud?</h4>
            <p>
              Revisamos cada negocio manualmente para cuidar la calidad de la plataforma. Te
              escribiremos por WhatsApp apenas revisemos tu solicitud (usualmente en menos de 24
              horas).
            </p>
          </div>

          <div className="negocios-faq-item">
            <h4>¿Puedo pausar una oferta si un cliente compra directo en mi tienda?</h4>
            <p>
              Sí. Desde tu panel móvil puedes pausar, reactivar o dar por agotada cualquier oferta en
              cualquier momento con un solo toque.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="negocios-cta-final">
        <h2>¿Listo para no perder lo que te queda hoy?</h2>
        <p>
          Únete a los negocios de Huamanga que ya están vendiendo sus productos del día a precio de
          cierre.
        </p>
        <a href="/negocios/registro" className="negocios-btn-lima press">
          Solicitar cuenta de negocio <ArrowRight size={18} />
        </a>
      </section>

      {/* Footer */}
      <footer className="negocios-footer">
        <p>© {ANIO_ACTUAL} JAMA · Huamanga, Ayacucho</p>
        <p>
          <a href="/">Ir a la vitrina de clientes</a> ·{' '}
          <a href="/panel">Panel de negocio</a> ·{' '}
          <a href="/terminos">Términos y Condiciones</a>
        </p>
      </footer>
    </div>
  );
}
