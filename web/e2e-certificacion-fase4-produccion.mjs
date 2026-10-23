import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const PROD_BASE_URL = 'https://jama-iota.vercel.app';
const CAPTURAS_DIR = 'C:/Users/jacks/.gemini/antigravity/brain/85fdcc5e-6623-40c0-9951-6ba2654ecfdd/capturas';

if (!fs.existsSync(CAPTURAS_DIR)) {
  fs.mkdirSync(CAPTURAS_DIR, { recursive: true });
}

async function certificarFase4Produccion() {
  console.log('================================================================');
  console.log('CERTIFICACIÓN E2E EN PRODUCCIÓN · FASE 4 (JAMA VERCEL + SUPABASE)');
  console.log(`URL de Producción: ${PROD_BASE_URL}`);
  console.log('================================================================\n');

  const sufijo = Math.floor(Math.random() * 900000 + 100000);
  const nombreNegocio = `Panadería San Cristóbal ${sufijo}`;
  const emailNegocio = `san_cristobal_${sufijo}@jama.pe`;
  const whatsappNegocio = `9${Math.floor(Math.random() * 90000000 + 10000000)}`;
  const passwordNegocio = 'PasswordRealHuamanga123!';

  const browser = await chromium.launch({ channel: 'chrome' });

  // Contexto Móvil para el comerciante (390x844 - iPhone 14)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const pageMobile = await contextMobile.newPage();

  // Contexto Escritorio para el Administrador (1280x800)
  const contextAdmin = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5,
  });
  const pageAdmin = await contextAdmin.newPage();

  const resultados = [];

  // ========================================================
  // PASO 1: Envío de Solicitud de Registro en Producción
  // ========================================================
  console.log('[PASO 1] Navegando a /negocios/registro en producción y completando solicitud...');
  await pageMobile.goto(`${PROD_BASE_URL}/negocios/registro`, { waitUntil: 'networkidle' });

  await pageMobile.fill('input#reg-nombre', nombreNegocio);
  await pageMobile.fill('input#reg-responsable', 'Luciana Quispe Mendoza');
  await pageMobile.selectOption('select#reg-tipo', 'PANADERIA');
  await pageMobile.fill('input#reg-whatsapp', whatsappNegocio);
  await pageMobile.fill('input#reg-yape', whatsappNegocio);
  await pageMobile.fill('input#reg-direccion', 'Jr. Callao 240, Huamanga');
  await pageMobile.fill('input#reg-email', emailNegocio);
  await pageMobile.fill('input#reg-password', passwordNegocio);
  await pageMobile.check('input#reg-declaracion');

  // Enviar formulario
  await pageMobile.click('button[type="submit"]');

  // Esperar pantalla de confirmación
  await pageMobile.waitForSelector('.registro-exito', { timeout: 15000 });
  const textoExito = await pageMobile.locator('.registro-exito').innerText();

  const captura13 = path.join(CAPTURAS_DIR, '13-prod-solicitud-enviada.png');
  await pageMobile.screenshot({ path: captura13, fullPage: false });

  resultados.push({
    requisito: 'RF18 / RF19 / RC08 / RC09 (Solicitud en Producción)',
    criterio: 'Formulario se envía a API Vercel y se registra en Supabase en estado PENDIENTE',
    aprobado: textoExito.includes('¡Recibimos tu solicitud!'),
    detalle: `Solicitud confirmada en pantalla: "${textoExito.split('\n')[0]}"`,
    captura: '13-prod-solicitud-enviada.png',
  });

  // ========================================================
  // PASO 2: Intentar Login con la cuenta PENDIENTE en Producción
  // ========================================================
  console.log('\n[PASO 2] Intentando iniciar sesión con cuenta PENDIENTE en /panel...');
  await pageMobile.goto(`${PROD_BASE_URL}/panel`, { waitUntil: 'networkidle' });

  await pageMobile.fill('input[type="email"]', emailNegocio);
  await pageMobile.fill('input[type="password"]', passwordNegocio);
  await pageMobile.click('button[type="submit"]');

  await pageMobile.waitForSelector('.panel-aviso--pendiente', { timeout: 15000 });
  const textoAvisoPendiente = await pageMobile.locator('.panel-aviso--pendiente').innerText();

  const captura14 = path.join(CAPTURAS_DIR, '14-prod-login-bloqueado-pendiente.png');
  await pageMobile.screenshot({ path: captura14, fullPage: false });

  resultados.push({
    requisito: 'RF20 / RN-13 (Bloqueo de Cuenta No Activa en Producción)',
    criterio: 'Login responde 403 y la interfaz muestra que la solicitud está en revisión',
    aprobado: textoAvisoPendiente.includes('en revisión'),
    detalle: `Mensaje bloqueante: "${textoAvisoPendiente}"`,
    captura: '14-prod-login-bloqueado-pendiente.png',
  });

  // ========================================================
  // PASO 3: Aprobación Administrativa en Producción (/admin)
  // ========================================================
  console.log('\n[PASO 3] Ingresando a /admin en producción para aprobar solicitud...');
  await pageAdmin.goto(`${PROD_BASE_URL}/admin`, { waitUntil: 'networkidle' });

  // Login de Admin
  await pageAdmin.fill('input[type="email"]', 'admin@jama.pe');
  await pageAdmin.fill('input[type="password"]', 'admin1234');
  await pageAdmin.click('button[type="submit"]');

  await pageAdmin.waitForSelector('.admin-tarjeta-solicitud', { timeout: 15000 });

  // Ubicar la tarjeta del comercio registrado
  const tarjetaSolicitud = pageAdmin.locator('.admin-tarjeta-solicitud', { hasText: emailNegocio });
  await tarjetaSolicitud.waitFor({ state: 'visible', timeout: 10000 });

  // Aprobar solicitud
  await tarjetaSolicitud.locator('.admin-btn-aprobar').click();
  await tarjetaSolicitud.locator('.admin-btn-whatsapp').waitFor({ state: 'visible', timeout: 15000 });

  const linkWa = await tarjetaSolicitud.locator('.admin-btn-whatsapp').getAttribute('href');
  const badgeEstado = await tarjetaSolicitud.locator('.admin-badge-estado').innerText();

  const captura15 = path.join(CAPTURAS_DIR, '15-prod-admin-aprobacion-whatsapp.png');
  await pageAdmin.screenshot({ path: captura15, fullPage: false });

  resultados.push({
    requisito: 'RF15 / RF21 / RF22 / RN-14 (Aprobación y WhatsApp en Prod)',
    criterio: 'Admin aprueba comercio a ACTIVO y genera enlace wa.me prellenado con mensaje de bienvenida',
    aprobado: badgeEstado === 'ACTIVO' && linkWa.includes('wa.me'),
    detalle: `Estado: ${badgeEstado} | WhatsApp wa.me: ${linkWa.slice(0, 42)}...`,
    captura: '15-prod-admin-aprobacion-whatsapp.png',
  });

  // ========================================================
  // PASO 4: Login Exitoso del Negocio Aprobado en Producción
  // ========================================================
  console.log('\n[PASO 4] Iniciando sesión en /panel con el comercio recién aprobado...');
  await pageMobile.goto(`${PROD_BASE_URL}/panel`, { waitUntil: 'networkidle' });

  await pageMobile.fill('input[type="email"]', emailNegocio);
  await pageMobile.fill('input[type="password"]', passwordNegocio);
  await pageMobile.click('button[type="submit"]');

  await pageMobile.waitForSelector('.panel-cabecera__negocio', { timeout: 15000 });
  const cabeceraNegocio = await pageMobile.locator('.panel-cabecera__negocio').innerText();

  const captura16 = path.join(CAPTURAS_DIR, '16-prod-panel-login-exitoso.png');
  await pageMobile.screenshot({ path: captura16, fullPage: false });

  resultados.push({
    requisito: 'RF20 / RN-13 (Comercio Aprobado Puede Operar)',
    criterio: 'Comercio activo accede al panel y obtiene su sesión operativa con token JWT',
    aprobado: cabeceraNegocio.includes(nombreNegocio),
    detalle: `Cabecera del panel: "${cabeceraNegocio.replace(/\n/g, ' ')}"`,
    captura: '16-prod-panel-login-exitoso.png',
  });

  // ========================================================
  // PASO 5: Publicación Real de Oferta de Cierre en Producción
  // ========================================================
  console.log('\n[PASO 5] Publicando oferta de cierre en vivo desde el celular...');
  // Cambiar a pestaña "Publicar"
  await pageMobile.click('.panel-nav__boton:has-text("Publicar")');
  await pageMobile.waitForSelector('.panel-formulario', { timeout: 10000 });

  const tituloOferta = `Pan de trigo y chaboluco artesanal ${sufijo}`;
  const hoyPeru = new Date().toLocaleDateString('en-CA');
  const horaElaboracion = `${hoyPeru}T07:00`;
  const horaLimite = `${hoyPeru}T23:59`;

  await pageMobile.fill('label:has-text("Título") input', tituloOferta);
  await pageMobile.fill(
    'label:has-text("Descripción") textarea',
    'Pan tradicional ayacuchano recién horneado hoy, perfecto para el lonche familiar.'
  );
  await pageMobile.fill('label:has-text("Precio de carta") input', '16.00');
  await pageMobile.fill('label:has-text("Precio de oferta") input', '8.00');
  await pageMobile.fill('label:has-text("Stock") input', '5');
  await pageMobile.fill('label:has-text("Hora de elaboración") input', horaElaboracion);
  await pageMobile.fill('label:has-text("Hora límite de recojo") input', horaLimite);

  // Enviar publicación
  await pageMobile.click('button[type="submit"]:has-text("Publicar oferta")');

  // Esperar aviso de éxito
  await pageMobile.waitForSelector('.panel-aviso--exito', { timeout: 15000 });
  const textoAvisoExito = await pageMobile.locator('.panel-aviso--exito').innerText();

  const captura17 = path.join(CAPTURAS_DIR, '17-prod-oferta-publicada.png');
  await pageMobile.screenshot({ path: captura17, fullPage: false });

  resultados.push({
    requisito: 'RF08 / RN-01 / RN-03 (Publicación de Oferta en Prod)',
    criterio: 'Oferta se publica en Supabase con precios válidos, stock y hora límite futura',
    aprobado: textoAvisoExito.includes('¡Publicada! Ya aparece en la vitrina'),
    detalle: `Mensaje de éxito: "${textoAvisoExito}"`,
    captura: '17-prod-oferta-publicada.png',
  });

  // ========================================================
  // PASO 6: Verificación en la Vitrina Pública de Producción
  // ========================================================
  console.log('\n[PASO 6] Verificando aparición inmediata de la oferta en la vitrina pública...');
  await pageMobile.goto(`${PROD_BASE_URL}/`, { waitUntil: 'networkidle' });

  // Buscar la tarjeta con el título de la oferta
  const tarjetaOfertaVitrina = pageMobile.locator('.oferta-card', { hasText: tituloOferta });
  await tarjetaOfertaVitrina.waitFor({ state: 'visible', timeout: 15000 });
  await tarjetaOfertaVitrina.scrollIntoViewIfNeeded();

  const textoTarjeta = await tarjetaOfertaVitrina.innerText();
  const botonPedirVisible = await tarjetaOfertaVitrina.locator('.boton-pedir').count();

  const captura18 = path.join(CAPTURAS_DIR, '18-prod-vitrina-oferta-visible.png');
  await pageMobile.screenshot({ path: captura18, fullPage: false });

  resultados.push({
    requisito: 'RF01 / RF03 / RF04 / RC01 (Vitrina Pública en Vivo)',
    criterio: 'La oferta recién publicada aparece disponible para clientes con stock y botón de pedido',
    aprobado: textoTarjeta.includes(tituloOferta) && textoTarjeta.includes('8.00') && botonPedirVisible > 0,
    detalle: `Oferta visible en vitrina. Título: "${tituloOferta}", Precio: S/ 8.00, Botón Pedir: ${botonPedirVisible > 0}`,
    captura: '18-prod-vitrina-oferta-visible.png',
  });

  await browser.close();

  console.log('\n======================================================');
  console.log('RESULTADOS DE CERTIFICACIÓN E2E EN PRODUCCIÓN (FASE 4):');
  console.log('======================================================');
  console.table(
    resultados.map((r) => ({
      Requisito: r.requisito,
      Aprobado: r.aprobado ? '✅ SÍ' : '❌ NO',
      Detalle: r.detalle,
      Captura: r.captura,
    }))
  );

  return resultados;
}

certificarFase4Produccion().catch((e) => {
  console.error('Fallo en la certificación de producción:', e);
  process.exit(1);
});
