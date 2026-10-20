export function crearRequireAuth(apiAcceso) {
  return function requireAuth(req, res, next) {
    const encabezado = req.headers.authorization ?? '';
    const [esquema, token] = encabezado.split(' ');

    if (esquema !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Token no provisto' });
    }

    try {
      const payload = apiAcceso.verificarToken(token);
      req.usuario = payload;
      return next();
    } catch {
      return res.status(401).json({ error: 'Token inválido o vencido' });
    }
  };
}
