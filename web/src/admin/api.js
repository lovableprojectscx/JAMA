const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export async function iniciarSesionAdmin(email, password) {
  const respuesta = await fetch(`${API_URL}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'Credenciales inválidas');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}

export async function listarSolicitudesAdmin(token, estado = 'PENDIENTE') {
  const query = estado ? `?estado=${estado}` : '';
  const respuesta = await fetch(`${API_URL}/admin/negocios${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'Error al listar solicitudes');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}

export async function resolverSolicitudAdmin(token, negocioId, { accion, motivo }) {
  const respuesta = await fetch(`${API_URL}/admin/negocios/${negocioId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ accion, motivo }),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'Error al resolver la solicitud');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}

export async function listarPedidosAdmin(token, estado = null) {
  const query = estado ? `?estado=${estado}` : '';
  const respuesta = await fetch(`${API_URL}/admin/pedidos${query}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'Error al listar pedidos');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}

export async function resolverPedidoAdmin(token, codigo, concretado = true) {
  const respuesta = await fetch(`${API_URL}/admin/pedidos/${codigo}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ concretado }),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'Error al resolver el pedido');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}

export async function publicarOfertaAdmin(token, negocioId, datosOferta) {
  const respuesta = await fetch(`${API_URL}/admin/negocios/${negocioId}/ofertas`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datosOferta),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'Error al publicar la oferta');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}

export async function subirFotoOfertaAdmin(token, negocioId, archivo) {
  const formData = new FormData();
  formData.append('foto', archivo);

  const respuesta = await fetch(`${API_URL}/admin/negocios/${negocioId}/ofertas/fotos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    const error = new Error(cuerpo.error ?? 'Error al subir la foto');
    error.status = respuesta.status;
    throw error;
  }
  return cuerpo;
}
