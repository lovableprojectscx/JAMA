import { useState } from 'react';
import { obtenerSesionAdmin, guardarSesionAdmin, borrarSesionAdmin } from './sesion.js';
import AdminLogin from './AdminLogin.jsx';
import AdminPanel from './AdminPanel.jsx';

export default function AdminApp() {
  const [sesion, setSesion] = useState(() => obtenerSesionAdmin());

  function handleLogin({ token, admin }) {
    guardarSesionAdmin({ token, admin });
    setSesion({ token, admin });
  }

  function handleLogout() {
    borrarSesionAdmin();
    setSesion(null);
  }

  if (!sesion) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminPanel token={sesion.token} admin={sesion.admin} onLogout={handleLogout} />;
}
