import { useState } from 'react';
import LoginPantalla from './pantallas/LoginPantalla.jsx';
import MisOfertasPantalla from './pantallas/MisOfertasPantalla.jsx';
import PublicarOfertaPantalla from './pantallas/PublicarOfertaPantalla.jsx';
import PedidosPantalla from './pantallas/PedidosPantalla.jsx';
import MiPerfilPantalla from './pantallas/MiPerfilPantalla.jsx';
import NavInferior from './componentes/NavInferior.jsx';
import { leerSesionGuardada, guardarSesion, borrarSesion } from './sesion.js';
import logoJama from '../assets/jama-logo.png';

export default function PanelApp() {
  const [sesion, setSesion] = useState(leerSesionGuardada);
  const [pantalla, setPantalla] = useState('ofertas');
  const [ofertaParaRepublicar, setOfertaParaRepublicar] = useState(null);

  function handleIngresar(nuevaSesion) {
    guardarSesion(nuevaSesion);
    setSesion(nuevaSesion);
  }

  function handleSalir() {
    borrarSesion();
    setSesion(null);
  }

  function handleRepublicar(oferta) {
    setOfertaParaRepublicar(oferta);
    setPantalla('publicar');
  }

  function handleOfertaPublicada() {
    setOfertaParaRepublicar(null);
    setPantalla('ofertas');
  }

  if (!sesion) {
    return (
      <div className="panel">
        <LoginPantalla onIngresar={handleIngresar} />
      </div>
    );
  }

  return (
    <div className="panel">
      <header className="panel-cabecera">
        <img className="panel-cabecera__logo" src={logoJama} alt="JAMA" width="100" height="48" />
        <div className="panel-cabecera__negocio">
          <span>{sesion.negocio?.nombre}</span>
          <button type="button" className="panel-cabecera__salir" onClick={handleSalir}>
            Salir
          </button>
        </div>
      </header>

      <main className="panel-contenido">
        {pantalla === 'ofertas' && (
          <MisOfertasPantalla
            token={sesion.token}
            onRepublicar={handleRepublicar}
          />
        )}
        {pantalla === 'publicar' && (
          <PublicarOfertaPantalla
            token={sesion.token}
            ofertaPrellenada={ofertaParaRepublicar}
            onPublicada={handleOfertaPublicada}
          />
        )}
        {pantalla === 'pedidos' && <PedidosPantalla token={sesion.token} />}
        {pantalla === 'perfil' && <MiPerfilPantalla token={sesion.token} />}
      </main>

      <NavInferior
        pantallaActiva={pantalla}
        onCambiarPantalla={(p) => {
          if (p !== 'publicar') setOfertaParaRepublicar(null);
          setPantalla(p);
        }}
      />
    </div>
  );
}
