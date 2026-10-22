import { Info } from 'lucide-react';
import { EJEMPLOS_ILUSTRATIVOS } from '../data/ejemplosIlustrativos.js';
import EjemploCard from './EjemploCard.jsx';

export default function EjemplosIlustrativos() {
  return (
    <div className="ejemplos">
      <p className="ejemplos__aviso">
        <Info aria-hidden="true" />
        <span>
          Todavía no hay ofertas publicadas. Así se verán cuando los negocios empiecen —{' '}
          <strong>son ejemplos ilustrativos, no ofertas reales.</strong>
        </span>
      </p>
      <div className="ejemplos__lista">
        {EJEMPLOS_ILUSTRATIVOS.map((ejemplo) => (
          <EjemploCard key={ejemplo.titulo} ejemplo={ejemplo} />
        ))}
      </div>
    </div>
  );
}
