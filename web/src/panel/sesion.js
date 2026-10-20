const CLAVE = 'jama_panel_sesion';

export function leerSesionGuardada() {
  try {
    const cruda = localStorage.getItem(CLAVE);
    return cruda ? JSON.parse(cruda) : null;
  } catch {
    return null;
  }
}

export function guardarSesion(sesion) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch {
    // Si el navegador bloquea localStorage, la sesión solo dura lo que dure la pestaña.
  }
}

export function borrarSesion() {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // nada que limpiar
  }
}
