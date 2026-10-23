import { Store } from 'lucide-react';
import logoJama from '../assets/jama-logo.png';

export default function Header() {
  return (
    <header className="header">
      <div className="header__interior">
        <a className="header__marca" href="/" aria-label="JAMA, inicio">
          <img className="header__logo" src={logoJama} alt="JAMA" width="92" height="44" />
        </a>
        <a className="header__cta press" href="/negocios">
          <Store aria-hidden="true" />
          Para negocios
        </a>
      </div>
    </header>
  );
}
