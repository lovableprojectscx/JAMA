import { useState } from 'react';
import { iniciarSesion } from '../api.js';

export default function LoginPantalla({ onIngresar }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(evento) {
    evento.preventDefault();
    setCargando(true);
    setError(null);
    try {
      const { token, negocio } = await iniciarSesion(email.trim(), password);
      onIngresar({ token, negocio });
    } catch (err) {
      if (err.status === 401) {
        setError('Correo o contraseña incorrectos.');
      } else {
        setError('No pudimos conectar. Revisa tu internet e intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="panel-login">
      <h1 className="panel-login__titulo">Panel JAMA</h1>
      <p className="panel-login__subtitulo">Ingresa con el correo de tu negocio</p>

      <form className="panel-login__formulario" onSubmit={handleSubmit}>
        <label className="panel-campo">
          <span className="panel-campo__etiqueta">Correo</span>
          <input
            className="panel-campo__input"
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
