const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

async function solicitar(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const respuesta = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const error = new Error(cuerpo?.error ?? 'Ocurrió un error inesperado');
    error.status = respuesta.status;
    throw error;
  }

  return cuerpo;
}

export function iniciarSesion(email, password) {
  return solicitar('/auth/login', { method: 'POST', body: { email, password } });
}

export function obtenerMisOfertasDeHoy(token) {
  return solicitar('/negocios/me/ofertas?dia=hoy', { token });
}

export function cambiarEstadoOferta(token, id, estado) {
  return solicitar(`/negocios/me/ofertas/${id}`, { method: 'PATCH', token, body: { estado } });
}

export function publicarOferta(token, datos) {
  return solicitar('/negocios/me/ofertas', { method: 'POST', token, body: datos });
}

export function obtenerPedidosPorConfirmar(token) {
  return solicitar('/negocios/me/pedidos?estado=RESERVADO', { token });
}

export function resolverPedido(token, codigo, concretado) {
  return solicitar(`/pedidos/${codigo}`, { method: 'PATCH', token, body: { concretado } });
}
