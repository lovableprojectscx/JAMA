import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { poolDePruebas } from '../soporte/fixtures-pg.js';
import { levantarServidor, enviarJson } from '../soporte/servidor-http.js';
import { crearApiNegocios } from '../../src/modulos/negocios/index.js';
import { crearApiAcceso } from '../../src/modulos/acceso/index.js';
import { RelojSistema } from '../../src/compartido/infraestructura/relojes.js';
import { crearLimitarSolicitudes } from '../../src/api/middlewares/rate-limit.middleware.js';

// HU15/HU16 · RF19, RF20, RF23 · RN-13, RN-15, RN-16, contra PostgreSQL real
// y por HTTP: solicitud pública → PENDIENTE → login bloqueado hasta aprobar.

let pool;
let servidor;

function aleatorio() {
  return Math.random().toString(36).slice(2, 10);
}

function celularUnico() {
  return `9${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
}

function solicitud(extra = {}) {
  return {
    nombre: 'Pastelería de prueba',
    responsable: 'Rosa Quispe',
    tipo: 'PASTELERIA',
    whatsapp: celularUnico(),
    direccion: 'Jr. Asamblea 220, Huamanga',
    email: `rosa-${aleatorio()}@dulce.pe`,
    password: 'secreta123',
    declaracionAceptada: true,
    ...extra,
  };
}

before(async () => {
  pool = poolDePruebas();
  const reloj = new RelojSistema();
  // Sin límite aquí: este archivo crea más de 5 solicitudes. El límite (RF23)
  // tiene su propia prueba al final, con su propio servidor y contador.
  const sinLimite = (req, res, next) => next();
  const apiNegocios = crearApiNegocios({ pool, reloj, limitarSolicitudes: sinLimite });
  const apiAcceso = crearApiAcceso({ apiNegocios, jwtSecret: 'secreto-de-prueba', duracionToken: '5m' });

  servidor = await levantarServidor((app) => {
    app.use('/negocios/solicitudes', apiNegocios.routerSolicitudes);
    app.use('/auth', apiAcceso.router);
  });
});

after(async () => {
  await servidor.cerrar();
  await pool.end();
});

describe('POST /negocios/solicitudes', () => {
  test('crea el negocio PENDIENTE, con la contraseña hasheada y el WhatsApp con 51', async () => {
    const datos = solicitud({ email: `  Rosa-${aleatorio()}@Dulce.PE ` });
    const { status, body } = await enviarJson(`${servidor.url}/negocios/solicitudes`, 'POST', datos);

    assert.equal(status, 201);
    assert.equal(body.estado, 'PENDIENTE');
    assert.equal(body.passwordHash, undefined);

    const { rows } = await pool.query('SELECT * FROM negocios WHERE id = $1', [body.id]);
    assert.equal(rows[0].estado, 'PENDIENTE');
    assert.equal(rows[0].email, datos.email.trim().toLowerCase());
    assert.equal(rows[0].whatsapp, `51${datos.whatsapp}`);
    assert.equal(rows[0].tipo, 'PASTELERIA');
    assert.notEqual(rows[0].password_hash, datos.password);
    assert.ok(rows[0].declaracion_aceptada_en);
  });

  test('RN-16: el mismo correo (aunque cambien mayúsculas) responde 409', async () => {
    const datos = solicitud();
    assert.equal((await enviarJson(`${servidor.url}/negocios/solicitudes`, 'POST', datos)).status, 201);

    const repetida = await enviarJson(
      `${servidor.url}/negocios/solicitudes`,
      'POST',
      solicitud({ email: datos.email.toUpperCase() })
    );
    assert.equal(repetida.status, 409);
    assert.equal(repetida.body.campo, 'email');
  });

  test('RN-16: el mismo WhatsApp responde 409', async () => {
    const datos = solicitud();
    assert.equal((await enviarJson(`${servidor.url}/negocios/solicitudes`, 'POST', datos)).status, 201);

    const repetida = await enviarJson(
      `${servidor.url}/negocios/solicitudes`,
      'POST',
      solicitud({ whatsapp: `+51 ${datos.whatsapp}` })
    );
    assert.equal(repetida.status, 409);
    assert.equal(repetida.body.campo, 'whatsapp');
  });

  test('RN-15: un dato inválido responde 400 y no crea nada', async () => {
    const datos = solicitud({ tipo: 'SUPERMERCADO' });
    const { status, body } = await enviarJson(`${servidor.url}/negocios/solicitudes`, 'POST', datos);

    assert.equal(status, 400);
    assert.match(body.error, /RN-15/);
    const { rows } = await pool.query('SELECT 1 FROM negocios WHERE email = $1', [datos.email]);
    assert.equal(rows.length, 0);
  });
});

describe('Login según el estado del negocio (RN-13, RF20)', () => {
  async function solicitarYDevolver() {
    const datos = solicitud();
    const { body } = await enviarJson(`${servidor.url}/negocios/solicitudes`, 'POST', datos);
    return { ...datos, id: body.id };
  }

  test('PENDIENTE: contraseña correcta → 403 NEGOCIO_PENDIENTE', async () => {
    const negocio = await solicitarYDevolver();
    const { status, body } = await enviarJson(`${servidor.url}/auth/login`, 'POST', {
      email: negocio.email,
      password: negocio.password,
    });

    assert.equal(status, 403);
    assert.equal(body.codigo, 'NEGOCIO_PENDIENTE');
    assert.equal(body.token, undefined);
  });

  test('PENDIENTE con contraseña incorrecta → 401 (no revela el estado)', async () => {
    const negocio = await solicitarYDevolver();
    const { status, body } = await enviarJson(`${servidor.url}/auth/login`, 'POST', {
      email: negocio.email,
      password: 'otra-cosa-123',
    });

    assert.equal(status, 401);
    assert.equal(body.codigo, undefined);
  });

  test('RECHAZADO → 403 NEGOCIO_RECHAZADO con el motivo', async () => {
    const negocio = await solicitarYDevolver();
    await pool.query(`UPDATE negocios SET estado = 'RECHAZADO', motivo_estado = $2 WHERE id = $1`, [
      negocio.id,
      'No pudimos confirmar la dirección',
    ]);

    const { status, body } = await enviarJson(`${servidor.url}/auth/login`, 'POST', {
      email: negocio.email,
      password: negocio.password,
    });

    assert.equal(status, 403);
    assert.equal(body.codigo, 'NEGOCIO_RECHAZADO');
    assert.equal(body.motivo, 'No pudimos confirmar la dirección');
  });

  test('ACTIVO (aprobado) → 200 con token, y el correo no distingue mayúsculas', async () => {
    const negocio = await solicitarYDevolver();
    await pool.query(`UPDATE negocios SET estado = 'ACTIVO' WHERE id = $1`, [negocio.id]);

    const { status, body } = await enviarJson(`${servidor.url}/auth/login`, 'POST', {
      email: negocio.email.toUpperCase(),
      password: negocio.password,
    });

    assert.equal(status, 200);
    assert.ok(body.token);
  });
});

test('RF23: solo 5 solicitudes creadas por hora desde una IP; las fallidas no cuentan', async () => {
  // Servidor propio, con su propio contador del límite.
  const reloj = new RelojSistema();
  const apiNegocios = crearApiNegocios({ pool, reloj, limitarSolicitudes: crearLimitarSolicitudes() });
  const propio = await levantarServidor((app) => app.use('/negocios/solicitudes', apiNegocios.routerSolicitudes));

  try {
    for (let i = 0; i < 3; i += 1) {
      const fallida = await enviarJson(`${propio.url}/negocios/solicitudes`, 'POST', solicitud({ password: 'corta' }));
      assert.equal(fallida.status, 400);
    }
    for (let i = 0; i < 5; i += 1) {
      const creada = await enviarJson(`${propio.url}/negocios/solicitudes`, 'POST', solicitud());
      assert.equal(creada.status, 201);
    }
    const sexta = await enviarJson(`${propio.url}/negocios/solicitudes`, 'POST', solicitud());
    assert.equal(sexta.status, 429);
  } finally {
    await propio.cerrar();
  }
});
