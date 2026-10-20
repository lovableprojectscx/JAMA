import { useEffect, useState } from 'react';
import { obtenerOfertasDeHoy, pedirOferta } from './api.js';
import OfertaCard from './components/OfertaCard.jsx';

export default function App() {
  const [ofertas, setOfertas] = useState([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState(null);
  const [ofertaEnProceso, setOfertaEnProceso] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [avisoError, setAvisoError] = useState(null);

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

  return (
    <div className="pagina">
      <header className="cabecera">
        <span className="cabecera__marca">JAMA</span>
        <p className="cabecera__subtitulo">Ofertas de cierre en Ayacucho · recojo de 6 a 7 pm</p>
      </header>

      <main className="contenido">
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

        {cargandoLista && <p className="estado">Cargando ofertas de hoy...</p>}

        {!cargandoLista && errorLista && <p className="estado estado--error">{errorLista}</p>}

        {!cargandoLista && !errorLista && ofertas.length === 0 && (
          <p className="estado">No hay ofertas disponibles por ahora. Vuelve más tarde.</p>
        )}

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

      <footer className="pie">El pago y la coordinación de la entrega se hacen por WhatsApp y Yape.</footer>
    </div>
  );
}
