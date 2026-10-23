import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const PREGUNTAS = [
  {
    pregunta: '¿Por qué está a mitad de precio?',
    respuesta:
      'Las pastelerías hornean fresco hoy y liquidan su lote del día antes de cerrar. Tú ahorras la mitad y ellos evitan desperdicios.',
  },
  {
    pregunta: '¿Necesito registrarme o poner tarjeta?',
    respuesta: 'No. Cero registros y cero tarjetas. Apartas tu código gratis en 1 toque.',
  },
  {
    pregunta: '¿Cómo y cuándo pago?',
    respuesta: 'Pagas directamente en el local al recoger, con Yape, Plin o efectivo en mano.',
  },
  {
    pregunta: '¿A qué hora y dónde recojo?',
    respuesta:
      'En el local del centro, hoy de 6:00 a 7:30 pm. Cada oferta tiene un botón con la ruta exacta en Google Maps.',
  },
  {
    pregunta: '¿Qué hago con el código de 4 letras?',
    respuesta: 'Díselo o muéstraselo al encargado al llegar para que te entregue tu pedido reservado.',
  },
  {
    pregunta: '¿Tienes un negocio gastronómico en Ayacucho?',
    respuesta:
      'Toca "Para negocios" arriba, regístrate en 1 minuto y publica tus lotes de la tarde gratis.',
  },
];

export default function Faq() {
  const [abierta, setAbierta] = useState(null);

  return (
    <section className="faq" id="faq">
      <div className="seccion__encabezado">
        <p className="seccion__etiqueta">Dudas</p>
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
