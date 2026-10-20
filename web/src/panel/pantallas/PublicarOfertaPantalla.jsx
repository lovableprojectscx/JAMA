import { useState } from 'react';
import { publicarOferta } from '../api.js';

// Los errores de reglas de negocio llegan con un prefijo técnico ("RN-11: ...");
// se quita para mostrarle al dueño solo el mensaje en español.
function mensajeAmigable(mensaje) {
  return mensaje?.replace(/^RN-\d+:\s*/, '') ?? 'No pudimos publicar la oferta.';
}

function datosIniciales() {
  return {
    titulo: '',
    descripcion: '',
    fotoUrl: '',
    precioCarta: '',
    precioOferta: '',
    stock: '',
    horaElaboracion: '',
    horaLimite: '',
  };
}

export default function PublicarOfertaPantalla({ token }) {
  const [datos, setDatos] = useState(datosIniciales);
  const [tramos, setTramos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);

  function actualizarCampo(campo, valor) {
    setDatos((actuales) => ({ ...actuales, [campo]: valor }));
  }

  function agregarTramo() {
    setTramos((actuales) => [...actuales, { desde: '', descuentoPct: '' }]);
  }

  function actualizarTramo(indice, campo, valor) {
    setTramos((actuales) => actuales.map((t, i) => (i === indice ? { ...t, [campo]: valor } : t)));
  }

  function quitarTramo(indice) {
    setTramos((actuales) => actuales.filter((_, i) => i !== indice));
  }

  async function handleSubmit(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    setExito(false);

    try {
      await publicarOferta(token, {
        titulo: datos.titulo,
        descripcion: datos.descripcion,
        fotoUrl: datos.fotoUrl,
        precioCarta: Number(datos.precioCarta),
        precioOferta: Number(datos.precioOferta),
        stock: Number(datos.stock),
        horaElaboracion: new Date(datos.horaElaboracion).toISOString(),
        horaLimite: new Date(datos.horaLimite).toISOString(),
        tramosPrecio: tramos
          .filter((t) => t.desde)
          .map((t) => ({ desde: t.desde, descuentoPct: Number(t.descuentoPct) })),
      });

      setExito(true);
      setDatos(datosIniciales());
      setTramos([]);
    } catch (err) {
      setError(mensajeAmigable(err.message));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="panel-pantalla">
      <h1 className="panel-pantalla__titulo">Publicar oferta</h1>

      {exito && <p className="panel-aviso panel-aviso--exito">¡Publicada! Ya aparece en la vitrina.</p>}
      {error && <p className="panel-aviso panel-aviso--error">{error}</p>}

      <form className="panel-formulario" onSubmit={handleSubmit}>
        <label className="panel-campo">
          <span className="panel-campo__etiqueta">Título</span>
          <input
            className="panel-campo__input"
            required
            value={datos.titulo}
            onChange={(e) => actualizarCampo('titulo', e.target.value)}
          />
        </label>

        <label className="panel-campo">
          <span className="panel-campo__etiqueta">Descripción</span>
          <textarea
            className="panel-campo__input panel-campo__input--textarea"
            value={datos.descripcion}
            onChange={(e) => actualizarCampo('descripcion', e.target.value)}
          />
        </label>

        <label className="panel-campo">
          <span className="panel-campo__etiqueta">Foto (URL)</span>
          <input
            className="panel-campo__input"
            type="url"
            placeholder="https://..."
            value={datos.fotoUrl}
            onChange={(e) => actualizarCampo('fotoUrl', e.target.value)}
          />
        </label>

        <div className="panel-fila">
          <label className="panel-campo">
            <span className="panel-campo__etiqueta">Precio de carta (S/)</span>
            <input
              className="panel-campo__input"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              value={datos.precioCarta}
              onChange={(e) => actualizarCampo('precioCarta', e.target.value)}
            />
          </label>

          <label className="panel-campo">
            <span className="panel-campo__etiqueta">Precio de oferta (S/)</span>
            <input
              className="panel-campo__input"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              value={datos.precioOferta}
              onChange={(e) => actualizarCampo('precioOferta', e.target.value)}
            />
          </label>
        </div>

        <label className="panel-campo">
          <span className="panel-campo__etiqueta">Stock</span>
          <input
            className="panel-campo__input"
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            required
            value={datos.stock}
            onChange={(e) => actualizarCampo('stock', e.target.value)}
          />
        </label>

        <div className="panel-fila">
          <label className="panel-campo">
            <span className="panel-campo__etiqueta">Hora de elaboración</span>
            <input
              className="panel-campo__input"
              type="datetime-local"
              required
              value={datos.horaElaboracion}
              onChange={(e) => actualizarCampo('horaElaboracion', e.target.value)}
            />
          </label>

          <label className="panel-campo">
            <span className="panel-campo__etiqueta">Hora límite de recojo</span>
            <input
              className="panel-campo__input"
              type="datetime-local"
              required
              value={datos.horaLimite}
              onChange={(e) => actualizarCampo('horaLimite', e.target.value)}
            />
          </label>
        </div>

        <fieldset className="panel-tramos">
          <legend className="panel-campo__etiqueta">Precio que baja con la hora (opcional)</legend>

          {tramos.map((tramo, indice) => (
            <div className="panel-tramos__fila" key={indice}>
              <input
                className="panel-campo__input"
                type="time"
                aria-label="Desde qué hora"
                required
                value={tramo.desde}
                onChange={(e) => actualizarTramo(indice, 'desde', e.target.value)}
              />
              <input
                className="panel-campo__input"
                type="number"
                inputMode="numeric"
                min="1"
                max="99"
                aria-label="Porcentaje de descuento"
                placeholder="% desc."
                required
                value={tramo.descuentoPct}
                onChange={(e) => actualizarTramo(indice, 'descuentoPct', e.target.value)}
              />
              <button
                type="button"
                className="panel-boton panel-boton--quitar"
                onClick={() => quitarTramo(indice)}
                aria-label="Quitar este tramo"
              >
                ✕
              </button>
            </div>
          ))}

          <button type="button" className="panel-boton panel-boton--secundario" onClick={agregarTramo}>
            + Agregar tramo de precio
          </button>
        </fieldset>

        <button type="submit" className="panel-boton panel-boton--primario" disabled={enviando}>
          {enviando ? 'Publicando...' : 'Publicar oferta'}
        </button>
      </form>
    </div>
  );
}
