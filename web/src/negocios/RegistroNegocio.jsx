import { useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { registrarSolicitud } from '../api.js';
import logoJama from '../assets/jama-logo.png';
import './negocios.css';

const TIPOS_NEGOCIO = [
  { valor: 'PASTELERIA', etiqueta: 'Pastelería' },
  { valor: 'PANADERIA', etiqueta: 'Panadería' },
  { valor: 'CAFETERIA', etiqueta: 'Cafetería' },
  { valor: 'POLLERIA', etiqueta: 'Pollería' },
  { valor: 'RESTAURANTE', etiqueta: 'Restaurante' },
];

export default function RegistroNegocio() {
  const [formData, setFormData] = useState({
    nombre: '',
    responsable: '',
    tipo: 'PASTELERIA',
    whatsapp: '',
    direccion: '',
    yape: '',
    email: '',
    password: '',
    declaracionAceptada: false,
  });

  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState(null);
  const [exito, setExito] = useState(null);

  function handleChange(campo, valor) {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: null }));
    }
    setErrorGlobal(null);
  }

  function validar() {
    const nuevosErrores = {};

    if (!formData.nombre.trim() || formData.nombre.trim().length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres.';
    } else if (formData.nombre.trim().length > 80) {
      nuevosErrores.nombre = 'Máximo 80 caracteres.';
    }

    if (!formData.responsable.trim() || formData.responsable.trim().length < 2) {
      nuevosErrores.responsable = 'El nombre del responsable debe tener al menos 2 caracteres.';
    }

    const whatsappLimpio = formData.whatsapp.replace(/\D/g, '');
    if (!/^9\d{8}$/.test(whatsappLimpio)) {
      nuevosErrores.whatsapp = 'Debe ser un número celular de 9 dígitos que empiece en 9.';
    }

    if (!formData.direccion.trim() || formData.direccion.trim().length < 5) {
      nuevosErrores.direccion = 'Ingresa la dirección de tu local en Huamanga (mínimo 5 caracteres).';
    }

    if (formData.yape.trim()) {
      const yapeLimpio = formData.yape.replace(/\D/g, '');
      if (!/^9\d{8}$/.test(yapeLimpio)) {
        nuevosErrores.yape = 'Si indicas Yape, debe ser un celular de 9 dígitos que empiece en 9.';
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      nuevosErrores.email = 'Ingresa un correo electrónico válido.';
    }

    if (!formData.password || formData.password.length < 8) {
      nuevosErrores.password = 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (!formData.declaracionAceptada) {
      nuevosErrores.declaracionAceptada =
        'Debes aceptar el compromiso de publicar solo productos aptos para consumo.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorGlobal(null);

    if (!validar()) {
      return;
    }

    setCargando(true);
    try {
      const payload = {
        nombre: formData.nombre.trim(),
        responsable: formData.responsable.trim(),
        tipo: formData.tipo,
        whatsapp: formData.whatsapp.replace(/\D/g, ''),
        direccion: formData.direccion.trim(),
        yape: formData.yape.trim() ? formData.yape.replace(/\D/g, '') : null,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        declaracionAceptada: formData.declaracionAceptada,
      };

      const respuesta = await registrarSolicitud(payload);
      setExito({
        nombre: respuesta.nombre || payload.nombre,
        whatsapp: payload.whatsapp,
      });
    } catch (err) {
      if (err.status === 409) {
        if (err.campo === 'whatsapp') {
          setErrorGlobal('Este número de WhatsApp ya se encuentra registrado en otra cuenta.');
        } else if (err.campo === 'email') {
          setErrorGlobal('Este correo electrónico ya se encuentra registrado. Si es tuyo, ingresa al panel.');
        } else {
          setErrorGlobal('Este correo o WhatsApp ya está registrado en JAMA.');
        }
      } else if (err.status === 429) {
        setErrorGlobal(
          'Has alcanzado el límite de solicitudes por hora. Por seguridad, espera un momento antes de volver a intentar.'
        );
      } else if (err.status === 400) {
        setErrorGlobal(err.message.replace(/^RN-15:\s*/, ''));
      } else {
        setErrorGlobal('No pudimos conectar con el servidor. Revisa tu internet e intenta de nuevo.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="negocios-pagina">
      {/* Header simplificado */}
      <header className="negocios-header">
        <div className="negocios-header__interior">
          <a href="/negocios" aria-label="JAMA Negocios">
            <img src={logoJama} alt="JAMA" width="92" height="44" />
          </a>
          <a href="/panel" className="negocios-header__link-panel">
            Ya tengo cuenta
          </a>
        </div>
      </header>

      <main className="registro-contenedor">
        <div className="registro-tarjeta">
          {exito ? (
            <div className="registro-exito">
              <div className="registro-exito__icono">
                <CheckCircle2 size={36} />
              </div>
              <h1 className="registro-exito__titulo">¡Recibimos tu solicitud!</h1>
              <p className="registro-exito__texto">
                Muchas gracias, <strong>{exito.nombre}</strong>. Tu cuenta está registrada y en proceso
                de revisión.
              </p>
              <div className="registro-exito__caja-aviso">
                📲 <strong>¿Qué sigue?</strong>
                <br />
                Te escribiremos a tu WhatsApp (<strong>{exito.whatsapp}</strong>) apenas revisemos tu
                solicitud para coordinar tu activación y que puedas empezar a publicar.
              </div>
              <div className="registro-exito__acciones">
                <a href="/panel" className="negocios-btn-primario press">
                  Ir al panel del negocio
                </a>
                <a href="/" className="negocios-btn-secundario">
                  Volver a la vitrina de ofertas
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="registro-encabezado">
                <a href="/negocios" className="registro-encabezado__link-atras">
                  <ArrowLeft size={16} /> Volver a información
                </a>
                <h1 className="registro-encabezado__titulo">Solicitud para vender en JAMA</h1>
                <p className="registro-encabezado__subtitulo">
                  Completa los datos de tu negocio en Huamanga. Revisamos cada solicitud para cuidar la
                  calidad de la comunidad.
                </p>
              </div>

              {errorGlobal && (
                <div className="registro-aviso registro-aviso--error" style={{ marginBottom: 20 }}>
                  {errorGlobal}
                </div>
              )}

              <form className="registro-form" onSubmit={handleSubmit} noValidate>
                {/* Nombre del negocio */}
                <div className="registro-campo">
                  <label className="registro-campo__etiqueta" htmlFor="reg-nombre">
                    Nombre comercial del negocio
                  </label>
                  <input
                    id="reg-nombre"
                    className={`registro-campo__input ${errores.nombre ? 'registro-campo__input--error' : ''}`}
                    type="text"
                    placeholder="Ej. Pastelería El Trigal"
                    value={formData.nombre}
                    onChange={(e) => handleChange('nombre', e.target.value)}
                    required
                  />
                  {errores.nombre && <span className="registro-campo__error">{errores.nombre}</span>}
                </div>

                {/* Responsable y Tipo de negocio */}
                <div className="registro-fila-doble">
                  <div className="registro-campo">
                    <label className="registro-campo__etiqueta" htmlFor="reg-responsable">
                      Responsable
                    </label>
                    <input
                      id="reg-responsable"
                      className={`registro-campo__input ${errores.responsable ? 'registro-campo__input--error' : ''}`}
                      type="text"
                      placeholder="Ej. Carmen Flores"
                      value={formData.responsable}
                      onChange={(e) => handleChange('responsable', e.target.value)}
                      required
                    />
                    {errores.responsable && (
                      <span className="registro-campo__error">{errores.responsable}</span>
                    )}
                  </div>

                  <div className="registro-campo">
                    <label className="registro-campo__etiqueta" htmlFor="reg-tipo">
                      Tipo de negocio
                    </label>
                    <select
                      id="reg-tipo"
                      className="registro-campo__select"
                      value={formData.tipo}
                      onChange={(e) => handleChange('tipo', e.target.value)}
                    >
                      {TIPOS_NEGOCIO.map((t) => (
                        <option key={t.valor} value={t.valor}>
                          {t.etiqueta}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* WhatsApp y Yape */}
                <div className="registro-fila-doble">
                  <div className="registro-campo">
                    <label className="registro-campo__etiqueta" htmlFor="reg-whatsapp">
                      WhatsApp para pedidos
                    </label>
                    <input
                      id="reg-whatsapp"
                      className={`registro-campo__input ${errores.whatsapp ? 'registro-campo__input--error' : ''}`}
                      type="tel"
                      inputMode="numeric"
                      placeholder="Ej. 966123456"
                      maxLength={9}
                      value={formData.whatsapp}
                      onChange={(e) => handleChange('whatsapp', e.target.value)}
                      required
                    />
                    {errores.whatsapp ? (
                      <span className="registro-campo__error">{errores.whatsapp}</span>
                    ) : (
                      <span className="registro-campo__ayuda">Los clientes te contactarán aquí.</span>
                    )}
                  </div>

                  <div className="registro-campo">
                    <label className="registro-campo__etiqueta" htmlFor="reg-yape">
                      Número Yape <span className="registro-campo__opcional">(opcional)</span>
                    </label>
                    <input
                      id="reg-yape"
                      className={`registro-campo__input ${errores.yape ? 'registro-campo__input--error' : ''}`}
                      type="tel"
                      inputMode="numeric"
                      placeholder="Ej. 966123456"
                      maxLength={9}
                      value={formData.yape}
                      onChange={(e) => handleChange('yape', e.target.value)}
                    />
                    {errores.yape && <span className="registro-campo__error">{errores.yape}</span>}
                  </div>
                </div>

                {/* Dirección */}
                <div className="registro-campo">
                  <label className="registro-campo__etiqueta" htmlFor="reg-direccion">
                    Dirección del local (Huamanga)
                  </label>
                  <input
                    id="reg-direccion"
                    className={`registro-campo__input ${errores.direccion ? 'registro-campo__input--error' : ''}`}
                    type="text"
                    placeholder="Ej. Jr. Bellido 240, Cercado de Huamanga"
                    value={formData.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    required
                  />
                  {errores.direccion && (
                    <span className="registro-campo__error">{errores.direccion}</span>
                  )}
                </div>

                {/* Correo y Contraseña */}
                <div className="registro-campo">
                  <label className="registro-campo__etiqueta" htmlFor="reg-email">
                    Correo para acceder a tu panel
                  </label>
                  <input
                    id="reg-email"
                    className={`registro-campo__input ${errores.email ? 'registro-campo__input--error' : ''}`}
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="Ej. micorreo@ejemplo.pe"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    required
                  />
                  {errores.email && <span className="registro-campo__error">{errores.email}</span>}
                </div>

                <div className="registro-campo">
                  <label className="registro-campo__etiqueta" htmlFor="reg-password">
                    Contraseña
                  </label>
                  <input
                    id="reg-password"
                    className={`registro-campo__input ${errores.password ? 'registro-campo__input--error' : ''}`}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                  />
                  {errores.password && (
                    <span className="registro-campo__error">{errores.password}</span>
                  )}
                </div>

                {/* Declaración de compromiso de calidad */}
                <div className="registro-declaracion">
                  <input
                    id="reg-declaracion"
                    type="checkbox"
                    checked={formData.declaracionAceptada}
                    onChange={(e) => handleChange('declaracionAceptada', e.target.checked)}
                  />
                  <label htmlFor="reg-declaracion">
                    <strong>Compromiso de calidad (RC08):</strong> Declaro que solo publicaré productos
                    del día, frescos, aptos para el consumo humano y dentro de su fecha de vencimiento.
                  </label>
                </div>
                {errores.declaracionAceptada && (
                  <span className="registro-campo__error" style={{ marginTop: -8 }}>
                    {errores.declaracionAceptada}
                  </span>
                )}

                {/* Botón Enviar */}
                <button
                  type="submit"
                  className="negocios-btn-primario press"
                  style={{ width: '100%', maxWidth: 'none', marginTop: 10 }}
                  disabled={cargando}
                >
                  {cargando ? 'Enviando solicitud...' : 'Enviar mi solicitud'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
