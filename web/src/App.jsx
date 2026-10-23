import { useState, useEffect, useRef } from 'react';
import { Check, Compass, MapPin, MessageCircle, Store, X } from 'lucide-react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import OfertaCard from './components/OfertaCard.jsx';
import EjemplosIlustrativos from './components/EjemplosIlustrativos.jsx';
import ComoFunciona from './components/ComoFunciona.jsx';
import Faq from './components/Faq.jsx';
import CtaNegocio from './components/CtaNegocio.jsx';
import { obtenerOfertas, pedirOferta } from './api.js';
import logoJama from './assets/jama-logo.png';

const ANIO_ACTUAL = new Date().getFullYear();

export default function App() {
  const [ofertas, setOfertas] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState(null);
  const [ofertaEnProceso, setOfertaEnProceso] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [avisoError, setAvisoError] = useState(null);

  const refOfertas = useRef(null);

  async function cargarOfertas(opciones = {}) {
    const { silencioso = false } = opciones;
    if (!silencioso) setCargandoLista(true);
    setErrorLista(null);
    try {
      const datos = await obtenerOfertas();
      setOfertas(datos);
    } catch {
      setErrorLista('No pudimos cargar las ofertas. Revisa tu conexión.');
    } finally {
      if (!silencioso) setCargandoLista(false);
    }
  }

  useEffect(() => {
    cargarOfertas();
  }, []);

  async function handlePedir(oferta) {
    setOfertaEnProceso(oferta.id);
    setAvisoError(null);
    try {
      const resultado = await pedirOferta(oferta.id);
      setConfirmacion({ ...resultado, oferta });
      window.open(resultado.enlaceWhatsapp, '_blank', 'noopener,noreferrer');
      // Recarga silenciosa en segundo plano sin desmontar la pantalla
      cargarOfertas({ silencioso: true });
    } catch (error) {
      if (error.status === 409) {
        setAvisoError('Justo se agotó esta oferta. Alguien más la pidió primero.');
        cargarOfertas({ silencioso: true });
      } else if (error.status === 429) {
        setAvisoError('Muchos pedidos seguidos. Espera un momento e inténtalo de nuevo.');
      } else {
        setAvisoError('No pudimos generar tu código. Inténtalo de nuevo.');
      }
    } finally {
      setOfertaEnProceso(null);
    }
  }

  function handleVerOfertas() {
    refOfertas.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="pagina">
      <Header />
      <Hero onVerOfertas={handleVerOfertas} />

      <main className="contenido" id="ofertas" ref={refOfertas}>
        {avisoError && <div className="aviso aviso--error">{avisoError}</div>}

        {/* Encabezado de la vitrina con badge de Zona Centro */}
        <div className="seccion__encabezado">
          <div className="seccion__badge-zona">
            <span className="seccion__badge-punto" aria-hidden="true" />
            <MapPin size={13} aria-hidden="true" />
            <span>Huamanga · Centro</span>
          </div>
          <h2 className="seccion__titulo">La JAMA de hoy</h2>
          <p className="seccion__bajada">
            Lotes frescos de pastelerías del centro a mitad de precio.
          </p>
        </div>

        {cargandoLista && <p className="estado">Cargando ofertas de hoy...</p>}
        {!cargandoLista && errorLista && <p className="estado estado--error">{errorLista}</p>}
        {!cargandoLista && !errorLista && ofertas.length === 0 && <EjemplosIlustrativos />}
        {!cargandoLista && !errorLista && ofertas.length > 0 && (
          <div className="lista-ofertas">
            {ofertas.map((oferta) => (
              <OfertaCard
                key={oferta.id}
                oferta={oferta}
                onPedir={handlePedir}
                cargando={ofertaEnProceso === oferta.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modal interactivo de confirmación (Bottom Sheet en móvil, Modal centrado en escritorio) */}
      {confirmacion && (
        <div
          className="modal-confirmacion-overlay"
          onClick={() => setConfirmacion(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-confirmacion" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-confirmacion__cerrar"
              onClick={() => setConfirmacion(null)}
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>

            <div className="modal-confirmacion__cabecera">
              <div className="modal-confirmacion__icono-exito">
                <Check size={28} />
              </div>
              <h2 className="modal-confirmacion__titulo">¡Reserva confirmada!</h2>
              <p className="modal-confirmacion__subtitulo">
                Tienes <strong>30 minutos</strong> de reserva. Pagas en el local.
              </p>
            </div>

            {/* Caja destacada del código de canje */}
            <div className="modal-confirmacion__codigo-caja">
              <span className="modal-confirmacion__codigo-etiqueta">Tu código de recojo</span>
              <div className="modal-confirmacion__codigo-valor">{confirmacion.codigo}</div>
              <span className="modal-confirmacion__codigo-nota">
                Muestra este código al llegar · Pagas con Yape o efectivo
              </span>
            </div>

            {/* Ficha del comercio y punto de recojo en Zona Centro */}
            <div className="modal-confirmacion__comercio-ficha">
              <div className="modal-confirmacion__comercio-icono">
                <Store size={22} />
              </div>
              <div className="modal-confirmacion__comercio-info">
                <h4 className="modal-confirmacion__comercio-nombre">
                  {confirmacion.negocioNombre || confirmacion.oferta?.negocioNombre || 'Comercio afiliado'}
                </h4>
                <p className="modal-confirmacion__comercio-dir">
                  📍 {confirmacion.negocioDireccion || confirmacion.oferta?.negocioDireccion || 'Centro, Huamanga'}
                </p>
                <p className="modal-confirmacion__comercio-item">
                  🛍️ <strong>{confirmacion.oferta?.titulo}</strong> · S/{' '}
                  {(confirmacion.precio ?? confirmacion.oferta?.precioOferta ?? 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Acciones principales */}
            <div className="modal-confirmacion__acciones">
              <a
                className="modal-confirmacion__btn-wa press"
                href={confirmacion.enlaceWhatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={20} />
                <span>WhatsApp del negocio</span>
              </a>

              {(confirmacion.enlaceMaps || confirmacion.oferta?.enlaceMaps) && (
                <a
                  className="modal-confirmacion__btn-maps press"
                  href={confirmacion.enlaceMaps || confirmacion.oferta?.enlaceMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Compass size={18} />
                  <span>Cómo llegar (Google Maps)</span>
                </a>
              )}
            </div>

            <button
              type="button"
              className="modal-confirmacion__btn-listo"
              onClick={() => setConfirmacion(null)}
            >
              Listo, volver a las ofertas
            </button>
          </div>
        </div>
      )}

      <ComoFunciona />
      <Faq />
      <CtaNegocio />

      <footer className="pie">
        <div className="pie__interior">
          <div className="pie__marca">
            <img src={logoJama} alt="JAMA" className="pie__logo" />
            <p className="pie__eslogan">La comida más rica de Ayacucho, sin desperdicios.</p>
          </div>
          <p className="pie__legal">
            © {ANIO_ACTUAL} JAMA · Huamanga, Ayacucho. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
