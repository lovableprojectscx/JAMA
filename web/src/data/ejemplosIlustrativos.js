// Contenido de demostración para cuando todavía no hay ofertas reales
// publicadas: nunca se mezcla con datos de la API, y la UI siempre lo marca
// como "ejemplo / foto ilustrativa" para no confundirlo con una oferta real.
// Las fotos vienen de jama-demo-foods.webp (cuadrícula 5x4): cada ítem
// conserva su `indiceSprite` original para mantener el recorte exacto.
const EJEMPLOS = [
  { indiceSprite: 5, categoria: 'Pastelería', titulo: 'Torta de chocolate', descripcion: 'Porción fresca del día con ganache de cacao.', precioOferta: 7, precioCarta: 12 },
  { indiceSprite: 16, categoria: 'Panadería', titulo: 'Empanadas al horno', descripcion: 'Pack de empanadas recién horneadas del día.', precioOferta: 6, precioCarta: 10 },
  { indiceSprite: 7, categoria: 'Pastelería', titulo: 'Cheesecake de fresa', descripcion: 'Porción fría en vitrina con cobertura de fresas.', precioOferta: 8, precioCarta: 14 },
  { indiceSprite: 17, categoria: 'Cafetería', titulo: 'Sándwich de pollo', descripcion: 'Pan artesanal relleno con pollo y vegetales frescos.', precioOferta: 7, precioCarta: 12 },
  { indiceSprite: 19, categoria: 'Juguería', titulo: 'Ensalada de frutas', descripcion: 'Mezcla fresca de frutas de temporada lista para llevar.', precioOferta: 6, precioCarta: 10 },
  { indiceSprite: 1, categoria: 'Restaurante', titulo: 'Lomo saltado', descripcion: 'Plato del día preparado con papas fritas y arroz.', precioOferta: 15, precioCarta: 25 },
];

// Límites reales de cada foto dentro de jama-demo-foods.webp (alturas de fila
// desiguales, por eso no es un grid parejo de 5x4).
const COLUMNAS = [
  [0, 281],
  [285, 560],
  [564, 839],
  [843, 1119],
  [1123, 1402],
];
const FILAS = [
  [0, 274],
  [277, 542],
  [545, 812],
  [815, 1122],
];
const SHEET_ANCHO = 1402;
const SHEET_ALTO = 1122;

function recorteFoto(indice) {
  const [left, right] = COLUMNAS[indice % 5];
  const [top, bottom] = FILAS[Math.floor(indice / 5)];
  return { left, top, width: right - left, height: bottom - top, sheetAncho: SHEET_ANCHO, sheetAlto: SHEET_ALTO };
}

export const EJEMPLOS_ILUSTRATIVOS = EJEMPLOS.map((ej) => ({
  ...ej,
  porcentajeDescuento: Math.round((1 - ej.precioOferta / ej.precioCarta) * 100),
  recorteFoto: recorteFoto(ej.indiceSprite),
}));
