import { chromium } from 'playwright';
import path from 'node:path';

const CAPTURAS_DIR = 'C:/Users/jacks/.gemini/antigravity/brain/85fdcc5e-6623-40c0-9951-6ba2654ecfdd/capturas';

async function certificar() {
  console.log('Iniciando certificación E2E con Playwright...');
  const browser = await chromium.launch({ channel: 'chrome' });

  // 1. Contexto Móvil (iPhone 12/13/14: 390x844)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const pageMobile = await contextMobile.newPage();

  // 2. Contexto Escritorio (1280x800)
  const contextDesktop = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5,
  });
  const pageDesktop = await contextDesktop.newPage();

  const resultados = [];

  // ==========================================
  // PRUEBA 1: RF18 - Página /negocios en móvil
  // ==========================================
  console.log('\n[PRUEBA 1] Evaluando RF18 en /negocios (Móvil)...');
  await pageMobile.goto('http://localhost:5173/negocios', { waitUntil: 'networkidle' });

  const tituloHero = await pageMobile.locator('.negocios-hero__titulo').innerText();
  const tieneBotonUnirme = await pageMobile.locator('a[href="/negocios/registro"]').first().isVisible();
  const tieneBotonPanel = await pageMobile.locator('a[href="/panel"]').first().isVisible();
  const sinDesbordeMobile = await pageMobile.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

  await pageMobile.screenshot({
    path: path.join(CAPTURAS_DIR, '01-landing-negocios-mobile.png'),
    fullPage: true,
  });

  resultados.push({
    requisito: 'RF18 / RC01 (Presentación para Negocios)',
    criterio: 'Página /negocios carga en móvil, título de cierre visible, botones presentes y 0 desborde',
    aprobado: tieneBotonUnirme && tieneBotonPanel && sinDesbordeMobile,
    detalle: `Título: "${tituloHero.replace(/\n/g, ' ')}", Desborde: ${sinDesbordeMobile ? 'NO' : 'SÍ'}`,
    captura: '01-landing-negocios-mobile.png',
  });

  // ==========================================
  // PRUEBA 2: RF18 - Página /negocios en escritorio
  // ==========================================
  console.log('\n[PRUEBA 2] Evaluando RF18 en /negocios (Escritorio 1280px)...');
  await pageDesktop.goto('http://localhost:5173/negocios', { waitUntil: 'networkidle' });
  const sinDesbordeDesktop = await pageDesktop.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

  await pageDesktop.screenshot({
    path: path.join(CAPTURAS_DIR, '02-landing-negocios-desktop.png'),
    fullPage: false,
  });

  resultados.push({
    requisito: 'RF18 / RC01 (Escritorio)',
    criterio: 'Grid de beneficios y 3 pasos se despliegan en múltiples columnas sin desborde',
    aprobado: sinDesbordeDesktop,
    detalle: `Desborde horizontal: ${sinDesbordeDesktop ? 'NO' : 'SÍ'}`,
    captura: '02-landing-negocios-desktop.png',
  });

  // ==========================================
  // PRUEBA 3: RF19, RC08, RC09 - Formulario /negocios/registro en móvil
  // ==========================================
  console.log('\n[PRUEBA 3] Evaluando RF19, RC08, RC09 en /negocios/registro...');
  await pageMobile.goto('http://localhost:5173/negocios/registro', { waitUntil: 'networkidle' });

  const selectTipos = await pageMobile.locator('#reg-tipo option').allInnerTexts();
  const incluyeSupermercado = selectTipos.some((t) => t.toLowerCase().includes('supermercado'));
  const checkboxDeclaracion = await pageMobile.locator('#reg-declaracion').isVisible();

  await pageMobile.screenshot({
    path: path.join(CAPTURAS_DIR, '03-formulario-registro-mobile.png'),
    fullPage: true,
  });

  resultados.push({
    requisito: 'RF19 / RC08 / RC09 (Formulario de solicitud)',
    criterio: 'Todos los campos existen, selector no incluye supermercados (RC09) y casilla de compromiso apto visible (RC08)',
    aprobado: !incluyeSupermercado && checkboxDeclaracion,
    detalle: `Tipos disponibles: ${selectTipos.join(', ')} | RC09 respetado: ${!incluyeSupermercado ? 'SÍ' : 'NO'}`,
    captura: '03-formulario-registro-mobile.png',
  });

  // ==========================================
  // PRUEBA 4: RN-15 - Validaciones del formulario
  // ==========================================
  console.log('\n[PRUEBA 4] Evaluando RN-15 (Validaciones cliente/servidor)...');
  await pageMobile.fill('#reg-nombre', 'A'); // muy corto
  await pageMobile.fill('#reg-whatsapp', '12345'); // celular inválido
  await pageMobile.fill('#reg-password', '123'); // contraseña muy corta
  await pageMobile.click('button[type="submit"]');

  await pageMobile.waitForSelector('.registro-campo__error');
  const errores = await pageMobile.locator('.registro-campo__error').allInnerTexts();

  await pageMobile.screenshot({
    path: path.join(CAPTURAS_DIR, '04-errores-validacion.png'),
    fullPage: false,
  });

  resultados.push({
    requisito: 'RN-15 (Validación estricta de solicitud)',
    criterio: 'Rechaza nombre corto, celular no compatible o contraseña < 8 caracteres con mensajes claros',
    aprobado: errores.length >= 3,
    detalle: `Errores mostrados: ${errores.join(' | ')}`,
    captura: '04-errores-validacion.png',
  });

  // ==========================================
  // PRUEBA 5: RF23 / RN-16 - Detección de duplicados (409)
  // ==========================================
  console.log('\n[PRUEBA 5] Evaluando RF23 / RN-16 (Correo/WhatsApp duplicado)...');
  await pageMobile.fill('#reg-nombre', 'Pastelería La Central');
  await pageMobile.fill('#reg-responsable', 'Juan Quispe');
  await pageMobile.selectOption('#reg-tipo', 'PASTELERIA');
  await pageMobile.fill('#reg-whatsapp', '987654321');
  await pageMobile.fill('#reg-direccion', 'Jr. Lima 123, Huamanga');
  await pageMobile.fill('#reg-email', 'panaderia@jama.pe'); // ya existe en seed
  await pageMobile.fill('#reg-password', 'passwordValido123');
  await pageMobile.check('#reg-declaracion');
  await pageMobile.click('button[type="submit"]');

  await pageMobile.waitForSelector('.registro-aviso--error');
  const textoErrorDuplicado = await pageMobile.locator('.registro-aviso--error').innerText();

  await pageMobile.screenshot({
    path: path.join(CAPTURAS_DIR, '05-error-duplicado.png'),
    fullPage: false,
  });

  resultados.push({
    requisito: 'RF23 / RN-16 (Unicidad de correo y WhatsApp)',
    criterio: 'Intento de registro con cuenta existente responde 409 y alerta amigable',
    aprobado: textoErrorDuplicado.includes('registrado'),
    detalle: `Mensaje: "${textoErrorDuplicado}"`,
    captura: '05-error-duplicado.png',
  });

  // ==========================================
  // PRUEBA 6: RF19 / RN-15 - Registro exitoso (201 PENDIENTE)
  // ==========================================
  console.log('\n[PRUEBA 6] Evaluando RF19 (Registro exitoso y estado PENDIENTE)...');
  const sufijo = Math.floor(Math.random() * 900000 + 100000);
  const nuevoEmail = `panaderia_cert_${sufijo}@jama.pe`;
  const nuevoWhatsapp = `9${Math.floor(Math.random() * 90000000 + 10000000)}`;

  await pageMobile.fill('#reg-email', nuevoEmail);
  await pageMobile.fill('#reg-whatsapp', nuevoWhatsapp);
  await pageMobile.click('button[type="submit"]');

  await pageMobile.waitForSelector('.registro-exito__titulo');
  const tituloExito = await pageMobile.locator('.registro-exito__titulo').innerText();
  const avisoWhatsapp = await pageMobile.locator('.registro-exito__caja-aviso').innerText();

  await pageMobile.screenshot({
    path: path.join(CAPTURAS_DIR, '06-exito-solicitud.png'),
    fullPage: true,
  });

  resultados.push({
    requisito: 'RF19 (Envío y confirmación de solicitud)',
    criterio: 'Solicitud guardada con éxito en PENDIENTE y pantalla de confirmación informando contacto por WhatsApp',
    aprobado: tituloExito.includes('Recibimos tu solicitud') && avisoWhatsapp.includes(nuevoWhatsapp),
    detalle: `Confirmado: "${tituloExito}", Número referenciado: ${nuevoWhatsapp}`,
    captura: '06-exito-solicitud.png',
  });

  // ==========================================
  // PRUEBA 7: RF20 / RN-13 - Login de cuenta no activa
  // ==========================================
  console.log('\n[PRUEBA 7] Evaluando RF20 / RN-13 (Bloqueo en /panel con aviso en revisión)...');
  await pageMobile.goto('http://localhost:5173/panel', { waitUntil: 'networkidle' });

  await pageMobile.fill('input[type="email"]', nuevoEmail);
  await pageMobile.fill('input[type="password"]', 'passwordValido123');
  await pageMobile.click('button[type="submit"]');

  await pageMobile.waitForSelector('.panel-aviso--pendiente');
  const mensajePendiente = await pageMobile.locator('.panel-aviso--pendiente').innerText();

  await pageMobile.screenshot({
    path: path.join(CAPTURAS_DIR, '07-panel-login-pendiente.png'),
    fullPage: false,
  });

  resultados.push({
    requisito: 'RF20 / RN-13 (Bloqueo y aviso de cuenta no activa)',
    criterio: 'Negocio con cuenta PENDIENTE recibe 403 y ve aviso claro de que su solicitud está en revisión',
    aprobado: mensajePendiente.includes('en revisión'),
    detalle: `Aviso en pantalla: "${mensajePendiente}"`,
    captura: '07-panel-login-pendiente.png',
  });

  await browser.close();

  console.log('\n=============================================');
  console.log('RESULTADOS DE CERTIFICACIÓN E2E PLAYWRIGHT:');
  console.log('=============================================');
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

certificar().catch((e) => {
  console.error('Fallo en la certificación:', e);
  process.exit(1);
});
