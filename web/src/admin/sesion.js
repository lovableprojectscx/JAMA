const CLAVE_TOKEN = 'jama_admin_token';
const CLAVE_DATOS = 'jama_admin_datos';

export function guardarSesionAdmin({ token, admin }) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_DATOS, JSON.stringify(admin));
}

export function obtenerSesionAdmin() {
  const token = localStorage.getItem(CLAVE_TOKEN);
  const datos = localStorage.getItem(CLAVE_DATOS);
  if (!token || !datos) return null;
  try {
    return { token, admin: JSON.parse(datos) };
  } catch {
    return null;
  }
}

export function borrarSesionAdmin() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_DATOS);
}
