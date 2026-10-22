import express from 'express';

/**
 * Levanta una app Express mínima en un puerto libre para probar rutas reales
 * por HTTP (middlewares, códigos de estado y cuerpo de la respuesta).
 * `montar(app)` registra las rutas. Devuelve la URL base y `cerrar()`.
 */
export async function levantarServidor(montar) {
  const app = express();
  app.use(express.json());
  montar(app);

  const servidor = await new Promise((resolver) => {
    const s = app.listen(0, '127.0.0.1', () => resolver(s));
  });
  const { port } = servidor.address();

  return {
    url: `http://127.0.0.1:${port}`,
    cerrar: () => new Promise((resolver) => servidor.close(resolver)),
  };
}

export async function enviarJson(url, metodo, cuerpo, encabezados = {}) {
  const respuesta = await fetch(url, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...encabezados },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  const texto = await respuesta.text();
  return { status: respuesta.status, body: texto ? JSON.parse(texto) : null };
}
