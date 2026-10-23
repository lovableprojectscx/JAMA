import { Store, ArrowRight } from 'lucide-react';

export default function CtaNegocio() {
  return (
    <section className="cta-negocio">
      <div className="cta-negocio__caja">
        <div className="cta-negocio__contenido">
          <span className="cta-negocio__icono">
            <Store aria-hidden="true" />
          </span>
          <h2 className="cta-negocio__titulo">¿Tienes una pastelería o panadería en Ayacucho?</h2>
          <p className="cta-negocio__texto">
            Convierte tus lotes de la tarde en ingresos limpios y nuevos clientes locales. Publica en 2 minutos sin costo de afiliación.
          </p>
        </div>
        <a className="cta-negocio__boton press" href="/negocios">
          Afiliar mi negocio gratis <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
