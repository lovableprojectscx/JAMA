import logoJama from '../assets/jama-logo.png';

export default function Header() {
  return (
    <header className="header">
      <a className="header__marca" href="/">
        <img className="header__logo" src={logoJama} alt="JAMA" width="120" height="57" />
      </a>
      <a className="header__cta" href="/panel">
        Publicar una oferta
      </a>
    </header>
  );
}
