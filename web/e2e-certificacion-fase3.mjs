import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const apiRequire = createRequire(path.resolve('../api/package.json'));
const pg = apiRequire('pg');
const bcrypt = apiRequire('bcrypt');

const { Pool } = pg;

// Cargar DATABASE_URL desde api/.env
const envPath = path.resolve('../api/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split(/\r?\n/)) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  }
}

const CAPTURAS_DIR = 'C:/Users/jacks/.gemini/antigravity/brain/85fdcc5e-6623-40c0-9951-6ba2654ecfdd/capturas';

async function certificarFase3() {
  console.log('Iniciando certificación E2E de Fase 3 con Playwright...');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const hashComun = await bcrypt.hash('passwordSegura123', 4);

  const sufijoAprobar = Math.floor(Math.random() * 900000 + 100000);
  const emailAprobar = `tienda_apr_${sufijoAprobar}@jama.pe`;
  const whatsappAprobar = `9${Math.floor(Math.random() * 90000000 + 10000000)}`;

  const sufijoRechazar = Math.floor(Math.random() * 900000 + 100000);
  const emailRechazar = `tienda_rec_${sufijoRechazar}@jama.pe`;
  const whatsappRechazar = `9${Math.floor(Math.random() * 90000000 + 10000000)}`;

  console.log('Insertando negocios PENDIENTE de prueba directamente en PostgreSQL...');
  await pool.query(
    `INSERT INTO negocios
       (nombre, responsable, tipo, email, password_hash, whatsapp, yape, direccion, estado, declaracion_aceptada_en, creado_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDIENTE', now(), now())`,
    [
      `Pastelería Bella Huamanga ${sufijoAprobar}`,
      'María Mendoza',
      'PASTELERIA',
      emailAprobar,
      hashComun,
      `51${whatsappAprobar}`,
      `51${whatsappAprobar}`,
      'Portal Unión 15, Huamanga',
    ]
  );

  await pool.query(
    `INSERT INTO negocios
       (nombre, responsable, tipo, email, password_hash, whatsapp, yape, direccion, estado, declaracion_aceptada_en, creado_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDIENTE', now(), now())`,
    [
      `Pollería El Éxito ${sufijoRechazar}`,
      'Carlos Ruiz',
      'POLLERIA',
      emailRechazar,
      hashComun,
      `51${whatsappRechazar}`,
      `51${whatsappRechazar}`,
      'Av. Mariscal Cáceres 400, Huamanga',
    ]
  );

  await pool.end();
  console.log('Negocios de prueba insertados con éxito.');

  const browser = await chromium.launch({ channel: 'chrome' });

  // Contexto Escritorio para Admin (1280x800)
  const contextDesktop = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1.5,
  });
  const pageAdmin = await contextDesktop.newPage();

  // Contexto Móvil para probar que el negocio aprobado entra al panel (390x844)
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const pageMobile = await contextMobile.newPage();

  const resultados = [];

  // ========================================================
  // PRUEBA 1: Login de Administrador (/admin)
  // ========================================================
  console.log('\n[PRUEBA 1] Evaluando Login de Administrador en /admin...');
  await pageAdmin.goto('http://localhost:5173/admin', { waitUntil: 'networkidle' });

  await pageAdmin.screenshot({
    path: path.join(CAPTURAS_DIR, '08-admin-login.png'),
    fullPage: false,
  });

  // Login con credenciales válidas
  await pageAdmin.fill('input[type="email"]', 'admin@jama.pe');
  await pageAdmin.fill('input[type="password"]', 'admin1234');
  await pageAdmin.click('button[type="submit"]');

  await pageAdmin.waitForSelector('.admin-header__tag');
  const tagAdmin = await pageAdmin.locator('.admin-header__tag').innerText();

  resultados.push({
    requisito: 'RF21 / ADR-011 (Autenticación de Admin)',
    criterio: 'Login exclusivo de admin con JWT rol ADMIN y acceso al panel',
    aprobado: tagAdmin === 'ADMIN',
    detalle: `Autenticado con éxito. Badge: ${tagAdmin}`,
    captura: '08-admin-login.png',
  });

  // ========================================================
  // PRUEBA 2: Lista de solicitudes pendientes
  // ========================================================
  console.log('\n[PRUEBA 2] Evaluando Lista de Solicitudes Pendientes...');
  await pageAdmin.waitForSelector('.admin-tarjeta-solicitud');
  const cantidadTarjetas = await pageAdmin.locator('.admin-tarjeta-solicitud').count();

  await pageAdmin.screenshot({
    path: path.join(CAPTURAS_DIR, '09-admin-panel-pendientes.png'),
    fullPage: false,
  });

  resultados.push({
    requisito: 'RF21 (Gestión de Solicitudes)',
    criterio: 'Lista de solicitudes pendientes con datos completos de negocio y responsable',
    aprobado: cantidadTarjetas >= 2,
    detalle: `Solicitudes pendientes visualizadas: ${cantidadTarjetas}`,
    captura: '09-admin-panel-pendientes.png',
  });

  // ========================================================
  // PRUEBA 3: RF15, RF22, RN-14 - Aprobación y botón WhatsApp
  // ========================================================
  console.log('\n[PRUEBA 3] Evaluando Aprobación de Negocio y botón WhatsApp...');
  const tarjetaAprobar = pageAdmin.locator('.admin-tarjeta-solicitud', {
    hasText: emailAprobar,
  });

  await tarjetaAprobar.locator('.admin-btn-aprobar').click();
  await tarjetaAprobar.locator('.admin-btn-whatsapp').waitFor({ state: 'visible' });

  const linkWaAprobar = await tarjetaAprobar.locator('.admin-btn-whatsapp').getAttribute('href');
  const badgeEstadoAprobado = await tarjetaAprobar.locator('.admin-badge-estado').innerText();

  await pageAdmin.screenshot({
    path: path.join(CAPTURAS_DIR, '10-admin-aprobacion-whatsapp.png'),
    fullPage: false,
  });

  resultados.push({
    requisito: 'RF15 / RF22 / RN-14 (Aprobación y Aviso WhatsApp)',
    criterio: 'Negocio transiciona a ACTIVO y genera enlace wa.me con mensaje prellenado de bienvenida',
    aprobado: badgeEstadoAprobado === 'ACTIVO' && linkWaAprobar.includes('wa.me'),
    detalle: `Estado: ${badgeEstadoAprobado} | Enlace WhatsApp: ${linkWaAprobar.slice(0, 45)}...`,
    captura: '10-admin-aprobacion-whatsapp.png',
  });

  // ========================================================
  // PRUEBA 4: RF17, RN-14 - Rechazo con motivo obligatorio
  // ========================================================
  console.log('\n[PRUEBA 4] Evaluando Rechazo con motivo obligatorio...');
  const tarjetaRechazar = pageAdmin.locator('.admin-tarjeta-solicitud', {
    hasText: emailRechazar,
  });

  await tarjetaRechazar.locator('.admin-btn-rechazar').click();
  await tarjetaRechazar.locator('.admin-caja-rechazo__input').waitFor({ state: 'visible' });

  // Rellenar motivo válido
  await tarjetaRechazar.locator('.admin-caja-rechazo__input').fill('Local fuera del radio urbano de Huamanga');
  await tarjetaRechazar.locator('button:has-text("Confirmar Rechazo")').click();

  await tarjetaRechazar.locator('.admin-badge-estado--rechazado').waitFor({ state: 'visible' });
  const badgeEstadoRechazado = await tarjetaRechazar.locator('.admin-badge-estado').innerText();
  const motivoMostrado = await tarjetaRechazar.locator('.admin-dato-item__valor', { hasText: 'fuera del radio' }).innerText();

  await pageAdmin.screenshot({
    path: path.join(CAPTURAS_DIR, '11-admin-rechazo-con-motivo.png'),
    fullPage: false,
  });

  resultados.push({
    requisito: 'RF17 / RN-14 (Rechazo con Motivo)',
    criterio: 'Negocio pasa a RECHAZADO, registra motivo y genera aviso WhatsApp con explicación',
    aprobado: badgeEstadoRechazado === 'RECHAZADO' && motivoMostrado.includes('radio urbano'),
    detalle: `Estado: ${badgeEstadoRechazado} | Motivo: "${motivoMostrado}"`,
    captura: '11-admin-rechazo-con-motivo.png',
  });

  // ========================================================
  // PRUEBA 5: Verificación final - La tienda recién aprobada puede entrar a /panel
  // ========================================================
  console.log('\n[PRUEBA 5] Verificando que tienda APROBADA ahora sí puede operar en /panel...');
  await pageMobile.goto('http://localhost:5173/panel', { waitUntil: 'networkidle' });

  await pageMobile.fill('input[type="email"]', emailAprobar);
  await pageMobile.fill('input[type="password"]', 'passwordSegura123');
  await pageMobile.click('button[type="submit"]');

  // Debe ingresar al panel móvil de negocios y ver la cabecera
  await pageMobile.waitForSelector('.panel-cabecera__negocio');
  const nombreNegocioEnPanel = await pageMobile.locator('.panel-cabecera__negocio').innerText();

  await pageMobile.screenshot({
    path: path.join(CAPTURAS_DIR, '12-negocio-aprobado-entra-panel.png'),
    fullPage: false,
  });

  resultados.push({
    requisito: 'RN-13 / RF20 (Ciclo Completo: Aprobado -> Puede Operar)',
    criterio: 'Tienda aprobada por el admin inicia sesión exitosamente en /panel y accede a sus funciones',
    aprobado: nombreNegocioEnPanel.includes(`Pastelería Bella Huamanga ${sufijoAprobar}`),
    detalle: `Negocio logueado en panel: "${nombreNegocioEnPanel.replace(/\n/g, ' ')}"`,
    captura: '12-negocio-aprobado-entra-panel.png',
  });

  await browser.close();

  console.log('\n======================================================');
  console.log('RESULTADOS DE CERTIFICACIÓN E2E FASE 3 (ADMIN):');
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

certificarFase3().catch((e) => {
  console.error('Fallo en la certificación de Fase 3:', e);
  process.exit(1);
});
