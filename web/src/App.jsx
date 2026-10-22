import { useEffect, useRef, useState } from 'react';
import { obtenerOfertasDeHoy, pedirOferta } from './api.js';
import OfertaCard from './components/OfertaCard.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import ComoFunciona from './components/ComoFunciona.jsx';
import Faq from './components/Faq.jsx';
import CtaNegocio from './components/CtaNegocio.jsx';
import EjemplosIlustrativos from './components/EjemplosIlustrativos.jsx';
import logoJama from './assets/jama-logo.png';

export default function App() {
  const [ofertas, setOfertas] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState(null);
  const [ofertaEnProceso, setOfertaEnProceso] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [avisoError, setAvisoError] = useState(null);
  const refOfertas = useRef(null);

  async function cargarOfertas() {
    setCargandoLista(true);
    setErrorLista(null);
    try {
      const datos = await obtenerOfertasDeHoy();
      setOfertas(datos);
    } catch {
      setErrorLista('No pudimos cargar las ofertas de hoy. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setCargandoLista(false);
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
      cargarOfertas();
    } catch (error) {
      if (error.status === 409) {
        setAvisoError('Justo se agotó esta oferta. Alguien más la pidió primero.');
        cargarOfertas();
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

        {confirmacion && (
          <div className="confirmacion">
            <p className="confirmacion__titulo">¡Listo! Tu código es {confirmacion.codigo}</p>
            <p>
              Te abrimos WhatsApp para coordinar con <strong>{confirmacion.oferta.titulo}</strong>. Si no
              se abrió, usa el botón de abajo.
            </p>
            <a
              className="boton-pedir boton-pedir--enlace"
              href={confirmacion.enlaceWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir WhatsApp
            </a>
            <button type="button" className="confirmacion__cerrar" onClick={() => setConfirmacion(null)}>
              Cerrar
            </button>
          </div>
        )}

        <div className="seccion__encabezado">
          <p className="seccion__etiqueta">Ofertas de cierre</p>
          <h2 className="seccion__titulo">La JAMA de hoy</h2>
          <p className="seccion__bajada">Lo que quedó hoy en pastelerías y panaderías de Huamanga.</p>
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

      <ComoFunciona />
      <Faq />
      <CtaNegocio />

      <footer className="pie">
        <img className="pie__logo" src={logoJama} alt="JAMA" width="84" height="40" loading="lazy" />
        <p className="pie__lema">Comida rica de hoy, más barata y cerca de ti.</p>
        <p className="pie__nota">Huamanga, Ayacucho · Pago y coordinación por WhatsApp y Yape</p>
      </footer>
    </div>
  );
}
