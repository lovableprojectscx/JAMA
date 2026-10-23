import { useState } from 'react';
import { iniciarSesion } from '../api.js';

export default function LoginPantalla({ onIngresar }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorInfo, setErrorInfo] = useState(null);

  async function handleSubmit(evento) {
    evento.preventDefault();
    setCargando(true);
    setErrorInfo(null);
    try {
      const { token, negocio } = await iniciarSesion(email.trim(), password);
      onIngresar({ token, negocio });
    } catch (err) {
      if (err.status === 401) {
        setErrorInfo({ mensaje: 'Correo o contraseña incorrectos.' });
      } else if (err.status === 403 && err.codigo) {
        // RF20: cuenta en revisión, rechazada (con motivo) o suspendida.
        let texto = err.message;
        if (err.codigo === 'NEGOCIO_PENDIENTE') {
          texto = 'Tu solicitud está en revisión. Te escribiremos por WhatsApp apenas sea aprobada para que puedas empezar a publicar.';
        } else if (err.motivo) {
          texto = `${err.message} Motivo: ${err.motivo}`;
        }
        setErrorInfo({ mensaje: texto, codigo: err.codigo });
      } else {
        setErrorInfo({ mensaje: 'No pudimos conectar. Revisa tu internet e intenta de nuevo.' });
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

        {errorInfo && (
          <p className={`panel-aviso ${errorInfo.codigo === 'NEGOCIO_PENDIENTE' ? 'panel-aviso--pendiente' : 'panel-aviso--error'}`}>
            {errorInfo.mensaje}
          </p>
        )}

        <button type="submit" className="panel-boton panel-boton--primario" disabled={cargando}>
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="panel-login__pie">
        <p className="panel-login__enlace-registro">
          ¿Tu negocio aún no está en JAMA?{' '}
          <a href="/negocios/registro">Solicita tu cuenta aquí</a>
        </p>
        <p className="panel-login__enlace-volver">
          <a href="/negocios">← Volver a información para negocios</a>
        </p>
      </div>
    </div>
  );
}
