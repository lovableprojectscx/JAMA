const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export async function obtenerOfertasDeHoy() {
  const respuesta = await fetch(`${API_URL}/ofertas`);
  if (!respuesta.ok) {
    throw new Error('No se pudieron cargar las ofertas');
  }
  return respuesta.json();
}

export async function pedirOferta(ofertaId) {
  const respuesta = await fetch(`${API_URL}/ofertas/${ofertaId}/pedidos`, { method: 'POST' });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'No se pudo generar el pedido');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}

export async function registrarSolicitud(datos) {
  const respuesta = await fetch(`${API_URL}/negocios/solicitudes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'No se pudo registrar la solicitud');
    error.status = respuesta.status;
    error.campo = cuerpo.campo;
    throw error;
  }
  return cuerpo;
}
