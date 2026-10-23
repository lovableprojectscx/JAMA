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

export function crearRequireRol(rolEsperado) {
  return function requireRol(req, res, next) {
    if (!req.usuario || req.usuario.rol !== rolEsperado) {
      return res.status(403).json({ error: `Acceso denegado: se requiere rol ${rolEsperado}` });
    }
    return next();
  };
}

export function componerMiddlewares(...middlewares) {
  return function (req, res, next) {
    let index = 0;
    function run(err) {
      if (err) return next(err);
      if (index >= middlewares.length) return next();
      const mw = middlewares[index++];
      return mw(req, res, run);
    }
    return run();
  };
}
