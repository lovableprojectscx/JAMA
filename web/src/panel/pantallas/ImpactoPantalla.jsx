import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  UtensilsCrossed,
  CheckCircle2,
  Leaf,
  Droplets,
  Share2,
  Calendar,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { obtenerMetricas } from '../api.js';

const PERIODOS = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: 'semana', etiqueta: '7 días' },
  { id: 'mes', etiqueta: 'Este mes' },
  { id: 'historico', etiqueta: 'Histórico' },
];

export default function ImpactoPantalla({ token, negocioNombre = 'Mi Negocio' }) {
  const [periodo, setPeriodo] = useState('mes');
  const [metricas, setMetricas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  const cargarDatos = useCallback(async (p) => {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerMetricas(token, p);
      setMetricas(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las métricas');
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos(periodo);
  }, [cargarDatos, periodo]);

  function handleCompartir() {
    if (!metricas) return;
    const raciones = metricas.kpis.racionesRescatadas;
    const dinero = metricas.kpis.dineroRecuperado.toFixed(2);
    const co2 = metricas.impactoAmbiental.co2EvitadoKg;

    const texto = `🌱 ¡En ${negocioNombre} estamos comprometidos con Huamanga!
A través de JAMA hemos rescatado ${raciones} raciones de comida fresca, recuperando S/ ${dinero} y evitando ${co2} kg de CO₂ al planeta. 🍞✨

Conoce nuestras ofertas de cierre hoy en:
${window.location.origin}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }

    const urlWa = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(urlWa, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="impacto-pantalla">
      {/* Cabecera */}
      <div className="impacto-header">
        <div className="impacto-header__titulo-row">
          <div className="impacto-header__icono">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="impacto-header__badge">Rendimiento Comercial & Ecológico</span>
            <h2 className="impacto-header__titulo">Métricas de Impacto</h2>
          </div>
        </div>
        <p className="impacto-header__desc">
          Mide el dinero recuperado de tus mermas y los alimentos salvados en Huamanga.
        </p>
      </div>

      {/* Selector de Período */}
      <div className="impacto-periodos-row" role="tablist" aria-label="Seleccionar período">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={periodo === p.id}
            className={`impacto-periodo-btn press ${periodo === p.id ? 'impacto-periodo-btn--activo' : ''}`}
            onClick={() => setPeriodo(p.id)}
          >
            <Calendar size={13} />
            <span>{p.etiqueta}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="perfil-aviso perfil-aviso--error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {cargando ? (
        <div className="perfil-cargando">
          <Loader2 className="animar-spin" size={32} />
          <p>Calculando impacto de tu negocio...</p>
        </div>
      ) : metricas ? (
        <div className="impacto-contenido">
          {/* Cuadrícula de KPIs Principales */}
          <div className="impacto-kpi-grid">
            {/* Dinero Recuperado */}
            <div className="impacto-kpi-card impacto-kpi-card--dinero">
              <div className="impacto-kpi-card__top">
                <span className="impacto-kpi-card__label">Dinero Recuperado</span>
                <div className="impacto-kpi-card__icono impacto-kpi-card__icono--dinero">
                  <DollarSign size={18} />
                </div>
              </div>
              <div className="impacto-kpi-card__valor">
                S/ {metricas.kpis.dineroRecuperado.toFixed(2)}
              </div>
              <div className="impacto-kpi-card__pie">
                Valor carta recuperado: <strong>S/ {metricas.kpis.valorOriginal.toFixed(2)}</strong>
              </div>
            </div>

            {/* Raciones Rescatadas */}
            <div className="impacto-kpi-card impacto-kpi-card--raciones">
              <div className="impacto-kpi-card__top">
                <span className="impacto-kpi-card__label">Raciones Rescatadas</span>
                <div className="impacto-kpi-card__icono impacto-kpi-card__icono--raciones">
                  <UtensilsCrossed size={18} />
                </div>
              </div>
              <div className="impacto-kpi-card__valor">
                {metricas.kpis.racionesRescatadas} <span className="impacto-kpi-unidad">porciones</span>
              </div>
              <div className="impacto-kpi-card__pie">
                Descuento promedio al público: <strong>{metricas.kpis.descuentoPromedio}%</strong>
              </div>
            </div>

            {/* Tasa de Efectividad */}
            <div className="impacto-kpi-card impacto-kpi-card--efectividad">
              <div className="impacto-kpi-card__top">
                <span className="impacto-kpi-card__label">Efectividad en Mostrador</span>
                <div className="impacto-kpi-card__icono impacto-kpi-card__icono--efectividad">
                  <CheckCircle2 size={18} />
                </div>
              </div>
              <div className="impacto-kpi-card__valor">
                {metricas.kpis.tasaEfectividad}%
              </div>
              <div className="impacto-kpi-card__pie">
                {metricas.pedidosPorEstado.vendidos} canjes concretados ({metricas.pedidosPorEstado.noConcretados} no recogidos)
              </div>
            </div>

            {/* Impacto Ecológico Huamanga */}
            <div className="impacto-kpi-card impacto-kpi-card--eco">
              <div className="impacto-kpi-card__top">
                <span className="impacto-kpi-card__label">CO₂ Evitado</span>
                <div className="impacto-kpi-card__icono impacto-kpi-card__icono--eco">
                  <Leaf size={18} />
                </div>
              </div>
              <div className="impacto-kpi-card__valor">
                {metricas.impactoAmbiental.co2EvitadoKg} <span className="impacto-kpi-unidad">kg CO₂e</span>
              </div>
              <div className="impacto-kpi-card__pie">
                <Droplets size={12} className="inline-icon" /> ~{metricas.impactoAmbiental.aguaAhorradaLitros} L agua ahorrada
              </div>
            </div>
          </div>

          {/* Tarjeta de Reconocimiento y Resumen Social */}
          <div className="impacto-banner-social">
            <div className="impacto-banner-social__info">
              <div className="impacto-badge-verde">
                <Sparkles size={12} /> Comercio Sostenible de Ayacucho
              </div>
              <h3 className="impacto-banner-social__titulo">¡Comparte tu impacto con tus clientes!</h3>
              <p className="impacto-banner-social__sub">
                Tus clientes valoran los negocios responsables que evitan el desperdicio. Comparte tus logros en tus estados o historias.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCompartir}
              className="impacto-btn-compartir press"
              title="Compartir en WhatsApp"
            >
              <Share2 size={16} />
              <span>{copiado ? '¡Copiado para compartir!' : 'Compartir en WhatsApp'}</span>
            </button>
          </div>

          {/* Desglose de Productos más Rescatados */}
          <div className="impacto-top-seccion">
            <h4 className="impacto-top-seccion__titulo">
              <ShoppingBag size={18} /> Productos Más Rescatados en el Período
            </h4>

            {metricas.topOfertas && metricas.topOfertas.length > 0 ? (
              <div className="impacto-top-lista">
                {metricas.topOfertas.map((item, index) => (
                  <div key={item.id} className="impacto-top-item">
                    <span className="impacto-top-ranking">#{index + 1}</span>
                    <div className="impacto-top-info">
                      <h5 className="impacto-top-nombre">{item.titulo}</h5>
                      <span className="impacto-top-sub">
                        {item.racionesVendidas} {item.racionesVendidas === 1 ? 'ración rescatada' : 'raciones rescatadas'}
                      </span>
                    </div>
                    <div className="impacto-top-monto">
                      S/ {item.dineroRecuperado.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="impacto-vacio-box">
                <UtensilsCrossed size={32} className="impacto-vacio-icono" />
                <p className="impacto-vacio-texto">
                  No se registran canjes concretados en este período.
                </p>
                <span className="impacto-vacio-pista">
                  Publica tus ofertas de cierre diarias para que tus clientes las reserven en JAMA.
                </span>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
