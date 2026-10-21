import { Store, ArrowRight } from 'lucide-react';

export default function CtaNegocio() {
  return (
    <section className="cta-negocio">
      <div className="cta-negocio__caja">
        <div className="cta-negocio__contenido">
          <div className="cta-negocio__encabezado">
            <Store aria-hidden="true" />
            <h2 className="cta-negocio__titulo">¿Tienes una pastelería o panadería?</h2>
          </div>
          <p className="cta-negocio__texto">
            Publica lo que te queda al cierre del día y véndelo antes de perderlo. Gratis para empezar.
          </p>
        </div>
        <a className="cta-negocio__boton press" href="/panel">
          Publicar una oferta <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
