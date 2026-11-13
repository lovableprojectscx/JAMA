import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import {
  obtenerMiPerfil,
  actualizarMiPerfil,
  subirFotoPortada,
  subirFotoLogo,
} from '../api.js';

export default function MiPerfilPantalla({ token }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoPortada, setSubiendoPortada] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [error, setError] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [copiado, setCopiado] = useState(false);

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
  });

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
      await actualizarMiPerfil(token, {
        descripcion: perfil.descripcion,
        direccion: perfil.direccion,
        yape: perfil.yape,
        horarioAtencion: perfil.horarioAtencion,
        tipo: perfil.tipo,
        tipoDetalle: perfil.tipo === 'OTRO' ? perfil.tipoDetalle : null,
      });
      setMensajeExito('¡Perfil actualizado con éxito!');
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
          Personaliza la imagen y los datos de tu tienda visibles para tus clientes en Huamanga.
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
            <p className="perfil-link-desc">Comparte este link en tu Instagram o estados de WhatsApp:</p>
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

      {/* Formulario de Datos Comerciales */}
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

        <button type="submit" disabled={guardando} className="perfil-btn-guardar press">
          {guardando ? 'Guardando cambios...' : 'Guardar cambios del perfil'}
        </button>
      </form>
    </div>
  );
}
