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

function enrutar() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';

  if (path.startsWith('/admin')) {
    return <AdminApp />;
  }
  if (path.startsWith('/panel')) {
    return <PanelApp />;
  }
  if (path === '/negocios/registro') {
    return <RegistroNegocio />;
  }
  if (path === '/negocios') {
    return <NegociosLanding />;
  }
  return <App />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>{enrutar()}</StrictMode>
);
