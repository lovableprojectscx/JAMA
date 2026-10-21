import { EJEMPLOS_ILUSTRATIVOS } from '../data/ejemplosIlustrativos.js';
import EjemploCard from './EjemploCard.jsx';

export default function EjemplosIlustrativos() {
  return (
    <div className="ejemplos">
      <p className="ejemplos__aviso">
        Todavía no hay ofertas reales publicadas. Así se van a ver cuando los negocios empiecen a
        publicar — <strong>estos son ejemplos ilustrativos, no ofertas reales.</strong>
      </p>
      <div className="ejemplos__lista">
        {EJEMPLOS_ILUSTRATIVOS.map((ejemplo) => (
          <EjemploCard key={ejemplo.titulo} ejemplo={ejemplo} />
        ))}
      </div>
    </div>
  );
}
