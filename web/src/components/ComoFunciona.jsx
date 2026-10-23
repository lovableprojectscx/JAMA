import { Search, ShoppingBag, MapPin } from 'lucide-react';

const PASOS = [
  {
    Icono: Search,
    titulo: 'Elige tu antojo',
    descripcion: 'Lotes frescos de pastelerías al 50% o más.',
  },
  {
    Icono: ShoppingBag,
    titulo: 'Aparta en 1 toque',
    descripcion: 'Sin registro ni tarjeta. Recibes tu código al instante.',
  },
  {
    Icono: MapPin,
    titulo: 'Paga y recoge',
    descripcion: 'Muestras tu código, pagas con Yape o efectivo en el local.',
  },
];

export default function ComoFunciona() {
  return (
    <section className="como-funciona" id="como-funciona">
      <div className="como-funciona__interior">
        <div className="seccion__encabezado">
          <p className="seccion__etiqueta">Paso a paso</p>
          <h2 className="seccion__titulo">Así de simple</h2>
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
