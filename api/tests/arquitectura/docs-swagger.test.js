import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Router } from 'express';
import { levantarServidor } from '../soporte/servidor-http.js';
import { crearApp } from '../../src/api/app.js';

let servidor;

before(async () => {
  const routerVacio = Router();
  const moduloVacio = {
    router: routerVacio,
    routerPublico: routerVacio,
    routerNegocio: routerVacio,
  };

  const app = crearApp({
    apiAcceso: moduloVacio,
    apiNegocios: moduloVacio,
    routerAdminNegocios: routerVacio,
    routerMeNegocios: routerVacio,
    apiOfertas: moduloVacio,
    pedidosModule: {
      routerPublico: routerVacio,
      routerNegocio: routerVacio,
      routerMeNegocio: routerVacio,
      routerAdminPedidos: routerVacio,
      routerMetricas: routerVacio,
    },
    expirarReservas: { ejecutar: async () => ({ expirados: 0 }) },
  });

  servidor = await levantarServidor((appServidor) => {
    appServidor.use(app);
  });
});

after(async () => {
  await servidor.cerrar();
});

test('Swagger UI responde 200 HTML con SwaggerUIBundle y CDN en /api/docs y /api/docs/', async () => {
  for (const ruta of ['/api/docs', '/api/docs/']) {
    const res = await fetch(`${servidor.url}${ruta}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/html'));
    const html = await res.text();
    assert.ok(html.includes('SwaggerUIBundle'), 'debe contener el inicializador SwaggerUIBundle');
    assert.ok(html.includes('cdnjs.cloudflare.com/ajax/libs/swagger-ui'), 'debe cargar los scripts desde CDN');
    assert.ok(html.includes('JAMA'), 'debe tener la especificación embebida');
  }
});

test('Swagger UI responde 200 HTML en /api/v1/docs y /api/v1/docs/', async () => {
  for (const ruta of ['/api/v1/docs', '/api/v1/docs/']) {
    const res = await fetch(`${servidor.url}${ruta}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/html'));
    const html = await res.text();
    assert.ok(html.includes('SwaggerUIBundle'));
  }
});

test('Documentación OpenAPI responde 200 JSON en /api/v1/docs.json y /api/docs.json', async () => {
  for (const ruta of ['/api/v1/docs.json', '/api/docs.json']) {
    const res = await fetch(`${servidor.url}${ruta}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('application/json'));
    const doc = await res.json();
    assert.strictEqual(doc.openapi, '3.0.3');
    assert.strictEqual(doc.info.title, 'JAMA API · Marketplace de Ofertas de Cierre');
  }
});
