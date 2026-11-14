import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Smartphone,
  Share2,
  CheckCircle2,
  Navigation,
  MessageCircle,
  ShoppingBag,
  Check,
  Copy,
  Loader2,
  X,
} from 'lucide-react';
import { obtenerPerfilPublico, pedirOferta } from '../api.js';
import OfertaCard from '../components/OfertaCard.jsx';
import logoJama from '../assets/jama-logo.png';
import {
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
} from '../compartido/iconos-redes.jsx';
import './tienda.css';

export default function PerfilTienda({ slug }) {
  const [tienda, setTienda] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [pedirCargandoId, setPedirCargandoId] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [copiado, setCopiado] = useState(false);
  const [copiadoYape, setCopiadoYape] = useState(false);

  function handleCopiarYape(numero) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(numero);
      setCopiadoYape(true);
      setTimeout(() => setCopiadoYape(false), 2000);
    }
  }

  const cargarTienda = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerPerfilPublico(slug);
      setTienda(data);
    } catch (err) {
      setError(err.message || 'No se pudo cargar la tienda');
    } finally {
      setCargando(false);
    }
  }, [slug]);

  useEffect(() => {
    cargarTienda();
  }, [cargarTienda]);

  async function handlePedir(oferta) {
    setPedirCargandoId(oferta.id);
    try {
      const resultado = await pedirOferta(oferta.id);
      setConfirmacion({ ...resultado, oferta });
    } catch (err) {
      alert(err.message || 'No se pudo reservar la oferta');
    } finally {
      setPedirCargandoId(null);
    }
  }

  function handleCompartir() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${tienda?.nombre} en JAMA`,
        text: `¡Mira las ofertas de cierre de ${tienda?.nombre} en JAMA Huamanga!`,
        url,
      }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  }

  if (cargando) {
    return (
      <div className="tienda-cargando">
        <Loader2 className="animar-spin" size={36} />
        <p>Cargando tienda...</p>
      </div>
    );
  }

  if (error || !tienda) {
    return (
      <div className="tienda-error-pantalla">
        <Store size={48} />
        <h2>Tienda no encontrada</h2>
        <p>El comercio que buscas no existe o aún no está activo en JAMA.</p>
        <a href="/" className="tienda-btn-volver press">
          <ArrowLeft size={16} /> Ver ofertas del Centro
        </a>
      </div>
    );
  }

  const queryMaps = encodeURIComponent(`${tienda.nombre} ${tienda.direccion} Huamanga Ayacucho`.trim());
  const enlaceMaps = tienda.direccion
    ? `https://www.google.com/maps/search/?api=1&query=${queryMaps}`
    : null;

  const mensajeWa = encodeURIComponent(
    `¡Hola ${tienda.nombre}! Vi su perfil en JAMA Huamanga y quisiera consultar sobre sus ofertas de hoy.`
  );
  const enlaceWa = `https://wa.me/${tienda.whatsapp}?text=${mensajeWa}`;

  return (
    <div className="tienda-pagina">
      {/* Barra Superior Sticky */}
      <header className="tienda-cabecera">
        <a href="/" className="tienda-btn-atras press" title="Volver a la vitrina">
          <ArrowLeft size={18} />
          <span>Ofertas</span>
        </a>

        <a href="/" className="tienda-cabecera__logo-link">
          <img src={logoJama} alt="JAMA" className="tienda-cabecera__logo" />
        </a>

        <button type="button" onClick={handleCompartir} className="tienda-btn-compartir press" title="Compartir tienda">
          {copiado ? <Check size={16} /> : <Share2 size={16} />}
        </button>
      </header>

      {/* Portada Panorámica */}
      <div
        className={`tienda-portada ${!tienda.portadaUrl ? 'tienda-portada--fallback' : ''}`}
        style={{
          backgroundImage: tienda.portadaUrl ? `url(${tienda.portadaUrl})` : undefined,
        }}
      >
        <div className="tienda-portada__overlay" />
      </div>

      {/* Tarjeta de Identidad del Comercio */}
      <main className="tienda-contenedor">
        <div className="tienda-tarjeta-perfil">
          {/* Logotipo */}
          <div className="tienda-logo-wrapper">
            {tienda.logoUrl ? (
              <img src={tienda.logoUrl} alt={tienda.nombre} className="tienda-logo-img" />
            ) : (
              <div className="tienda-logo-placeholder">
                <Store size={36} />
              </div>
            )}
          </div>

          {/* Información Comercial */}
          <div className="tienda-info-header">
            <h1 className="tienda-nombre">{tienda.nombre}</h1>

            <div className="tienda-badges-row">
              <span className="tienda-badge tienda-badge--rubro">
                {tienda.tipo === 'OTRO' && tienda.tipoDetalle ? tienda.tipoDetalle : tienda.tipo}
              </span>
              <span className="tienda-badge tienda-badge--verificado">
                <CheckCircle2 size={13} /> Verificado JAMA
              </span>
              <span className="tienda-badge tienda-badge--zona">📍 Huamanga · Centro</span>
            </div>

            {tienda.descripcion && <p className="tienda-descripcion">"{tienda.descripcion}"</p>}
          </div>

          {/* Ficha de Detalles y Contacto Rápido */}
          <div className="tienda-contacto-card">
            <div className="tienda-contacto-item">
              <MapPin size={16} className="tienda-icono-acento" />
              <div className="tienda-contacto-texto">
                <span className="tienda-contacto-label">Dirección en Huamanga</span>
                <span className="tienda-contacto-valor">{tienda.direccion}</span>
                {enlaceMaps && (
                  <a href={enlaceMaps} target="_blank" rel="noopener noreferrer" className="tienda-link-maps">
                    <Navigation size={12} /> Abrir en Google Maps
                  </a>
                )}
              </div>
            </div>

            <div className="tienda-contacto-item">
              <Clock size={16} className="tienda-icono-acento" />
              <div className="tienda-contacto-texto">
                <span className="tienda-contacto-label">Horario de recojo</span>
                <span className="tienda-contacto-valor">
                  {tienda.horarioAtencion || 'De 6:00 p. m. a 7:30 p. m. (horario de cierre)'}
                </span>
              </div>
            </div>

            {tienda.yape && (
              <div className="tienda-contacto-item">
                <Smartphone size={16} className="tienda-icono-acento" />
                <div className="tienda-contacto-texto">
                  <span className="tienda-contacto-label">Medios de pago</span>
                  <span className="tienda-contacto-valor">Yape ({tienda.yape}) o efectivo en tienda</span>
                </div>
              </div>
            )}

            <a href={enlaceWa} target="_blank" rel="noopener noreferrer" className="tienda-btn-whatsapp press">
              <MessageCircle size={18} />
              <span>Escribir al WhatsApp del local</span>
            </a>

            {(tienda.enlaceInstagram || tienda.enlaceFacebook || tienda.enlaceTiktok) && (
              <div className="tienda-redes-wrapper">
                <span className="tienda-redes-titulo">Canales oficiales:</span>
                <div className="tienda-redes-fila">
                  {tienda.enlaceInstagram && (
                    <a
                      href={tienda.enlaceInstagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tienda-red-boton tienda-red-boton--ig press"
                      title="Visitar Instagram oficial"
                    >
                      <InstagramIcon size={16} />
                      <span>Instagram</span>
                    </a>
                  )}
                  {tienda.enlaceFacebook && (
                    <a
                      href={tienda.enlaceFacebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tienda-red-boton tienda-red-boton--fb press"
                      title="Visitar página de Facebook oficial"
                    >
                      <FacebookIcon size={16} />
                      <span>Facebook</span>
                    </a>
                  )}
                  {tienda.enlaceTiktok && (
                    <a
                      href={tienda.enlaceTiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tienda-red-boton tienda-red-boton--tt press"
                      title="Visitar TikTok oficial"
                    >
                      <TikTokIcon size={16} />
                      <span>TikTok</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sección de Ofertas del Comercio */}
        <section className="tienda-seccion-ofertas">
          <div className="tienda-seccion-titulo-row">
            <h2 className="tienda-seccion-titulo">Ofertas vigentes de hoy</h2>
            <span className="tienda-conteo-ofertas">
              {tienda.ofertas?.length || 0} {tienda.ofertas?.length === 1 ? 'oferta' : 'ofertas'}
            </span>
          </div>

          {tienda.ofertas && tienda.ofertas.length > 0 ? (
            <div className="tienda-grid-ofertas">
              {tienda.ofertas.map((oferta) => (
                <OfertaCard
                  key={oferta.id}
                  oferta={oferta}
                  onPedir={handlePedir}
                  cargando={pedirCargandoId === oferta.id}
                />
              ))}
            </div>
          ) : (
            <div className="tienda-vacio-card">
              <div className="tienda-vacio-icono">
                <ShoppingBag size={36} />
              </div>
              <h3 className="tienda-vacio-titulo">Hoy no hay ofertas de cierre publicadas</h3>
              <p className="tienda-vacio-desc">
                Este local suele publicar sus excedentes entre las <strong>5:00 p. m.</strong> y{' '}
                <strong>6:30 p. m.</strong> conforme termina su producción del día.
              </p>
              <div className="tienda-vacio-acciones">
                <a href={enlaceWa} target="_blank" rel="noopener noreferrer" className="tienda-vacio-btn-wa press">
                  <MessageCircle size={16} /> Consultar disponibilidad por WhatsApp
                </a>
                <a href="/" className="tienda-vacio-btn-todas press">
                  Ver otras ofertas del Centro
                </a>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Modal interactivo de confirmación con Flujo Concierge Yape */}
      {confirmacion && (() => {
        const yapeNumero = confirmacion.pago?.yapeNumero || import.meta.env.VITE_JAMA_YAPE_NUMERO || '987654321';
        const yapeTitular = confirmacion.pago?.yapeTitular || import.meta.env.VITE_JAMA_YAPE_TITULAR || 'JAMA Huamanga';
        const monto = Number(confirmacion.precio ?? confirmacion.oferta?.precioOferta ?? 0);

        return (
          <div className="modal-confirmacion-overlay" onClick={() => setConfirmacion(null)} role="dialog" aria-modal="true">
            <div className="modal-confirmacion" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="modal-confirmacion__cerrar" onClick={() => setConfirmacion(null)} aria-label="Cerrar modal">
                <X size={20} />
              </button>

              <div className="modal-confirmacion__cabecera">
                <div className="modal-confirmacion__icono-exito">
                  <Check size={28} />
                </div>
                <h2 className="modal-confirmacion__titulo">¡Reserva generada!</h2>
                <p className="modal-confirmacion__subtitulo">
                  Sigue estos 3 sencillos pasos para confirmar y recoger tu pedido:
                </p>
              </div>

              {/* Paso 1: Paga con Yape a JAMA */}
              <div className="modal-confirmacion__paso-caja modal-confirmacion__paso-caja--yape">
                <div className="modal-confirmacion__paso-cabecera">
                  <span className="modal-confirmacion__paso-badge">Paso 1</span>
                  <span className="modal-confirmacion__paso-titulo">Yapea el monto a JAMA</span>
                </div>
                <div className="modal-confirmacion__yape-monto">
                  <span className="modal-confirmacion__yape-monto-lbl">Total a pagar:</span>
                  <strong className="modal-confirmacion__yape-monto-val">S/ {monto.toFixed(2)}</strong>
                </div>
                <div className="modal-confirmacion__yape-datos">
                  <div className="modal-confirmacion__yape-fila">
                    <span>Número Yape / Plin:</span>
                    <div className="modal-confirmacion__yape-copiar">
                      <strong>{yapeNumero}</strong>
                      <button
                        type="button"
                        onClick={() => handleCopiarYape(yapeNumero)}
                        className="modal-confirmacion__btn-copiar"
                        title="Copiar número"
                      >
                        {copiadoYape ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiadoYape ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="modal-confirmacion__yape-fila">
                    <span>Titular:</span>
                    <strong>{yapeTitular}</strong>
                  </div>
                </div>
              </div>

              {/* Paso 2: Envía constancia por WhatsApp a JAMA */}
              <div className="modal-confirmacion__paso-caja">
                <div className="modal-confirmacion__paso-cabecera">
                  <span className="modal-confirmacion__paso-badge">Paso 2</span>
                  <span className="modal-confirmacion__paso-titulo">Envía constancia a JAMA</span>
                </div>
                <p className="modal-confirmacion__paso-desc">
                  Envíanos la captura de tu Yape por WhatsApp para validar tu pago y emitirte la orden autorizada:
                </p>
                <a
                  className="modal-confirmacion__btn-wa press"
                  href={confirmacion.enlaceWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle size={20} />
                  <span>Enviar constancia por WhatsApp a JAMA</span>
                </a>
              </div>

              {/* Paso 3: Código de recojo y punto de entrega */}
              <div className="modal-confirmacion__paso-caja modal-confirmacion__paso-caja--recojo">
                <div className="modal-confirmacion__paso-cabecera">
                  <span className="modal-confirmacion__paso-badge">Paso 3</span>
                  <span className="modal-confirmacion__paso-titulo">Recoge con tu código</span>
                </div>
                <div className="modal-confirmacion__codigo-caja" style={{ margin: '8px 0 12px' }}>
                  <span className="modal-confirmacion__codigo-etiqueta">Tu código de recojo</span>
                  <div className="modal-confirmacion__codigo-valor">{confirmacion.codigo}</div>
                  <span className="modal-confirmacion__codigo-nota">
                    Reserva válida por 30 minutos · Muestra este código al llegar
                  </span>
                </div>
                <div className="modal-confirmacion__comercio-ficha" style={{ margin: 0 }}>
                  <div className="modal-confirmacion__comercio-info">
                    <h4 className="modal-confirmacion__comercio-nombre">{tienda.nombre}</h4>
                    <p className="modal-confirmacion__comercio-dir">📍 {tienda.direccion}</p>
                    <p className="modal-confirmacion__comercio-item">
                      🛍️ <strong>{confirmacion.oferta?.titulo}</strong> · S/ {monto.toFixed(2)}
                    </p>
                  </div>
                </div>
                {enlaceMaps && (
                  <a
                    className="modal-confirmacion__btn-maps press"
                    href={enlaceMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: 10 }}
                  >
                    <Navigation size={18} />
                    <span>Cómo llegar al local (Google Maps)</span>
                  </a>
                )}
              </div>

              <button type="button" className="modal-confirmacion__btn-listo" onClick={() => setConfirmacion(null)}>
                Entendido, volver a la tienda
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
