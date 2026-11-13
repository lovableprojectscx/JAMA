import { useState, useEffect, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Store,
  Camera,
  MapPin,
  Clock,
  Smartphone,
  Share2,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  QrCode,
  Download,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  obtenerMiPerfil,
  actualizarMiPerfil,
  subirFotoPortada,
  subirFotoLogo,
} from '../api.js';
import {
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
} from '../../compartido/iconos-redes.jsx';

export default function MiPerfilPantalla({ token }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [generandoDescarga, setGenerandoDescarga] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [perfil, setPerfil] = useState({
    nombre: '',
    tipo: '',
    tipoDetalle: '',
    slug: '',
    logoUrl: '',
    portadaUrl: '',
    descripcion: '',
    direccion: '',
    yape: '',
    horarioAtencion: '',
    whatsapp: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  });

  const cartelRef = useRef(null);

  const cargarPerfil = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerMiPerfil(token);
      setPerfil({
        nombre: data.nombre || '',
        tipo: data.tipo || '',
        tipoDetalle: data.tipoDetalle || '',
        slug: data.slug || '',
        logoUrl: data.logoUrl || '',
        portadaUrl: data.portadaUrl || '',
        descripcion: data.descripcion || '',
        direccion: data.direccion || '',
        yape: data.yape || '',
        horarioAtencion: data.horarioAtencion || '',
        whatsapp: data.whatsapp || '',
        instagram: data.instagram || '',
        facebook: data.facebook || '',
        tiktok: data.tiktok || '',
      });
    } catch (err) {
      setError(err.message || 'No se pudo cargar el perfil');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // Generar QR para mostrador cuando haya slug
  useEffect(() => {
    if (!perfil.slug) return;
    const url = `${window.location.origin}/t/${perfil.slug}`;
    QRCode.toDataURL(url, {
      width: 440,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((dataUri) => setQrDataUrl(dataUri))
      .catch((err) => console.error('Error generando QR para mostrador:', err));
  }, [perfil.slug]);

  async function handleCambiarPortada(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoPortada(true);
    setError(null);
    try {
      const { url } = await subirFotoPortada(token, archivo);
      setPerfil((prev) => ({ ...prev, portadaUrl: url }));
      setMensajeExito('Foto de portada actualizada correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo subir la foto de portada');
    } finally {
      setSubiendoPortada(false);
    }
  }

  async function handleCambiarLogo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setSubiendoLogo(true);
    setError(null);
    try {
      const { url } = await subirFotoLogo(token, archivo);
      setPerfil((prev) => ({ ...prev, logoUrl: url }));
      setMensajeExito('Logotipo actualizado correctamente.');
    } catch (err) {
      setError(err.message || 'No se pudo subir el logotipo');
    } finally {
      setSubiendoLogo(false);
    }
  }

  async function handleGuardar(e) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    setMensajeExito(null);

    try {
      const res = await actualizarMiPerfil(token, {
        descripcion: perfil.descripcion,
        direccion: perfil.direccion,
        yape: perfil.yape,
        horarioAtencion: perfil.horarioAtencion,
        tipo: perfil.tipo,
        tipoDetalle: perfil.tipo === 'OTRO' ? perfil.tipoDetalle : null,
        instagram: perfil.instagram,
        facebook: perfil.facebook,
        tiktok: perfil.tiktok,
      });

      if (res && res.negocio) {
        setPerfil((prev) => ({
          ...prev,
          descripcion: res.negocio.descripcion || '',
          direccion: res.negocio.direccion || '',
          yape: res.negocio.yape || '',
          horarioAtencion: res.negocio.horarioAtencion || '',
          tipo: res.negocio.tipo || prev.tipo,
          tipoDetalle: res.negocio.tipoDetalle || '',
          instagram: res.negocio.instagram || '',
          facebook: res.negocio.facebook || '',
          tiktok: res.negocio.tiktok || '',
        }));
      }

      setMensajeExito('¡Perfil comercial y redes sociales actualizados con éxito!');
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el perfil');
    } finally {
      setGuardando(false);
    }
  }

  function handleCopiarEnlace() {
    const url = `${window.location.origin}/t/${perfil.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  async function handleDescargarCartel() {
    if (!qrDataUrl) return;
    setGenerandoDescarga(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // Proporción A5 de alta definición (800 x 1130 px) para impresión de mostrador
      canvas.width = 800;
      canvas.height = 1130;

      // Fondo blanco puro
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Cabecera institucional JAMA
      const gradiente = ctx.createLinearGradient(0, 0, canvas.width, 180);
      gradiente.addColorStop(0, '#0f172a');
      gradiente.addColorStop(1, '#1e293b');
      ctx.fillStyle = gradiente;
      ctx.fillRect(0, 0, canvas.width, 180);

      // Insignia superior
      ctx.fillStyle = '#fbbf24'; // Amber
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ JAMA · HUAMANGA', 400, 60);

      // Título cabecera
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
      ctx.fillText('¡Encuéntranos en JAMA!', 400, 115);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '16px system-ui, -apple-system, sans-serif';
      ctx.fillText('Aprovecha descuentos del 30% al 50% al cierre del día', 400, 148);

      // Tarjeta de identidad del comercio
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(50, 210, 700, 135, 16);
      ctx.fill();
      ctx.stroke();

      // Nombre del negocio
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
      ctx.fillText(perfil.nombre || 'Nuestro Negocio', 400, 265);

      // Dirección
      ctx.fillStyle = '#64748b';
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      const dirText = perfil.direccion ? `📍 ${perfil.direccion}` : '📍 Huamanga · Ayacucho';
      ctx.fillText(dirText, 400, 310);

      // Caja contenedora del código QR
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(160, 375, 480, 480, 24);
      ctx.fill();
      ctx.stroke();

      // Dibujar imagen QR
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
      });
      ctx.drawImage(qrImg, 180, 395, 440, 440);

      // Instrucción para el cliente
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('Escanea con la cámara de tu celular', 400, 905);

      ctx.fillStyle = '#475569';
      ctx.font = '18px system-ui, -apple-system, sans-serif';
      ctx.fillText('para ver nuestras ofertas de hoy y reservar al instante', 400, 940);

      // URL corta amigable
      const urlLimpia = `${window.location.host}/t/${perfil.slug}`;
      ctx.fillStyle = '#b45309'; // Tono ámbar/naranja JAMA
      ctx.font = 'bold 22px monospace';
      ctx.fillText(urlLimpia, 400, 990);

      // Pie de cartel
      ctx.fillStyle = '#94a3b8';
      ctx.font = '15px system-ui, -apple-system, sans-serif';
      ctx.fillText('Red de comercios de Huamanga unidos contra el desperdicio', 400, 1070);

      // Descargar como PNG
      const enlace = document.createElement('a');
      enlace.download = `cartel-mostrador-${perfil.slug || 'jama'}.png`;
      enlace.href = canvas.toDataURL('image/png');
      enlace.click();
      setMensajeExito('¡Cartel de mostrador descargado en alta resolución!');
    } catch (err) {
      console.error('Error al generar cartel descargable:', err);
      setError('No se pudo generar la imagen del cartel');
    } finally {
      setGenerandoDescarga(false);
    }
  }

  function handleImprimirCartel() {
    window.print();
  }

  if (cargando) {
    return (
      <div className="perfil-cargando">
        <Loader2 className="animar-spin" size={32} />
        <p>Cargando información de tu negocio...</p>
      </div>
    );
  }

  const urlPublica = `${window.location.origin}/t/${perfil.slug}`;

  return (
    <div className="perfil-pantalla">
      <div className="perfil-header-seccion">
        <h2 className="perfil-titulo">Mi Perfil de Negocio</h2>
        <p className="perfil-subtitulo">
          Personaliza la imagen, redes sociales y datos de tu tienda visibles para tus clientes en Huamanga.
        </p>
      </div>

      {mensajeExito && (
        <div className="perfil-aviso perfil-aviso--exito">
          <Check size={18} />
          <span>{mensajeExito}</span>
        </div>
      )}

      {error && (
        <div className="perfil-aviso perfil-aviso--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Bloque Visual: Portada y Logo */}
      <div className="perfil-visuales-card">
        <div
          className="perfil-portada-preview"
          style={{
            backgroundImage: perfil.portadaUrl ? `url(${perfil.portadaUrl})` : undefined,
          }}
        >
          {!perfil.portadaUrl && (
            <div className="perfil-portada-placeholder">
              <Store size={44} />
              <span>Sube una foto de portada de tu local</span>
            </div>
          )}

          <label className="perfil-btn-subir-portada press">
            <Camera size={16} />
            <span>{subiendoPortada ? 'Subiendo...' : 'Cambiar portada'}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={subiendoPortada}
              onChange={handleCambiarPortada}
            />
          </label>
        </div>

        <div className="perfil-logo-row">
          <div className="perfil-logo-container">
            {perfil.logoUrl ? (
              <img src={perfil.logoUrl} alt={perfil.nombre} className="perfil-logo-img" />
            ) : (
              <div className="perfil-logo-placeholder">
                <Store size={28} />
              </div>
            )}
            <label className="perfil-btn-subir-logo press" title="Subir logotipo">
              <Camera size={14} />
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={subiendoLogo}
                onChange={handleCambiarLogo}
              />
            </label>
          </div>

          <div className="perfil-identidad-resumen">
            <h3 className="perfil-nombre-comercial">{perfil.nombre}</h3>
            <span className="perfil-badge-rubro">
              {perfil.tipo === 'OTRO' && perfil.tipoDetalle ? perfil.tipoDetalle : perfil.tipo}
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta de Enlace Público / Link en Bio */}
      <div className="perfil-link-card">
        <div className="perfil-link-header">
          <div className="perfil-link-icono">
            <Share2 size={20} />
          </div>
          <div>
            <h4 className="perfil-link-titulo">Tu enlace público en JAMA</h4>
            <p className="perfil-link-desc">Comparte este link en tu bio de Instagram o estados de WhatsApp:</p>
          </div>
        </div>

        <div className="perfil-link-box">
          <span className="perfil-link-url">{urlPublica}</span>
          <button type="button" onClick={handleCopiarEnlace} className="perfil-btn-copiar press">
            {copiado ? (
              <>
                <Check size={16} /> ¡Copiado!
              </>
            ) : (
              'Copiar enlace'
            )}
          </button>
        </div>

        <a href={`/t/${perfil.slug}`} target="_blank" rel="noopener noreferrer" className="perfil-link-ver press">
          Ver cómo lo ven mis clientes <ExternalLink size={14} />
        </a>
      </div>

      {/* Tarjeta Kit de Mostrador: QR para tu negocio */}
      <div className="perfil-qr-card" ref={cartelRef}>
        <div className="perfil-qr-card__header">
          <div className="perfil-qr-card__icono">
            <QrCode size={22} />
          </div>
          <div className="perfil-qr-card__titulos">
            <div className="perfil-qr-card__badge-row">
              <span className="perfil-qr-badge">Kit Físico de Mostrador</span>
              <span className="perfil-qr-badge-extra">
                <Sparkles size={12} /> Listo para imprimir
              </span>
            </div>
            <h4 className="perfil-qr-card__titulo">Tu Código QR de Mostrador</h4>
            <p className="perfil-qr-card__subtitulo">
              Imprímelo y colócalo en tu mostrador o vitrina en Huamanga. Tus clientes podrán escanearlo para ver qué ofertas tienes vigentes hoy.
            </p>
          </div>
        </div>

        <div className="perfil-qr-stand-preview">
          <div className="perfil-qr-stand">
            <div className="perfil-qr-stand__top">
              <span className="perfil-qr-stand__marca">⚡ JAMA · HUAMANGA</span>
              <h5 className="perfil-qr-stand__tienda">{perfil.nombre || 'Mi Tienda'}</h5>
              <p className="perfil-qr-stand__lema">¡Aprovecha nuestras ofertas del día!</p>
            </div>

            <div className="perfil-qr-stand__codigo">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Mostrador ${perfil.nombre}`} className="perfil-qr-stand__img" />
              ) : (
                <div className="perfil-qr-stand__cargando">
                  <Loader2 className="animar-spin" size={24} />
                  <span>Generando QR...</span>
                </div>
              )}
            </div>

            <div className="perfil-qr-stand__bottom">
              <span className="perfil-qr-stand__instruccion">Escanea con tu cámara</span>
              <code className="perfil-qr-stand__slug">{window.location.host}/t/{perfil.slug}</code>
            </div>
          </div>

          <div className="perfil-qr-stand__acciones">
            <div className="perfil-qr-stand__ventajas">
              <div className="perfil-qr-ventaja-item">
                <Check size={16} className="perfil-qr-check" />
                <span><strong>Fideliza clientes presenciales:</strong> invítalos a seguir tus ofertas de cierre.</span>
              </div>
              <div className="perfil-qr-ventaja-item">
                <Check size={16} className="perfil-qr-check" />
                <span><strong>Formato nítido de alta calidad:</strong> apto para soporte de acrílico o papel A5/A4.</span>
              </div>
              <div className="perfil-qr-ventaja-item">
                <Check size={16} className="perfil-qr-check" />
                <span><strong>Sin costo extra:</strong> funciona automáticamente con tu enlace público permanente.</span>
              </div>
            </div>

            <div className="perfil-qr-stand__botones-fila">
              <button
                type="button"
                onClick={handleDescargarCartel}
                disabled={generandoDescarga || !qrDataUrl}
                className="perfil-btn-descargar-qr press"
              >
                {generandoDescarga ? (
                  <>
                    <Loader2 size={16} className="animar-spin" /> Generando cartel...
                  </>
                ) : (
                  <>
                    <Download size={16} /> Descargar cartel para mostrador (PNG)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleImprimirCartel}
                disabled={!qrDataUrl}
                className="perfil-btn-imprimir-qr press"
                title="Imprimir directamente desde tu navegador"
              >
                <Printer size={16} /> Imprimir cartel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Datos Comerciales y Redes */}
      <form onSubmit={handleGuardar} className="perfil-form-card">
        <h4 className="perfil-seccion-titulo">Información Comercial</h4>

        <div className="perfil-campo-grid">
          <div className="perfil-campo">
            <label htmlFor="perfil-tipo">
              <Store size={16} /> Rubro comercial:
            </label>
            <select
              id="perfil-tipo"
              className="perfil-select"
              value={perfil.tipo}
              onChange={(e) => setPerfil({ ...perfil, tipo: e.target.value })}
            >
              <option value="PASTELERIA">Pastelería</option>
              <option value="PANADERIA">Panadería</option>
              <option value="CAFETERIA">Cafetería</option>
              <option value="POLLERIA">Pollería</option>
              <option value="RESTAURANTE">Restaurante / Menú</option>
              <option value="OTRO">Otro rubro</option>
            </select>
          </div>

          {perfil.tipo === 'OTRO' && (
            <div className="perfil-campo">
              <label htmlFor="perfil-tipo-detalle">¿Cuál es tu rubro o especialidad?</label>
              <input
                id="perfil-tipo-detalle"
                type="text"
                maxLength={60}
                required
                placeholder="Ej: Heladería, Juguería, Pizzería"
                value={perfil.tipoDetalle}
                onChange={(e) => setPerfil({ ...perfil, tipoDetalle: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="perfil-campo">
          <label htmlFor="perfil-desc">
            Descripción corta o lema:
            <span className="perfil-contador">{perfil.descripcion.length}/200</span>
          </label>
          <textarea
            id="perfil-desc"
            rows="3"
            maxLength={200}
            placeholder="Ej: Elaboración artesanal diaria con insumos frescos de Huamanga..."
            value={perfil.descripcion}
            onChange={(e) => setPerfil({ ...perfil, descripcion: e.target.value })}
          />
        </div>

        <div className="perfil-campo">
          <label htmlFor="perfil-dir">
            <MapPin size={16} /> Dirección de recojo en Huamanga:
          </label>
          <input
            id="perfil-dir"
            type="text"
            required
            placeholder="Ej: Jr. Asamblea 220, Centro de Huamanga"
            value={perfil.direccion}
            onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })}
          />
        </div>

        <div className="perfil-campo-grid">
          <div className="perfil-campo">
            <label htmlFor="perfil-horario">
              <Clock size={16} /> Horario habitual de recojo:
            </label>
            <input
              id="perfil-horario"
              type="text"
              placeholder="Ej: 6:00 p. m. a 7:30 p. m."
              value={perfil.horarioAtencion}
              onChange={(e) => setPerfil({ ...perfil, horarioAtencion: e.target.value })}
            />
          </div>

          <div className="perfil-campo">
            <label htmlFor="perfil-yape">
              <Smartphone size={16} /> Número Yape (opcional):
            </label>
            <input
              id="perfil-yape"
              type="tel"
              maxLength={9}
              placeholder="9 dígitos"
              value={perfil.yape}
              onChange={(e) => setPerfil({ ...perfil, yape: e.target.value.replace(/\D/g, '') })}
            />
          </div>
        </div>

        {/* Sección: Redes Sociales y Canales Digitales */}
        <div className="perfil-subseccion-redes">
          <div className="perfil-subseccion-header">
            <h5 className="perfil-subseccion-titulo">Redes Sociales Oficiales</h5>
            <p className="perfil-subseccion-desc">
              Vincula tus cuentas para que tus clientes puedan seguir tus novedades y corroborar la identidad de tu local.
            </p>
          </div>

          <div className="perfil-redes-grid">
            <div className="perfil-campo">
              <label htmlFor="perfil-instagram">
                <InstagramIcon size={16} /> Instagram del negocio:
              </label>
              <div className="perfil-input-prefijo-wrap">
                <span className="perfil-input-prefijo">@</span>
                <input
                  id="perfil-instagram"
                  type="text"
                  maxLength={60}
                  placeholder="ej. pandulce_ayacucho"
                  value={perfil.instagram}
                  onChange={(e) => setPerfil({ ...perfil, instagram: e.target.value })}
                />
              </div>
              <span className="perfil-campo-pista">Ingresa tu usuario (sin url completa).</span>
            </div>

            <div className="perfil-campo">
              <label htmlFor="perfil-facebook">
                <FacebookIcon size={16} /> Facebook (página o perfil):
              </label>
              <div className="perfil-input-prefijo-wrap">
                <span className="perfil-input-prefijo">fb.com/</span>
                <input
                  id="perfil-facebook"
                  type="text"
                  maxLength={60}
                  placeholder="ej. PanaderiaPanDulceHuamanga"
                  value={perfil.facebook}
                  onChange={(e) => setPerfil({ ...perfil, facebook: e.target.value })}
                />
              </div>
              <span className="perfil-campo-pista">Nombre de usuario o enlace de tu página.</span>
            </div>

            <div className="perfil-campo">
              <label htmlFor="perfil-tiktok">
                <TikTokIcon size={16} /> TikTok comercial:
              </label>
              <div className="perfil-input-prefijo-wrap">
                <span className="perfil-input-prefijo">@</span>
                <input
                  id="perfil-tiktok"
                  type="text"
                  maxLength={60}
                  placeholder="ej. pandulce_oficial"
                  value={perfil.tiktok}
                  onChange={(e) => setPerfil({ ...perfil, tiktok: e.target.value })}
                />
              </div>
              <span className="perfil-campo-pista">Tu usuario oficial en TikTok.</span>
            </div>
          </div>
        </div>

        <button type="submit" disabled={guardando} className="perfil-btn-guardar press">
          {guardando ? 'Guardando cambios...' : 'Guardar cambios del perfil'}
        </button>
      </form>
    </div>
  );
}
