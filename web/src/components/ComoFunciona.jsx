import { Search, ShoppingBag, MapPin } from 'lucide-react';

const PASOS = [
  {
    Icono: Search,
    titulo: 'Elige tu oferta',
    descripcion: 'Mira lo que quedó del día a precio de cierre, con el descuento ya aplicado.',
  },
  {
    Icono: ShoppingBag,
    titulo: 'Toca Pedir',
    descripcion: 'Sin registro. Recibes un código de 4 caracteres y se abre WhatsApp con el negocio.',
  },
  {
    Icono: MapPin,
    titulo: 'Paga y recoge',
    descripcion: 'Coordinas el pago por Yape o efectivo y recoges de 6 a 7 pm en el local.',
  },
];

export default function ComoFunciona() {
  return (
    <section className="como-funciona" id="como-funciona">
      <div className="como-funciona__interior">
        <div className="seccion__encabezado">
          <p className="seccion__etiqueta">Cómo funciona</p>
          <h2 className="seccion__titulo">Así de fácil</h2>
        </div>
        <ol className="como-funciona__pasos">
          {PASOS.map(({ Icono, titulo, descripcion }, indice) => (
            <li key={titulo} className="como-funciona__paso">
              <span className="como-funciona__icono">
                <Icono aria-hidden="true" />
                <span className="como-funciona__numero" aria-hidden="true">
                  {indice + 1}
                </span>
              </span>
              <h3 className="como-funciona__paso-titulo">{titulo}</h3>
              <p className="como-funciona__paso-descripcion">{descripcion}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
