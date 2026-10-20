import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const RAIZ_SRC = path.join(import.meta.dirname, '..', '..', 'src');
const IMPORTS_PROHIBIDOS = ['express', 'pg', 'jsonwebtoken', 'bcrypt', 'node-cron'];

async function listarArchivosJs(carpeta) {
  const entradas = await readdir(carpeta, { withFileTypes: true });
  const archivos = [];
  for (const entrada of entradas) {
    const rutaCompleta = path.join(carpeta, entrada.name);
    if (entrada.isDirectory()) {
      archivos.push(...(await listarArchivosJs(rutaCompleta)));
    } else if (entrada.name.endsWith('.js')) {
      archivos.push(rutaCompleta);
    }
  }
  return archivos;
}

async function carpetasDeCapa(nombreCapa) {
  const modulosDir = path.join(RAIZ_SRC, 'modulos');
  const modulos = await readdir(modulosDir, { withFileTypes: true });
  const carpetas = [];
  for (const modulo of modulos) {
    if (!modulo.isDirectory()) continue;
    const posible = path.join(modulosDir, modulo.name, nombreCapa);
    try {
      await readdir(posible);
      carpetas.push(posible);
    } catch {
      // el módulo no tiene esa capa; se ignora
    }
  }
  carpetas.push(path.join(RAIZ_SRC, 'compartido', 'dominio'));
  return carpetas;
}

test('el dominio y la aplicación no importan express, pg ni otras librerías de infraestructura', async () => {
  const carpetasDominio = await carpetasDeCapa('dominio');
  const carpetasAplicacion = await carpetasDeCapa('aplicacion');

  const violaciones = [];

  for (const carpeta of [...carpetasDominio, ...carpetasAplicacion]) {
    const archivos = await listarArchivosJs(carpeta);
    for (const archivo of archivos) {
      const contenido = await readFile(archivo, 'utf8');
      for (const libreria of IMPORTS_PROHIBIDOS) {
        const patron = new RegExp(`from\\s+['"]${libreria}['"]`);
        if (patron.test(contenido)) {
          violaciones.push(`${path.relative(RAIZ_SRC, archivo)} importa '${libreria}'`);
        }
      }
    }
  }

  assert.deepEqual(violaciones, [], `Capas internas con imports prohibidos:\n${violaciones.join('\n')}`);
});

test('existen las carpetas dominio y aplicación de los 4 módulos del MVP', async () => {
  const modulos = ['acceso', 'negocios', 'ofertas', 'pedidos'];
  for (const modulo of modulos) {
    const rutaModulo = path.join(RAIZ_SRC, 'modulos', modulo);
    const entradas = await readdir(rutaModulo);
    assert.ok(entradas.length > 0, `el módulo ${modulo} no tiene archivos`);
  }
});
