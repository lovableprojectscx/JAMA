import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Negocio, EstadoNegocio, generarSlug } from '../../src/modulos/negocios/dominio/negocio.js';
import { ObtenerPerfilPublico } from '../../src/modulos/negocios/aplicacion/obtener-perfil-publico.caso-uso.js';
import { ActualizarPerfil } from '../../src/modulos/negocios/aplicacion/actualizar-perfil.caso-uso.js';
import { SubirFotoNegocio } from '../../src/modulos/negocios/aplicacion/subir-foto-negocio.caso-uso.js';
import {
  ReglaNegocioError,
  NoEncontradoError,
  NegocioNoHabilitadoError,
} from '../../src/compartido/dominio/errores.js';

const AHORA = new Date('2026-11-13T18:00:00.000Z');

function crearNegocioPrueba(extra = {}) {
  return new Negocio({
    id: '11111111-1111-1111-1111-111111111111',
    nombre: 'Pastelería Dulce Huamanga',
    email: 'dulce@huamanga.pe',
    passwordHash: 'hash',
    whatsapp: '51987654321',
    yape: '987654321',
    direccion: 'Jr. Asamblea 220, Huamanga',
    estado: EstadoNegocio.ACTIVO,
    slug: 'pasteleria-dulce-huamanga',
    tipo: 'PASTELERIA',
    ...extra,
  });
}

describe('generarSlug (RN-17)', () => {
  test('convierte nombres con tildes y mayúsculas en slugs limpios', () => {
    assert.equal(generarSlug('Panadería y Pastelería "El Sol"'), 'panaderia-y-pasteleria-el-sol');
    assert.equal(generarSlug('Cevichería Don José ¡Buenazo!'), 'cewicheria-don-jose-buenazo'.replace('w', 'v'));
  });

  test('si el nombre tiene solo símbolos, genera tienda-id', () => {
    assert.equal(generarSlug('$$$ ###', 'abcdef123456'), 'tienda-abcdef');
  });
});

describe('Negocio - Métodos de Perfil (RN-18, RN-19)', () => {
  test('actualizarPerfil modifica los campos y valida dirección y Yape', () => {
    const negocio = crearNegocioPrueba();
    negocio.actualizarPerfil({
      descripcion: 'Los mejores pasteles artesanales',
      direccion: 'Jr. 28 de Julio 150',
      yape: '912345678',
      horarioAtencion: '6:00 p. m. a 7:30 p. m.',
      instagram: '@dulce_huamanga',
      facebook: 'https://facebook.com/dulcehuamanga',
      tiktok: 'https://www.tiktok.com/@dulce.tiktok',
    });

    assert.equal(negocio.descripcion, 'Los mejores pasteles artesanales');
    assert.equal(negocio.direccion, 'Jr. 28 de Julio 150');
    assert.equal(negocio.yape, '912345678');
    assert.equal(negocio.horarioAtencion, '6:00 p. m. a 7:30 p. m.');
    assert.equal(negocio.instagram, 'dulce_huamanga');
    assert.equal(negocio.facebook, 'dulcehuamanga');
    assert.equal(negocio.tiktok, 'dulce.tiktok');
  });

  test('actualizarPerfil rechaza red social de más de 60 caracteres', () => {
    const negocio = crearNegocioPrueba();
    assert.throws(
      () => negocio.actualizarPerfil({ instagram: 'a'.repeat(61) }),
      ReglaNegocioError
    );
  });

  test('actualizarPerfil permite cambiar tipo y definir tipoDetalle cuando es OTRO', () => {
    const negocio = crearNegocioPrueba();
    negocio.actualizarPerfil({
      tipo: 'OTRO',
      tipoDetalle: 'Heladería artesanal',
    });

    assert.equal(negocio.tipo, 'OTRO');
    assert.equal(negocio.tipoDetalle, 'Heladería artesanal');

    // Cambiar a tipo estándar limpia tipoDetalle automáticamente
    negocio.actualizarPerfil({ tipo: 'PANADERIA' });
    assert.equal(negocio.tipo, 'PANADERIA');
    assert.equal(negocio.tipoDetalle, null);
  });

  test('actualizarPerfil rechaza tipo de negocio no permitido', () => {
    const negocio = crearNegocioPrueba();
    assert.throws(
      () => negocio.actualizarPerfil({ tipo: 'SUPERMERCADO' }),
      ReglaNegocioError
    );
  });

  test('actualizarPerfil rechaza Yape que no tenga 9 dígitos', () => {
    const negocio = crearNegocioPrueba();
    assert.throws(
      () => negocio.actualizarPerfil({ yape: '12345' }),
      ReglaNegocioError
    );
  });

  test('actualizarPortada y actualizarLogo actualizan las URLs', () => {
    const negocio = crearNegocioPrueba();
    negocio.actualizarPortada('https://supabase.co/portada.webp');
    negocio.actualizarLogo('https://supabase.co/logo.png');

    assert.equal(negocio.portadaUrl, 'https://supabase.co/portada.webp');
    assert.equal(negocio.logoUrl, 'https://supabase.co/logo.png');
  });

  test('RN-13: un negocio PENDIENTE no puede actualizar su perfil ni fotos', () => {
    const negocio = crearNegocioPrueba({ estado: EstadoNegocio.PENDIENTE });
    assert.throws(() => negocio.actualizarPerfil({ descripcion: 'Test' }), NegocioNoHabilitadoError);
    assert.throws(() => negocio.actualizarPortada('https://foto.jpg'), NegocioNoHabilitadoError);
    assert.throws(() => negocio.actualizarLogo('https://logo.jpg'), NegocioNoHabilitadoError);
  });
});

describe('ObtenerPerfilPublico (RF24 / HU19)', () => {
  test('devuelve los datos públicos del negocio y sus ofertas activas', async () => {
    const negocio = crearNegocioPrueba();
    const repoNegocios = {
      obtenerPorSlug: async (slug) => (slug === negocio.slug ? negocio : null),
      obtenerPorId: async () => null,
    };
    const ofertasApi = {
      listarVigentesPorNegocio: async () => [
        {
          id: 'o-1',
          titulo: 'Torta de chocolate',
          precioCarta: 40,
          precioOferta: 20,
          precioVigente: () => 20,
          proximoTramo: () => null,
          stock: 2,
        },
      ],
    };

    const casoUso = new ObtenerPerfilPublico({
      negocios: repoNegocios,
      ofertasApi,
      reloj: { ahora: () => AHORA },
    });

    const resultado = await casoUso.ejecutar({ slugOrId: 'pasteleria-dulce-huamanga' });

    assert.equal(resultado.nombre, 'Pastelería Dulce Huamanga');
    assert.equal(resultado.slug, 'pasteleria-dulce-huamanga');
    assert.equal(resultado.ofertas.length, 1);
    assert.equal(resultado.ofertas[0].titulo, 'Torta de chocolate');
  });

  test('si el negocio está PENDIENTE o SUSPENDIDO, responde NoEncontradoError (RN-13)', async () => {
    const negocio = crearNegocioPrueba({ estado: EstadoNegocio.SUSPENDIDO });
    const repoNegocios = {
      obtenerPorSlug: async () => negocio,
      obtenerPorId: async () => negocio,
    };
    const casoUso = new ObtenerPerfilPublico({
      negocios: repoNegocios,
      ofertasApi: null,
      reloj: { ahora: () => AHORA },
    });

    await assert.rejects(
      () => casoUso.ejecutar({ slugOrId: negocio.slug }),
      NoEncontradoError
    );
  });
});

describe('SubirFotoNegocio (RN-18)', () => {
  test('rechaza archivos que no sean JPG, PNG o WEBP', async () => {
    const negocio = crearNegocioPrueba();
    const repoNegocios = {
      obtenerPorId: async () => negocio,
      guardarPerfil: async () => {},
    };
    const casoUso = new SubirFotoNegocio({
      negocios: repoNegocios,
      almacenImagenes: { subir: async () => ({ url: 'https://img.jpg' }) },
    });

    await assert.rejects(
      () =>
        casoUso.ejecutar({
          negocioId: negocio.id,
          tipoFoto: 'portada',
          buffer: Buffer.from('fake'),
          mimeType: 'application/pdf',
        }),
      ReglaNegocioError
    );
  });

  test('sube portada válida y actualiza el negocio', async () => {
    const negocio = crearNegocioPrueba();
    let perfilGuardado = null;
    const repoNegocios = {
      obtenerPorId: async () => negocio,
      guardarPerfil: async (n) => {
        perfilGuardado = n;
      },
    };
    const almacen = {
      subir: async ({ extension }) => ({ url: `https://storage/portada.${extension}` }),
    };

    const casoUso = new SubirFotoNegocio({ negocios: repoNegocios, almacenImagenes: almacen });
    const { url } = await casoUso.ejecutar({
      negocioId: negocio.id,
      tipoFoto: 'portada',
      buffer: Buffer.from('fake'),
      mimeType: 'image/webp',
    });

    assert.equal(url, 'https://storage/portada.webp');
    assert.equal(perfilGuardado.portadaUrl, 'https://storage/portada.webp');
  });
});
