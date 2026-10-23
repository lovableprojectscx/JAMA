import { useState } from 'react';
import { iniciarSesionAdmin } from './api.js';
import logoJama from '../assets/jama-logo.png';
import './admin.css';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const { token, admin } = await iniciarSesionAdmin(email.trim(), password);
      onLogin({ token, admin });
    } catch (err) {
      if (err.status === 401) {
        setError('Correo o contraseña de administrador incorrectos.');
      } else {
        setError('No pudimos conectar con el servidor. Revisa tu conexión.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="admin-app">
      <div className="admin-login-contenedor">
        <div className="admin-login-tarjeta">
          <div className="admin-login-tarjeta__logo">
            <img src={logoJama} alt="JAMA" width="92" height="44" />
          </div>
          <h1 className="admin-login-tarjeta__titulo">Acceso Administración</h1>
          <p className="admin-login-tarjeta__subtitulo">Ingresa con tus credenciales de administrador</p>

          <form onSubmit={handleSubmit} className="panel-formulario">
            <label className="panel-campo">
              <span className="panel-campo__etiqueta">Correo de Administrador</span>
              <input
                className="panel-campo__input"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@jama.pe"
              />
            </label>

            <label className="panel-campo">
              <span className="panel-campo__etiqueta">Contraseña</span>
              <input
                className="panel-campo__input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {error && <p className="panel-aviso panel-aviso--error">{error}</p>}

            <button type="submit" className="panel-boton panel-boton--primario" disabled={cargando}>
              {cargando ? 'Ingresando...' : 'Entrar como Administrador'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
