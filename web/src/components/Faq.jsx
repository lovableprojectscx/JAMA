import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const PREGUNTAS = [
  {
    pregunta: '¿Necesito crear una cuenta para pedir?',
    respuesta:
      'No. Entras a la vitrina, eliges tu oferta y tocas Pedir. No hay registro ni contraseña para el cliente.',
  },
  {
    pregunta: '¿Cómo pago mi pedido?',
    respuesta:
      'JAMA no cobra ni procesa pagos. El pago se coordina directo con el negocio por WhatsApp, normalmente por Yape o efectivo al recoger.',
  },
  {
    pregunta: '¿A qué hora recojo mi pedido?',
    respuesta: 'El recojo es de 6:00 a 7:00 pm, en el local del negocio que publicó la oferta.',
  },
  {
    pregunta: '¿Qué hago con el código que me genera JAMA?',
    respuesta:
      'Es tu código de pedido: muéstralo en el local al recoger y el negocio lo confirma para cerrar tu pedido.',
  },
  {
    pregunta: '¿Qué pasa si una oferta se agota antes de que la pida?',
    respuesta:
      'El stock se actualiza al instante. Si alguien más la pidió primero, te avisamos apenas tocas Pedir para que elijas otra.',
  },
  {
    pregunta: 'Tengo un negocio, ¿cómo publico mis ofertas?',
    respuesta:
      'Entra al panel del negocio, inicia sesión con tu cuenta y publica en minutos lo que te quedó del día, con foto y precio.',
  },
];

export default function Faq() {
  const [abierta, setAbierta] = useState(null);

  return (
    <section className="faq" id="faq">
      <h2 className="seccion__titulo">Preguntas frecuentes</h2>
      <div className="faq__lista">
        {PREGUNTAS.map((item, indice) => {
          const estaAbierta = abierta === indice;
          return (
            <div className="faq__item" key={item.pregunta}>
              <button
                type="button"
                className="faq__pregunta"
                aria-expanded={estaAbierta}
                onClick={() => setAbierta(estaAbierta ? null : indice)}
              >
                {item.pregunta}
                <ChevronDown
                  aria-hidden="true"
                  className={`faq__icono ${estaAbierta ? 'faq__icono--abierta' : ''}`}
                />
              </button>
              {estaAbierta && <p className="faq__respuesta">{item.respuesta}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
