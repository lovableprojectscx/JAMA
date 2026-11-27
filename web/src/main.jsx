import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './panel/panel.css';
import './negocios/negocios.css';
import './admin/admin.css';
import App from './App.jsx';
import PanelApp from './panel/PanelApp.jsx';
import NegociosLanding from './negocios/NegociosLanding.jsx';
import RegistroNegocio from './negocios/RegistroNegocio.jsx';
import AdminApp from './admin/AdminApp.jsx';
import TerminosCondiciones from './terminos/TerminosCondiciones.jsx';
import PerfilTienda from './tienda/PerfilTienda.jsx';
import LinkInBio from './bio/LinkInBio.jsx';

function enrutar() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path === '/bio' || path === '/hola' || path === '/links') {
    return <LinkInBio />;
  }
  if (path.startsWith('/admin')) {
    return <AdminApp />;
  }
  if (path.startsWith('/panel')) {
    return <PanelApp />;
  }
  if (path.startsWith('/t/')) {
    const slug = path.slice(3);
    return <PerfilTienda slug={slug} />;
  }
  if (path.startsWith('/tienda/')) {
    const slug = path.slice(8);
    return <PerfilTienda slug={slug} />;
  }
  if (path === '/negocios/registro') {
    return <RegistroNegocio />;
  }
  if (path === '/negocios') {
    return <NegociosLanding />;
  }
  if (path === '/terminos' || path === '/terminos-y-condiciones') {
    return <TerminosCondiciones />;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>{enrutar()}</StrictMode>
);
