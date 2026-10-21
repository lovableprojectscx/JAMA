// Contenido de demostración para cuando todavía no hay ofertas reales
// publicadas: nunca se mezcla con datos de la API, y la UI siempre lo marca
// como "ejemplo / foto ilustrativa" para no confundirlo con una oferta real.
// Las fotos vienen de jama-demo-foods.webp (brand kit del equipo): una sola
// imagen en cuadrícula de 5x4 recortada por posición, para no cargar 20
// archivos sueltos.
const EJEMPLOS = [
  { categoria: 'Sazón', titulo: 'Arroz con pollo', descripcion: 'Arroz verde con pollo y ensalada.', precioOferta: 10, precioCarta: 18 },
  { categoria: 'Sazón', titulo: 'Lomo saltado', descripcion: 'Carne salteada, papas fritas y arroz.', precioOferta: 15, precioCarta: 25 },
  { categoria: 'Sazón', titulo: 'Ají de gallina', descripcion: 'Pollo en salsa cremosa con arroz y papa.', precioOferta: 10, precioCarta: 18 },
  { categoria: 'Sazón', titulo: 'Milanesa de pollo', descripcion: 'Milanesa acompañada de arroz y ensalada.', precioOferta: 11, precioCarta: 20 },
  { categoria: 'Sazón', titulo: 'Tallarines rojos', descripcion: 'Pasta con salsa de tomate.', precioOferta: 9, precioCarta: 16 },
  { categoria: 'Dulce', titulo: 'Torta de chocolate', descripcion: 'Una porción de torta de chocolate.', precioOferta: 7, precioCarta: 12 },
  { categoria: 'Dulce', titulo: 'Torta tres leches', descripcion: 'Una porción de bizcocho con tres leches.', precioOferta: 7, precioCarta: 12 },
  { categoria: 'Dulce', titulo: 'Cheesecake de fresa', descripcion: 'Una porción con cobertura de fresas.', precioOferta: 8, precioCarta: 14 },
  { categoria: 'Dulce', titulo: 'Torta de zanahoria', descripcion: 'Una porción de torta de zanahoria.', precioOferta: 7, precioCarta: 12 },
  { categoria: 'Ñam', titulo: 'Pie de limón', descripcion: 'Una porción de pie de limón.', precioOferta: 6, precioCarta: 10 },
  { categoria: 'Ñam', titulo: 'Alfajores', descripcion: 'Alfajores con manjar y azúcar en polvo.', precioOferta: 5, precioCarta: 9 },
  { categoria: 'Ñam', titulo: 'Brownies', descripcion: 'Brownies de chocolate.', precioOferta: 5, precioCarta: 9 },
  { categoria: 'Ñam', titulo: 'Cupcakes surtidos', descripcion: 'Cupcakes con distintas coberturas.', precioOferta: 6, precioCarta: 11 },
  { categoria: 'Ñam', titulo: 'Arroz con leche', descripcion: 'Postre cremoso de arroz con leche.', precioOferta: 4, precioCarta: 7 },
  { categoria: 'Ñam', titulo: 'Mazamorra morada', descripcion: 'Postre tradicional de maíz morado.', precioOferta: 4, precioCarta: 7 },
  { categoria: 'Miga', titulo: 'Panecillos surtidos', descripcion: 'Una selección de panes.', precioOferta: 4, precioCarta: 7 },
  { categoria: 'Miga', titulo: 'Empanadas al horno', descripcion: 'Empanadas recién horneadas.', precioOferta: 6, precioCarta: 10 },
  { categoria: 'Taza', titulo: 'Sándwich de pollo', descripcion: 'Pan relleno con pollo y vegetales.', precioOferta: 7, precioCarta: 12 },
  { categoria: 'Verde', titulo: 'Ensalada fresca', descripcion: 'Una ensalada de vegetales variados.', precioOferta: 8, precioCarta: 14 },
  { categoria: 'Verde', titulo: 'Ensalada de frutas', descripcion: 'Una mezcla de frutas de temporada.', precioOferta: 6, precioCarta: 10 },
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

export const EJEMPLOS_ILUSTRATIVOS = EJEMPLOS.map((ej, indice) => ({
  ...ej,
  porcentajeDescuento: Math.round((1 - ej.precioOferta / ej.precioCarta) * 100),
  recorteFoto: recorteFoto(indice),
}));
