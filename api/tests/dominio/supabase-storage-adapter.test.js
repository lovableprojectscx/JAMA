import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  construirNombreArchivo,
  construirUrlSubida,
  construirUrlPublica,
} from '../../src/modulos/ofertas/infraestructura/supabase-storage-adapter.js';

describe('construirNombreArchivo', () => {
  test('usa el id dado y la extensión', () => {
    assert.equal(construirNombreArchivo('png', 'abc-123'), 'abc-123.png');
  });

  test('genera un id único si no se pasa uno', () => {
    const a = construirNombreArchivo('jpg');
    const b = construirNombreArchivo('jpg');
    assert.notEqual(a, b);
    assert.match(a, /\.jpg$/);
  });
});

describe('construirUrlSubida / construirUrlPublica', () => {
  test('arma la URL de subida de la API de Storage', () => {
    assert.equal(
      construirUrlSubida('https://xyz.supabase.co', 'fotos-ofertas', 'a.png'),
      'https://xyz.supabase.co/storage/v1/object/fotos-ofertas/a.png'
    );
  });

  test('arma la URL pública (bucket público)', () => {
    assert.equal(
      construirUrlPublica('https://xyz.supabase.co', 'fotos-ofertas', 'a.png'),
      'https://xyz.supabase.co/storage/v1/object/public/fotos-ofertas/a.png'
    );
  });

  test('quita la barra final de la URL base si la tiene', () => {
    assert.equal(
      construirUrlPublica('https://xyz.supabase.co/', 'fotos-ofertas', 'a.png'),
      'https://xyz.supabase.co/storage/v1/object/public/fotos-ofertas/a.png'
    );
  });
});
