import { Store } from 'lucide-react';
import logoJama from '../assets/jama-logo.png';

export default function Header() {
  return (
    <header className="header">
      <a className="header__marca" href="/">
        <img className="header__logo" src={logoJama} alt="JAMA" width="96" height="46" />
      </a>
      <a className="header__cta press" href="/panel">
        <Store aria-hidden="true" />
        Publicar una oferta
      </a>
    </header>
  );
}
