import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = (process.env.JAMA_BASE_URL || 'https://jama-web.vercel.app').replace(/\/$/, '');

function extraerAssetsHtml(html, baseUrl) {
  const urls = [];
  const regexScript = /<script[^>]+src=["']([^"']+)["']/gi;
  const regexLink = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi;

  let match;
  while ((match = regexScript.exec(html)) !== null) {
    urls.push({ tipo: 'script', url: new URL(match[1], baseUrl).toString() });
  }
  while ((match = regexLink.exec(html)) !== null) {
    urls.push({ tipo: 'stylesheet', url: new URL(match[1], baseUrl).toString() });
  }
  return urls;
}

test('QA-01: /api/docs/ responde 200 HTML y todos sus assets JS/CSS cargan sin devolver HTML (anti-regresión Unexpected token <)', async () => {
  const urlDocs = `${BASE_URL}/api/docs/`;
  const res = await fetch(urlDocs);
  assert.strictEqual(res.status, 200, `Se esperaba 200 en ${urlDocs}`);

  const contentType = res.headers.get('content-type') || '';
  assert.ok(contentType.includes('text/html'), `Content-Type inesperado en ${urlDocs}: ${contentType}`);

  const html = await res.text();
  assert.ok(html.includes('SwaggerUIBundle'), 'El HTML debe inicializar SwaggerUIBundle');

  const assets = extraerAssetsHtml(html, urlDocs);
  assert.ok(assets.length >= 3, 'Debe incluir al menos CSS, swagger-ui-bundle y swagger-ui-standalone-preset');

  for (const asset of assets) {
    const assetRes = await fetch(asset.url);
    assert.strictEqual(assetRes.status, 200, `Asset caído (${assetRes.status}): ${asset.url}`);

    const assetType = (assetRes.headers.get('content-type') || '').toLowerCase();
    assert.ok(
      !assetType.includes('text/html'),
      `Regresión detectada: ${asset.url} devolvió text/html en lugar de ${asset.tipo}`
    );

    if (asset.tipo === 'script') {
      assert.ok(
        assetType.includes('javascript') || assetType.includes('ecmascript'),
        `MIME inválido para script ${asset.url}: ${assetType}`
      );
      const bodyStart = (await assetRes.text()).trimStart().slice(0, 20);
      assert.ok(!bodyStart.startsWith('<'), `El script ${asset.url} empieza con '<' (posible HTML de error)`);
    } else if (asset.tipo === 'stylesheet') {
      assert.ok(assetType.includes('text/css'), `MIME inválido para CSS ${asset.url}: ${assetType}`);
    }
  }
});

test('QA-02: /api/v1/docs y /api/v1/docs.json responden correctamente con el esquema OpenAPI 3.0.3', async () => {
  const resHtml = await fetch(`${BASE_URL}/api/v1/docs`);
  assert.strictEqual(resHtml.status, 200);
  assert.ok((resHtml.headers.get('content-type') || '').includes('text/html'));

  const resJson = await fetch(`${BASE_URL}/api/v1/docs.json`);
  assert.strictEqual(resJson.status, 200);
  assert.ok((resJson.headers.get('content-type') || '').includes('application/json'));

  const spec = await resJson.json();
  assert.strictEqual(spec.openapi, '3.0.3');
  assert.ok(Object.keys(spec.paths || {}).length >= 10, 'El esquema OpenAPI debe documentar los endpoints de la API');
});

test('QA-03: Vitrina frontend (/) y endpoint público de ofertas (/api/v1/ofertas) operativos en producción', async () => {
  const resWeb = await fetch(`${BASE_URL}/`);
  assert.strictEqual(resWeb.status, 200);
  assert.ok((resWeb.headers.get('content-type') || '').includes('text/html'));

  const resOfertas = await fetch(`${BASE_URL}/api/v1/ofertas`);
  assert.strictEqual(resOfertas.status, 200);
  assert.ok((resOfertas.headers.get('content-type') || '').includes('application/json'));
  const ofertas = await resOfertas.json();
  assert.ok(Array.isArray(ofertas), '/api/v1/ofertas debe devolver un arreglo JSON');
});
