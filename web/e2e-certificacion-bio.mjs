import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const PORT = 4179;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const GRUPO_WA = 'https://chat.whatsapp.com/Hq7bCa59tbT3zmt8rrvSaC';
const FACEBOOK = 'https://www.facebook.com/jamaofertas';
const TIKTOK = 'https://www.tiktok.com/@jama.app';

function esperarServidor(url, intentos = 30) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const probar = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) return resolve();
      } catch {
        // aún iniciando
      }
      n += 1;
      if (n >= intentos) return reject(new Error(`Servidor no respondió en ${url}`));
      setTimeout(probar, 300);
    };
    probar();
  });
}

async function ejecutar() {
  const servidor = spawn('npx.cmd', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(),
    stdio: 'pipe',
    shell: true,
  });

  let browser;
  try {
    await esperarServidor(BASE_URL);
    browser = await chromium.launch({ channel: 'chrome' });

    const viewports = [
      { nombre: 'movil-390x844', width: 390, height: 844 },
      { nombre: 'escritorio-1280x800', width: 1280, height: 800 },
    ];

    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();
      const erroresConsola = [];
      page.on('pageerror', (err) => erroresConsola.push(err.message));

      // Simular API sin ofertas publicadas para probar siempre la grilla de 6 ejemplos ilustrativos
      await page.route('**/ofertas*', (route) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
      );

      // 1. Verificar portada (/) y sección ComunidadWhatsapp
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      const overflowHome = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      assert.ok(overflowHome <= 0, `Desborde horizontal en / (${vp.nombre}): ${overflowHome}px`);

      const waHome = page.locator(`.comunidad-wa a[href="${GRUPO_WA}"]`);
      await waHome.waitFor({ state: 'visible', timeout: 5000 });
      const fbHome = page.locator(`.comunidad-wa a[href="${FACEBOOK}"]`);
      await fbHome.waitFor({ state: 'visible', timeout: 5000 });
      const ttHome = page.locator(`.comunidad-wa a[href="${TIKTOK}"]`);
      await ttHome.waitFor({ state: 'visible', timeout: 5000 });

      // 1b. Verificar obligatoriamente los 6 ejemplos ilustrativos con recorte absoluto y fotos distintas
      const cantidadEjemplos = await page.locator('.ejemplo-card').count();
      assert.equal(cantidadEjemplos, 6, `Se esperaban 6 ejemplos variados, hubo ${cantidadEjemplos}`);
      const recortes = await page.locator('.ejemplo-card__foto').evaluateAll((imgs) =>
        imgs.map((el) => {
          const st = getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const naturalRatio = el.naturalWidth / el.naturalHeight;
          const renderedRatio = rect.width / rect.height;
          return {
            position: st.position,
            left: st.left,
            top: st.top,
            distorsion: Math.abs(renderedRatio / naturalRatio - 1),
          };
        })
      );
      for (const r of recortes) {
        assert.equal(r.position, 'absolute', `ejemplo-card__foto debe ser position:absolute (fue ${r.position})`);
        assert.ok(r.distorsion < 0.02, `Foto de ejemplo estirada (distorsión ${(r.distorsion * 100).toFixed(1)}%)`);
      }
      const clavesUnicas = new Set(recortes.map((r) => `${r.left}|${r.top}`));
      assert.equal(clavesUnicas.size, 6, `Todas las fotos de ejemplo deben ser distintas (únicas: ${clavesUnicas.size})`);
      const badges = await page.locator('.ejemplo-card .oferta-card__descuento-pill').count();
      assert.equal(badges, 6, `Cada tarjeta de ejemplo debe mostrar su badge de descuento (hubo ${badges})`);
      if (vp.nombre === 'movil-390x844' && process.env.CAPTURE_EJEMPLOS_SHOT) {
        await page.locator('.ejemplo-card').nth(4).screenshot({ path: process.env.CAPTURE_EJEMPLOS_SHOT });
      }

      // 2. Verificar rutas Link-in-Bio (/bio, /hola, /links)
      for (const ruta of ['/bio', '/hola', '/links']) {
        await page.goto(`${BASE_URL}${ruta}`, { waitUntil: 'networkidle' });
        const overflowBio = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        assert.ok(overflowBio <= 0, `Desborde horizontal en ${ruta} (${vp.nombre}): ${overflowBio}px`);

        const titulo = await page.title();
        assert.match(titulo, /JAMA/, `Título inválido en ${ruta}: ${titulo}`);

        await page.locator(`a[href="${GRUPO_WA}"]`).waitFor({ state: 'visible', timeout: 5000 });
        await page.locator(`a[href="${FACEBOOK}"]`).waitFor({ state: 'visible', timeout: 5000 });
        await page.locator(`a[href="${TIKTOK}"]`).waitFor({ state: 'visible', timeout: 5000 });
        await page.locator('a[href="/"]').first().waitFor({ state: 'visible', timeout: 5000 });
        await page.locator('a[href="/negocios"]').waitFor({ state: 'visible', timeout: 5000 });

        if (ruta === '/bio' && vp.nombre === 'movil-390x844' && process.env.CAPTURE_BIO_SHOT) {
          await page.screenshot({ path: process.env.CAPTURE_BIO_SHOT, fullPage: true });
        }
      }

      assert.equal(erroresConsola.length, 0, `Errores de página en ${vp.nombre}: ${erroresConsola.join('; ')}`);
      console.log(`✔ Certificación E2E aprobada en ${vp.nombre} (0px desborde, 0 errores, /, /bio, /hola, /links)`);
      await context.close();
    }

    console.log('\n✅ CERTIFICACIÓN E2E BIO + COMUNIDAD WHATSAPP: 100% APROBADA');
  } finally {
    if (browser) await browser.close();
    servidor.kill();
  }
  process.exit(0);
}

ejecutar().catch((err) => {
  console.error('❌ Falló la certificación E2E:', err);
  process.exit(1);
});
