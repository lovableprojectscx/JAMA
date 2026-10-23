import { Store, ArrowRight } from 'lucide-react';

export default function CtaNegocio() {
  return (
    <section className="cta-negocio">
      <div className="cta-negocio__caja">
        <div className="cta-negocio__contenido">
          <span className="cta-negocio__icono">
            <Store aria-hidden="true" />
          </span>
          <h2 className="cta-negocio__titulo">¿Tienes una pastelería o panadería?</h2>
          <p className="cta-negocio__texto">
            Publica lo que te queda al cierre del día y véndelo antes de perderlo. Gratis para empezar.
          </p>
        </div>
        <a className="cta-negocio__boton press" href="/negocios">
          Vender en JAMA <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
