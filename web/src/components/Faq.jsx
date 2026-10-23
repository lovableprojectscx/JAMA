import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const PREGUNTAS = [
  {
    pregunta: '¿Por qué está a mitad de precio si es comida fresca?',
    respuesta:
      'Las pastelerías y panaderías artesanales hornean fresco todos los días. Al final de la tarde, prefieren liquidar el lote del día con 50% de descuento o más antes de cerrar, en vez de guardarlo o desecharlo. Tú disfrutas calidad de pastelería pagando la mitad y ellos recuperan sus costos.',
  },
  {
    pregunta: '¿Necesito registrarme o ingresar tarjeta de crédito?',
    respuesta:
      'No. Cero registros y cero tarjetas. Entras a la vitrina, eliges tu porción y tocas Apartar. Tu código de reserva se genera al instante de forma 100% gratuita.',
  },
  {
    pregunta: '¿Cómo y cuándo pago mi pedido?',
    respuesta:
      'JAMA no cobra online ni retiene comisiones de tu bolsillo. Pagas directamente al comercio al momento de recoger en su mostrador, usando Yape, Plin o efectivo.',
  },
  {
    pregunta: '¿A qué hora y dónde recojo mi pedido?',
    respuesta:
      'El recojo es en el propio local del negocio en el centro de Huamanga, usualmente entre 6:00 pm y 7:30 pm. Cada tarjeta tiene un botón directo para ver la ubicación exacta en Google Maps.',
  },
  {
    pregunta: '¿Qué hago con el código de 4 letras que me da JAMA?',
    respuesta:
      'Es tu código de reserva exclusiva con 30 minutos de vigencia. Solo díselo o muéstraselo al encargado de la pastelería para que te entregue tu lote empaquetado.',
  },
  {
    pregunta: '¿Qué pasa si una oferta se agota antes de que la pida?',
    respuesta:
      'El stock se actualiza en tiempo real. Si alguien más aparta la última unidad segundos antes, la app te avisará al instante para que elijas otra opción sin sorpresas.',
  },
  {
    pregunta: 'Tengo una pastelería o panadería en Ayacucho, ¿cómo participo?',
    respuesta:
      'Toca en "Para negocios" en la parte superior, envía tus datos en 1 minuto y te habilitamos para publicar tus lotes del día al cierre de la tarde.',
  },
];

export default function Faq() {
  const [abierta, setAbierta] = useState(null);

  return (
    <section className="faq" id="faq">
      <div className="seccion__encabezado">
        <p className="seccion__etiqueta">Dudas resueltas</p>
        <h2 className="seccion__titulo">Preguntas frecuentes</h2>
      </div>
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
