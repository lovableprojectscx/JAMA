import { ArrowLeft, Clock, ShieldCheck, Store, Scale } from 'lucide-react';
import logoJama from '../assets/jama-logo.png';
import './terminos.css';

export default function TerminosCondiciones() {
  return (
    <div className="terminos-pagina">
      {/* Cabecera */}
      <header className="terminos-header">
        <div className="terminos-header__interior">
          <a href="/" aria-label="JAMA, volver al inicio">
            <img src={logoJama} alt="JAMA" width="92" height="44" />
          </a>
          <a href="/" className="terminos-header__volver">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Volver al inicio</span>
          </a>
        </div>
      </header>

      {/* Contenido */}
      <main className="terminos-contenido">
        <div className="terminos-intro">
          <span className="terminos-badge">
            <Scale size={14} aria-hidden="true" />
            Aviso Legal & Marco Regulatorio
          </span>
          <h1 className="terminos-titulo">Términos y Condiciones de Uso</h1>
          <p className="terminos-subtitulo">
            Reglas de uso de la plataforma, compromiso de inocuidad alimentaria y políticas de reserva para consumidores y comercios en Huamanga, Ayacucho.
          </p>
          <span className="terminos-actualizacion">
            Última actualización: 23 de octubre de 2026 · Conforme a la Ley N° 29571 del Perú
          </span>
        </div>

        {/* 3 Tarjetas de Resumen Ejecutivo */}
        <section className="terminos-resumen" aria-label="Resumen de puntos clave">
          <div className="terminos-card-resumen">
            <div className="terminos-card-resumen__icono">
              <Store size={20} aria-hidden="true" />
            </div>
            <h3>Plataforma de Enlace</h3>
            <p>
              JAMA es un intermediario digital que conecta usuarios con pastelerías y panaderías locales. No elabora ni manipula alimentos.
            </p>
          </div>

          <div className="terminos-card-resumen">
            <div className="terminos-card-resumen__icono">
              <ShieldCheck size={20} aria-hidden="true" />
            </div>
            <h3>Garantía e Inocuidad</h3>
            <p>
              Cada negocio afiliado asume la responsabilidad sanitaria legal exclusiva sobre la frescura e higiene de sus productos.
            </p>
          </div>

          <div className="terminos-card-resumen">
            <div className="terminos-card-resumen__icono">
              <Clock size={20} aria-hidden="true" />
            </div>
            <h3>Reserva a 30 Minutos</h3>
            <p>
              Apartas gratis en 1 toque. Tienes 30 minutos de reserva garantizada y pagas directo al recoger con Yape o efectivo.
            </p>
          </div>
        </section>

        {/* Cuerpo de Artículos */}
        <div className="terminos-cuerpo">
          {/* Artículo 1 */}
          <article className="terminos-articulo">
            <div className="terminos-articulo__encabezado">
              <span className="terminos-articulo__numero">ART. 01</span>
              <h2 className="terminos-articulo__titulo">Naturaleza del Servicio e Intermediación Tecnológica</h2>
            </div>
            <p>
              <strong>JAMA</strong> opera como una plataforma tecnológica de intermediación digital cuyo propósito es combatir el desperdicio de alimentos y dinamizar la economía local en la ciudad de Huamanga (Ayacucho), conectando a consumidores con establecimientos gastronómicos independientes (panaderías, pastelerías, cafeterías y afines).
            </p>
            <p className="terminos-destacado">
              JAMA no actúa como restaurante, panificadora, empresa de catering ni servicio de delivery. JAMA no prepara, envasa, cocina, manipula, almacena ni transporta productos alimenticios.
            </p>
          </article>

          {/* Artículo 2 */}
          <article className="terminos-articulo">
            <div className="terminos-articulo__encabezado">
              <span className="terminos-articulo__numero">ART. 02</span>
              <h2 className="terminos-articulo__titulo">Inocuidad y Responsabilidad Sanitaria de los Alimentos</h2>
            </div>
            <p>
              En estricto cumplimiento del <strong>Código de Protección y Defensa del Consumidor (Ley N° 29571)</strong> y las normativas sanitarias vigentes del Ministerio de Salud (MINSA / DIGESA):
            </p>
            <ul>
              <li>
                <strong>Responsabilidad exclusiva del comercio:</strong> El establecimiento gastronómico que publica la oferta es el único responsable legal y sanitario de la calidad, higiene, inocuidad, ingredientes, aptitud para consumo humano y fecha de caducidad del producto.
              </li>
              <li>
                <strong>Compromiso obligatorio de frescura (RC08):</strong> Todo negocio afiliado suscribe una declaración jurada garantizando que las ofertas publicadas corresponden a lotes frescos elaborados durante el día y aptos para su consumo inmediato.
              </li>
              <li>
                <strong>Alérgenos e ingredientes:</strong> Es deber del usuario consultar directamente con el personal del establecimiento respecto a ingredientes específicos o posibles alérgenos (gluten, lactosa, frutos secos, etc.) antes de concretar el consumo.
              </li>
            </ul>
          </article>

          {/* Artículo 3 */}
          <article className="terminos-articulo">
            <div className="terminos-articulo__encabezado">
              <span className="terminos-articulo__numero">ART. 03</span>
              <h2 className="terminos-articulo__titulo">Mecánica de Reserva y Plazo Perentorio de 30 Minutos</h2>
            </div>
            <p>
              Para asegurar un acceso justo y evitar el acaparamiento o sobreventas de productos perecibles:
            </p>
            <ul>
              <li>
                Al pulsar <em>"Reservar"</em>, el sistema descuenta de forma atómica una unidad del stock del comercio y genera un <strong>código alfanumérico único de 4 caracteres</strong> (ej. <code>7B9V</code>).
              </li>
              <li>
                La reserva tiene una vigencia máxima improrrogable de <strong>treinta (30) minutos</strong> a partir del momento de su emisión.
              </li>
              <li>
                Transcurrido dicho periodo sin que el cliente se haya presentado en el local físico o coordinado su recojo, el sistema marcará la reserva como <code>EXPIRADO</code> y reintegrará la unidad al inventario disponible para beneficio de otros vecinos.
              </li>
            </ul>
          </article>

          {/* Artículo 4 */}
          <article className="terminos-articulo">
            <div className="terminos-articulo__encabezado">
              <span className="terminos-articulo__numero">ART. 04</span>
              <h2 className="terminos-articulo__titulo">Precios, Descuentos y Congelamiento de Tramos Horarios</h2>
            </div>
            <p>
              Los precios de carta y precios de oferta son fijados libre y autónomamente por los establecimientos afiliados, debiendo cumplir siempre con la condición de que el precio de oferta sea estrictamente menor al precio regular de carta (RN-01).
            </p>
            <p>
              En ofertas que aplican <strong>tramos de precios decrecientes por hora (RN-11)</strong>, el precio legal exigible al momento del recojo es exactamente el precio vigente en el segundo en que el usuario generó su código de reserva. Si el precio baja con posterioridad a la reserva, el código conserva el monto acordado.
            </p>
          </article>

          {/* Artículo 5 */}
          <article className="terminos-articulo">
            <div className="terminos-articulo__encabezado">
              <span className="terminos-articulo__numero">ART. 05</span>
              <h2 className="terminos-articulo__titulo">Modalidad de Pago y Ausencia de Comisiones al Usuario</h2>
            </div>
            <p>
              El uso de JAMA para los consumidores es <strong>100% gratuito</strong>. JAMA no cobra comisiones de servicio al cliente ni exige el registro de tarjetas de crédito o débito en su plataforma.
            </p>
            <p>
              El pago se efectúa de manera directa entre el consumidor y el comercio al momento del recojo en tienda, mediante los métodos habilitados por el local (billeteras digitales <strong>Yape</strong> o <strong>Plin</strong>, o dinero en efectivo).
            </p>
          </article>

          {/* Artículo 6 */}
          <article className="terminos-articulo">
            <div className="terminos-articulo__encabezado">
              <span className="terminos-articulo__numero">ART. 06</span>
              <h2 className="terminos-articulo__titulo">Inspección en Mostrador y Desistimiento sin Penalidad</h2>
            </div>
            <p>
              Todo consumidor tiene el derecho de inspeccionar visualmente el estado del producto empaquetado en el mostrador del establecimiento antes de efectuar el pago.
            </p>
            <p>
              Si el producto no coincide con la descripción o no satisface las condiciones de frescura esperadas, el usuario puede <strong>desistir de la transacción en ese mismo instante sin penalidad alguna</strong>. En tal caso, el negocio registrará el pedido como <em>"No concretado"</em> en su panel.
            </p>
          </article>

          {/* Artículo 7 */}
          <article className="terminos-articulo">
            <div className="terminos-articulo__encabezado">
              <span className="terminos-articulo__numero">ART. 07</span>
              <h2 className="terminos-articulo__titulo">Protección de Datos Personales (Ley N° 29733)</h2>
            </div>
            <p>
              De conformidad con la <strong>Ley de Protección de Datos Personales (Ley N° 29733)</strong>:
            </p>
            <ul>
              <li>JAMA no comercializa, alquila ni comparte datos de sus usuarios con centrales de riesgo ni empresas de publicidad.</li>
              <li>Los números de contacto y nombres registrados por los comercios son tratados de forma confidencial y utilizados exclusivamente para la verificación administrativa y la coordinación del recojo.</li>
            </ul>
          </article>

          {/* Artículo 8 */}
          <article className="terminos-articulo">
            <div className="terminos-articulo__encabezado">
              <span className="terminos-articulo__numero">ART. 08</span>
              <h2 className="terminos-articulo__titulo">Legislación Aplicable y Jurisdicción</h2>
            </div>
            <p>
              Los presentes Términos y Condiciones se rigen e interpretan de acuerdo con las leyes de la República del Perú. Para la resolución de cualquier discrepancia que no pueda ser resuelta de común acuerdo, las partes se someten expresamente a la jurisdicción de los Juzgados y Tribunales de la <strong>Provincia de Huamanga, Distrito Judicial de Ayacucho</strong>.
            </p>
          </article>
        </div>
      </main>

      {/* Pie de Página */}
      <footer className="terminos-pie">
        <p>
          JAMA · Plataforma de Cierre Gastronómico · Huamanga, Ayacucho, Perú.<br />
          Para consultas o soporte legal: <a href="mailto:legal@jama.pe">legal@jama.pe</a>
        </p>
      </footer>
    </div>
  );
}
