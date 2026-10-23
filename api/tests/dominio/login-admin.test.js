import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LoginAdmin } from '../../src/modulos/acceso/aplicacion/login-admin.caso-uso.js';
import { CredencialesInvalidasError } from '../../src/compartido/dominio/errores.js';

class AdminRepositoryFalso {
  constructor(admins = []) {
    this.admins = admins;
  }
  async obtenerPorEmail(email) {
    return this.admins.find((a) => a.email === email) ?? null;
  }
}

class HasherFalso {
  async comparar(plano, hash) {
    return `hash:${plano}` === hash;
  }
}

class GeneradorTokenFalso {
  generar(payload) {
    return `token:${payload.rol}:${payload.adminId}`;
  }
}

describe('LoginAdmin', () => {
  const adminTest = {
    id: 'admin-uuid-1',
    nombre: 'Admin Principal',
    email: 'admin@jama.pe',
    passwordHash: 'hash:secreto123',
  };

  test('con credenciales válidas genera token con rol ADMIN', async () => {
    const administradores = new AdminRepositoryFalso([adminTest]);
    const hasher = new HasherFalso();
    const generadorToken = new GeneradorTokenFalso();
    const casoUso = new LoginAdmin({ administradores, hasher, generadorToken });

    const resultado = await casoUso.ejecutar({ email: 'ADMIN@JAMA.PE', password: 'secreto123' });

    assert.equal(resultado.token, 'token:ADMIN:admin-uuid-1');
    assert.equal(resultado.admin.id, 'admin-uuid-1');
    assert.equal(resultado.admin.nombre, 'Admin Principal');
    assert.equal(resultado.admin.email, 'admin@jama.pe');
  });

  test('con contraseña incorrecta lanza CredencialesInvalidasError', async () => {
    const administradores = new AdminRepositoryFalso([adminTest]);
    const hasher = new HasherFalso();
    const generadorToken = new GeneradorTokenFalso();
    const casoUso = new LoginAdmin({ administradores, hasher, generadorToken });

    await assert.rejects(
      async () => casoUso.ejecutar({ email: 'admin@jama.pe', password: 'otra-password' }),
      CredencialesInvalidasError
    );
  });

  test('con correo inexistente lanza CredencialesInvalidasError', async () => {
    const administradores = new AdminRepositoryFalso([]);
    const hasher = new HasherFalso();
    const generadorToken = new GeneradorTokenFalso();
    const casoUso = new LoginAdmin({ administradores, hasher, generadorToken });

    await assert.rejects(
      async () => casoUso.ejecutar({ email: 'no-existe@jama.pe', password: 'cualquiera' }),
      CredencialesInvalidasError
    );
  });
});
