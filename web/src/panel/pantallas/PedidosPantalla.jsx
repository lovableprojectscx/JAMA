import { useEffect, useState } from 'react';
import { obtenerPedidosPorConfirmar, resolverPedido } from '../api.js';

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor);
}

export default function PedidosPantalla({ token }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [codigo, setCodigo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerPedidosPorConfirmar(token);
      setPedidos(datos);
    } catch {
      setError('No pudimos cargar los pedidos por confirmar.');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResolver(concretado) {
    const codigoLimpio = codigo.trim().toUpperCase();
    if (!codigoLimpio) {
      setMensaje({ tipo: 'error', texto: 'Escribe el código que te dio el cliente.' });
      return;
    }

    setProcesando(true);
    setMensaje(null);
    try {
      await resolverPedido(token, codigoLimpio, concretado);
      setMensaje({
        tipo: 'exito',
        texto: concretado ? `Código ${codigoLimpio} marcado como vendido.` : `Código ${codigoLimpio} marcado como no vino.`,
      });
      setCodigo('');
      cargar();
    } catch (err) {
      if (err.status === 404) {
        setMensaje({ tipo: 'error', texto: 'Ese código no existe o no es de este negocio.' });
      } else if (err.status === 409) {
        setMensaje({ tipo: 'error', texto: err.message });
      } else {
        setMensaje({ tipo: 'error', texto: 'No pudimos procesar el código. Intenta de nuevo.' });
      }
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="panel-pantalla">
      <h1 className="panel-pantalla__titulo">Pedidos por confirmar</h1>

      <div className="panel-codigo">
        <label className="panel-campo">
          <span className="panel-campo__etiqueta">Código del cliente</span>
          <input
            className="panel-campo__input panel-campo__input--codigo"
            autoCapitalize="characters"
            autoComplete="off"
            placeholder="Ej: K7P2"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
        </label>

        {mensaje && (
          <p className={`panel-aviso ${mensaje.tipo === 'error' ? 'panel-aviso--error' : 'panel-aviso--exito'}`}>
            {mensaje.texto}
          </p>
        )}

        <div className="panel-codigo__botones">
          <button
            type="button"
            className="panel-boton panel-boton--primario"
            disabled={procesando}
            onClick={() => handleResolver(true)}
          >
            Vendido
          </button>
          <button
            type="button"
            className="panel-boton panel-boton--peligro"
            disabled={procesando}
            onClick={() => handleResolver(false)}
          >
            No vino
          </button>
        </div>
      </div>

      <h2 className="panel-pantalla__subtitulo">En espera</h2>

      {cargando && <p className="panel-estado">Cargando...</p>}
      {!cargando && error && <p className="panel-estado panel-estado--error">{error}</p>}
      {!cargando && !error && pedidos.length === 0 && (
        <p className="panel-estado">No hay pedidos reservados en este momento.</p>
      )}

      <div className="panel-lista">
        {pedidos.map((pedido) => (
          <article key={pedido.codigo} className="panel-tarjeta">
            <div className="panel-tarjeta__cabecera">
              <h2 className="panel-tarjeta__titulo">{pedido.codigo}</h2>
              <span className="panel-chip panel-chip--reservado">{pedido.minutosRestantes} min</span>
            </div>
            <p className="panel-tarjeta__linea">{pedido.oferta.titulo}</p>
            <p className="panel-tarjeta__detalle">{formatearPrecio(pedido.precio)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
