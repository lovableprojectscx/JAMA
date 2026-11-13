import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrast(rgb1, rgb2) {
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function parseRgb(str) {
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
}

async function runAudit() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const capturasDir = path.resolve('..', 'capturas');
  if (!fs.existsSync(capturasDir)) {
    fs.mkdirSync(capturasDir, { recursive: true });
  }

  const results = {
    mobile: {},
    desktop: {},
    contrastRatios: {},
    touchTargets: [],
    thumbZone: {},
  };

  // 1. Mobile Viewport (390x844 - iPhone 14/15 standard)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await mobileContext.newPage();

  console.log('Navegando a la tienda pública (móvil)...');
  await page.goto('http://localhost:5173/t/panaderia-ejemplo', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const mobileScreenshotPath = path.join(capturasDir, '24-perfil-tienda-movil-390.png');
  await page.screenshot({ path: mobileScreenshotPath, fullPage: true });
  console.log(`Captura móvil guardada en: ${mobileScreenshotPath}`);

  // Evaluar elementos interactivos y touch targets
  const interactiveTargets = await page.evaluate(() => {
    const targets = [];
    const selectors = [
      { name: 'Botón Atrás (← Ofertas)', selector: '.tienda-btn-atras' },
      { name: 'Botón Compartir', selector: '.tienda-btn-compartir' },
      { name: 'Enlace Google Maps', selector: '.tienda-link-maps' },
      { name: 'Botón WhatsApp Principal', selector: '.tienda-btn-whatsapp' },
      { name: 'Botón WhatsApp Estado Vacío', selector: '.tienda-vacio-btn-wa' },
      { name: 'Botón Ver Otras Ofertas', selector: '.tienda-vacio-btn-todas' },
    ];

    for (const item of selectors) {
      const el = document.querySelector(item.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        targets.push({
          name: item.name,
          selector: item.selector,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          top: Math.round(rect.top),
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          borderRadius: style.borderRadius,
        });
      }
    }
    return targets;
  });

  results.touchTargets = interactiveTargets;

  // Evaluar colores y contraste
  const colorElements = await page.evaluate(() => {
    function getColors(sel) {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      let bg = s.backgroundColor;
      let curr = el.parentElement;
      while ((bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent') && curr) {
        bg = window.getComputedStyle(curr).backgroundColor;
        curr = curr.parentElement;
      }
      return { text: s.color, bg, fontSize: s.fontSize, fontWeight: s.fontWeight };
    }

    return {
      nombreTienda: getColors('.tienda-nombre'),
      descripcionTienda: getColors('.tienda-descripcion'),
      badgeRubro: getColors('.tienda-badge--rubro'),
      badgeVerificado: getColors('.tienda-badge--verificado'),
      badgeZona: getColors('.tienda-badge--zona'),
      labelContacto: getColors('.tienda-contacto-label'),
      valorContacto: getColors('.tienda-contacto-valor'),
      botonWhatsapp: getColors('.tienda-btn-whatsapp'),
      tituloVacio: getColors('.tienda-vacio-titulo'),
      descVacio: getColors('.tienda-vacio-desc'),
      botonAtras: getColors('.tienda-btn-atras'),
    };
  });

  for (const [key, val] of Object.entries(colorElements)) {
    if (val && val.text && val.bg) {
      const rgbText = parseRgb(val.text);
      const rgbBg = parseRgb(val.bg);
      const ratio = contrast(rgbText, rgbBg);
      results.contrastRatios[key] = {
        ratio: parseFloat(ratio.toFixed(2)),
        textColor: val.text,
        bgColor: val.bg,
        fontSize: val.fontSize,
        fontWeight: val.fontWeight,
        wcagAA: ratio >= 4.5,
        wcagAAA: ratio >= 7.0,
      };
    }
  }

  // Thumb zone metric (distancia desde el borde superior de la pantalla de 844px)
  const thumbMetrics = await page.evaluate(() => {
    const waBtn = document.querySelector('.tienda-btn-whatsapp');
    if (!waBtn) return null;
    const rect = waBtn.getBoundingClientRect();
    return {
      whatsappTop: Math.round(rect.top),
      whatsappHeight: Math.round(rect.height),
      viewportHeight: window.innerHeight,
      inNaturalThumbZone: rect.top <= 650 && rect.top >= 300,
    };
  });
  results.thumbZone = thumbMetrics;

  // 2. Desktop Viewport (1280x800)
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5,
  });
  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:5173/t/panaderia-ejemplo', { waitUntil: 'networkidle' });
  await desktopPage.waitForTimeout(1000);

  const desktopScreenshotPath = path.join(capturasDir, '25-perfil-tienda-desktop-1280.png');
  await desktopPage.screenshot({ path: desktopScreenshotPath, fullPage: true });
  console.log(`Captura desktop guardada en: ${desktopScreenshotPath}`);

  // 3. Panel de Comerciante - Pestaña Mi Perfil (Móvil y Desktop)
  console.log('Iniciando sesión en panel para capturar Mi Perfil...');
  await page.goto('http://localhost:5173/panel', { waitUntil: 'networkidle' });
  const emailInput = await page.$('input[type="email"]');
  if (emailInput) {
    await page.fill('input[type="email"]', 'panaderia@jama.pe');
    await page.fill('input[type="password"]', 'demo1234');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  }

  const tabPerfil = await page.locator('button:has-text("Mi Perfil")');
  if (await tabPerfil.count() > 0) {
    await tabPerfil.click();
    await page.waitForTimeout(1000);
    const panelMobileScreenshot = path.join(capturasDir, '26-panel-mi-perfil-movil-390.png');
    await page.screenshot({ path: panelMobileScreenshot, fullPage: true });
    console.log(`Captura panel móvil guardada en: ${panelMobileScreenshot}`);
  }

  await desktopPage.goto('http://localhost:5173/panel', { waitUntil: 'networkidle' });
  const desktopEmailInput = await desktopPage.$('input[type="email"]');
  if (desktopEmailInput) {
    await desktopPage.fill('input[type="email"]', 'panaderia@jama.pe');
    await desktopPage.fill('input[type="password"]', 'demo1234');
    await desktopPage.click('button[type="submit"]');
    await desktopPage.waitForTimeout(1000);
  }
  const desktopTabPerfil = await desktopPage.locator('button:has-text("Mi Perfil")');
  if (await desktopTabPerfil.count() > 0) {
    await desktopTabPerfil.click();
    await desktopPage.waitForTimeout(1000);
    const panelDesktopScreenshot = path.join(capturasDir, '27-panel-mi-perfil-desktop-1280.png');
    await desktopPage.screenshot({ path: panelDesktopScreenshot, fullPage: true });
    console.log(`Captura panel desktop guardada en: ${panelDesktopScreenshot}`);
  }

  await browser.close();

  console.log('\n--- RESULTADOS DE LA AUDITORÍA UX/UI ---');
  console.log(JSON.stringify(results, null, 2));

  fs.writeFileSync(
    path.resolve(capturasDir, 'metricas-ux-ui.json'),
    JSON.stringify(results, null, 2),
    'utf-8'
  );
}

runAudit().catch(err => {
  console.error('Error en auditoría:', err);
  process.exit(1);
});
