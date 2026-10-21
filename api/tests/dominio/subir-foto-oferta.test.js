import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SubirFotoOferta } from '../../src/modulos/ofertas/aplicacion/subir-foto-oferta.caso-uso.js';
import { OfertasController } from '../../src/modulos/ofertas/presentacion/ofertas.controller.js';
import { ReglaNegocioError } from '../../src/compartido/dominio/errores.js';

class AlmacenImagenesFalso {
  constructor() {
    this.subidas = [];
  }

  async subir({ buffer, contentType, extension }) {
    this.subidas.push({ buffer, contentType, extension });
    return { url: `https://fake.test/fotos/x.${extension}` };
  }
}

function respuestaFalsa() {
  const res = {
    statusCode: null,
    body: null,
    status(codigo) {
      this.statusCode = codigo;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe('SubirFotoOferta', () => {
  test('RN-12: rechaza un tipo de archivo que no es imagen', async () => {
    const subirFotoOferta = new SubirFotoOferta({ almacenImagenes: new AlmacenImagenesFalso() });
    await assert.rejects(
      () => subirFotoOferta.ejecutar({ buffer: Buffer.from('hola'), mimeType: 'text/plain' }),
      ReglaNegocioError
    );
  });

  test('sube una imagen JPG y devuelve su URL', async () => {
    const almacen = new AlmacenImagenesFalso();
    const subirFotoOferta = new SubirFotoOferta({ almacenImagenes: almacen });

    const { fotoUrl } = await subirFotoOferta.ejecutar({ buffer: Buffer.from('x'), mimeType: 'image/jpeg' });

    assert.equal(fotoUrl, 'https://fake.test/fotos/x.jpg');
    assert.equal(almacen.subidas[0].extension, 'jpg');
    assert.equal(almacen.subidas[0].contentType, 'image/jpeg');
  });

  test('acepta PNG y WEBP además de JPG', async () => {
    const almacen = new AlmacenImagenesFalso();
    const subirFotoOferta = new SubirFotoOferta({ almacenImagenes: almacen });

    await subirFotoOferta.ejecutar({ buffer: Buffer.from('x'), mimeType: 'image/png' });
    await subirFotoOferta.ejecutar({ buffer: Buffer.from('x'), mimeType: 'image/webp' });

    assert.deepEqual(
      almacen.subidas.map((s) => s.extension),
      ['png', 'webp']
    );
  });
});

describe('OfertasController.subirFoto', () => {
  test('sin archivo adjunto responde 400', async () => {
    const controller = new OfertasController({
      subirFotoOferta: new SubirFotoOferta({ almacenImagenes: new AlmacenImagenesFalso() }),
    });
    const req = { file: undefined };
    const res = respuestaFalsa();

    await controller.subirFoto(req, res, (err) => {
      throw err;
    });

    assert.equal(res.statusCode, 400);
  });

  test('un archivo que no es imagen responde 400 con el mensaje de RN-12', async () => {
    const controller = new OfertasController({
      subirFotoOferta: new SubirFotoOferta({ almacenImagenes: new AlmacenImagenesFalso() }),
    });
    const req = { file: { buffer: Buffer.from('hola'), mimetype: 'application/pdf' } };
    const res = respuestaFalsa();

    await controller.subirFoto(req, res, (err) => {
      throw err;
    });

    assert.equal(res.statusCode, 400);
    assert.match(res.body.error, /RN-12/);
  });

  test('una imagen válida responde 201 con la fotoUrl', async () => {
    const controller = new OfertasController({
      subirFotoOferta: new SubirFotoOferta({ almacenImagenes: new AlmacenImagenesFalso() }),
    });
    const req = { file: { buffer: Buffer.from('x'), mimetype: 'image/png' } };
    const res = respuestaFalsa();

    await controller.subirFoto(req, res, (err) => {
      throw err;
    });

    assert.equal(res.statusCode, 201);
    assert.equal(res.body.fotoUrl, 'https://fake.test/fotos/x.png');
  });
});
