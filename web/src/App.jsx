import { useState, useEffect, useRef, useMemo } from 'react';
import { Check, Compass, Copy, MapPin, MessageCircle, Store, X } from 'lucide-react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import OfertaCard from './components/OfertaCard.jsx';
import FiltroCategorias from './components/FiltroCategorias.jsx';
import {
  CATEGORIAS_BASE,
  normalizarClave,
  resolverEmojiDetalle,
  capitalizar,
} from './compartido/categorias.js';
import EjemplosIlustrativos from './components/EjemplosIlustrativos.jsx';
import ComoFunciona from './components/ComoFunciona.jsx';
import ComunidadWhatsapp from './components/ComunidadWhatsapp.jsx';
import Faq from './components/Faq.jsx';
import CtaNegocio from './components/CtaNegocio.jsx';
import { ENLACES_JAMA } from './compartido/enlaces-jama.js';
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
  const [categoriaActiva, setCategoriaActiva] = useState('TODAS');
  const [copiadoYape, setCopiadoYape] = useState(false);

  function handleCopiarYape(numero) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(numero);
      setCopiadoYape(true);
      setTimeout(() => setCopiadoYape(false), 2000);
    }
  }

  const refOfertas = useRef(null);

  const { categorias, conteos, ofertasFiltradas } = useMemo(() => {
    const mapaConteos = { TODAS: ofertas.length };
    const categoriasDinamicasMap = new Map();

    function resolverCategoriaId(oferta) {
      const tipo = oferta.negocioTipo || 'OTRO';
      const detalle = (oferta.negocioTipoDetalle || '').trim();
      if (tipo === 'OTRO' && detalle) {
        return `OTRO:${normalizarClave(detalle)}`;
      }
      return tipo;
    }

    for (const o of ofertas) {
      const catId = resolverCategoriaId(o);
      mapaConteos[catId] = (mapaConteos[catId] || 0) + 1;

      if (catId.startsWith('OTRO:') && !categoriasDinamicasMap.has(catId)) {
        const detalle = o.negocioTipoDetalle.trim();
        categoriasDinamicasMap.set(catId, {
          id: catId,
          etiqueta: capitalizar(detalle),
          emoji: resolverEmojiDetalle(detalle),
        });
      }
    }

    const categoriasCompletas = [
      ...CATEGORIAS_BASE,
      ...Array.from(categoriasDinamicasMap.values()),
    ];

    const filtradas =
      categoriaActiva === 'TODAS'
        ? ofertas
        : ofertas.filter((o) => resolverCategoriaId(o) === categoriaActiva);

    return {
      categorias: categoriasCompletas,
      conteos: mapaConteos,
      ofertasFiltradas: filtradas,
    };
  }, [ofertas, categoriaActiva]);

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
            Excedentes frescos de locales del Centro de Huamanga a mitad de precio.
          </p>
        </div>

        {!cargandoLista && !errorLista && ofertas.length > 0 && (
          <FiltroCategorias
            categorias={categorias}
            categoriaSeleccionada={categoriaActiva}
            onSeleccionarCategoria={setCategoriaActiva}
            conteos={conteos}
          />
        )}

        {cargandoLista && <p className="estado">Cargando ofertas de hoy...</p>}
        {!cargandoLista && errorLista && <p className="estado estado--error">{errorLista}</p>}
        {!cargandoLista && !errorLista && ofertas.length === 0 && <EjemplosIlustrativos />}
        {!cargandoLista && !errorLista && ofertas.length > 0 && ofertasFiltradas.length > 0 && (
          <div className="lista-ofertas">
            {ofertasFiltradas.map((oferta) => (
              <OfertaCard
                key={oferta.id}
                oferta={oferta}
                onPedir={handlePedir}
                cargando={ofertaEnProceso === oferta.id}
              />
            ))}
          </div>
        )}
        {!cargandoLista && !errorLista && ofertas.length > 0 && ofertasFiltradas.length === 0 && (
          <div className="filtro-vacio">
            <span className="filtro-vacio__icono">🔍</span>
            <h3 className="filtro-vacio__titulo">No hay ofertas en esta categoría hoy</h3>
            <p className="filtro-vacio__desc">
              Los locales de este rubro aún no han publicado excedentes para hoy. Puedes revisar más tarde o explorar las demás opciones.
            </p>
            <button
              type="button"
              className="filtro-vacio__btn press"
              onClick={() => setCategoriaActiva('TODAS')}
            >
              Ver todas las ofertas
            </button>
          </div>
        )}
      </main>

      {/* Modal interactivo de confirmación con Flujo Concierge Yape */}
      {confirmacion && (() => {
        const yapeNumero = confirmacion.pago?.yapeNumero || import.meta.env.VITE_JAMA_YAPE_NUMERO || '987654321';
        const yapeTitular = confirmacion.pago?.yapeTitular || import.meta.env.VITE_JAMA_YAPE_TITULAR || 'JAMA Huamanga';
        const monto = Number(confirmacion.precio ?? confirmacion.oferta?.precioOferta ?? 0);

        return (
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

              {/* Paso 2: Envía tu comprobante por WhatsApp a JAMA */}
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

              {/* Paso 3: Código de recojo y dirección de la tienda */}
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
                      🛍️ <strong>{confirmacion.oferta?.titulo}</strong> · S/ {monto.toFixed(2)}
                    </p>
                  </div>
                </div>
                {(confirmacion.enlaceMaps || confirmacion.oferta?.enlaceMaps) && (
                  <a
                    className="modal-confirmacion__btn-maps press"
                    href={confirmacion.enlaceMaps || confirmacion.oferta?.enlaceMaps}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: 10 }}
                  >
                    <Compass size={18} />
                    <span>Cómo llegar al local (Google Maps)</span>
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
        );
      })()}

      <ComoFunciona />
      <ComunidadWhatsapp />
      <Faq />
      <CtaNegocio />

      <footer className="pie">
        <div className="pie__interior">
          <div className="pie__marca">
            <img src={logoJama} alt="JAMA" className="pie__logo" />
            <p className="pie__eslogan">La comida más rica de Ayacucho, sin desperdicios.</p>
          </div>
          <div className="pie__enlaces">
            <a href="/bio" className="pie__enlace">Conoce JAMA</a>
            <span aria-hidden="true"> · </span>
            <a
              href={ENLACES_JAMA.grupoWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="pie__enlace"
            >
              Grupo WhatsApp
            </a>
            <span aria-hidden="true"> · </span>
            <a
              href={ENLACES_JAMA.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="pie__enlace"
            >
              Facebook
            </a>
            <span aria-hidden="true"> · </span>
            <a
              href={ENLACES_JAMA.tiktok}
              target="_blank"
              rel="noopener noreferrer"
              className="pie__enlace"
            >
              TikTok
            </a>
            <span aria-hidden="true"> · </span>
            <a href="/negocios" className="pie__enlace">Para Negocios</a>
            <span aria-hidden="true"> · </span>
            <a href="/terminos" className="pie__enlace">Términos</a>
          </div>
          <p className="pie__legal">
            © {ANIO_ACTUAL} JAMA · Huamanga, Ayacucho. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
