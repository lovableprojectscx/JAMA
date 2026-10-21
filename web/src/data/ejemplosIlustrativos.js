// Contenido de demostración para cuando todavía no hay ofertas reales
// publicadas: nunca se mezcla con datos de la API, y la UI siempre lo marca
// como "ejemplo / foto ilustrativa" para no confundirlo con una oferta real.
export const EJEMPLOS_ILUSTRATIVOS = [
  { categoria: 'Sazón', icono: '🍛', titulo: 'Arroz con pollo', descripcion: 'Arroz verde con pollo y ensalada.', precioOferta: 10, precioCarta: 18 },
  { categoria: 'Sazón', icono: '🍛', titulo: 'Lomo saltado', descripcion: 'Carne salteada, papas fritas y arroz.', precioOferta: 15, precioCarta: 25 },
  { categoria: 'Sazón', icono: '🍛', titulo: 'Ají de gallina', descripcion: 'Pollo en salsa cremosa con arroz y papa.', precioOferta: 10, precioCarta: 18 },
  { categoria: 'Sazón', icono: '🍛', titulo: 'Milanesa de pollo', descripcion: 'Milanesa acompañada de arroz y ensalada.', precioOferta: 11, precioCarta: 20 },
  { categoria: 'Sazón', icono: '🍛', titulo: 'Tallarines rojos', descripcion: 'Pasta con salsa de tomate.', precioOferta: 9, precioCarta: 16 },
  { categoria: 'Dulce', icono: '🍰', titulo: 'Torta de chocolate', descripcion: 'Una porción de torta de chocolate.', precioOferta: 7, precioCarta: 12 },
  { categoria: 'Dulce', icono: '🍰', titulo: 'Torta tres leches', descripcion: 'Una porción de bizcocho con tres leches.', precioOferta: 7, precioCarta: 12 },
  { categoria: 'Dulce', icono: '🍰', titulo: 'Cheesecake de fresa', descripcion: 'Una porción con cobertura de fresas.', precioOferta: 8, precioCarta: 14 },
  { categoria: 'Dulce', icono: '🍰', titulo: 'Torta de zanahoria', descripcion: 'Una porción de torta de zanahoria.', precioOferta: 7, precioCarta: 12 },
  { categoria: 'Ñam', icono: '🍪', titulo: 'Pie de limón', descripcion: 'Una porción de pie de limón.', precioOferta: 6, precioCarta: 10 },
  { categoria: 'Ñam', icono: '🍪', titulo: 'Alfajores', descripcion: 'Alfajores con manjar y azúcar en polvo.', precioOferta: 5, precioCarta: 9 },
  { categoria: 'Ñam', icono: '🍪', titulo: 'Brownies', descripcion: 'Brownies de chocolate.', precioOferta: 5, precioCarta: 9 },
  { categoria: 'Ñam', icono: '🍪', titulo: 'Cupcakes surtidos', descripcion: 'Cupcakes con distintas coberturas.', precioOferta: 6, precioCarta: 11 },
  { categoria: 'Ñam', icono: '🍪', titulo: 'Arroz con leche', descripcion: 'Postre cremoso de arroz con leche.', precioOferta: 4, precioCarta: 7 },
  { categoria: 'Ñam', icono: '🍪', titulo: 'Mazamorra morada', descripcion: 'Postre tradicional de maíz morado.', precioOferta: 4, precioCarta: 7 },
  { categoria: 'Miga', icono: '🥖', titulo: 'Panecillos surtidos', descripcion: 'Una selección de panes.', precioOferta: 4, precioCarta: 7 },
  { categoria: 'Miga', icono: '🥖', titulo: 'Empanadas al horno', descripcion: 'Empanadas recién horneadas.', precioOferta: 6, precioCarta: 10 },
  { categoria: 'Taza', icono: '🥪', titulo: 'Sándwich de pollo', descripcion: 'Pan relleno con pollo y vegetales.', precioOferta: 7, precioCarta: 12 },
  { categoria: 'Verde', icono: '🥗', titulo: 'Ensalada fresca', descripcion: 'Una ensalada de vegetales variados.', precioOferta: 8, precioCarta: 14 },
  { categoria: 'Verde', icono: '🥗', titulo: 'Ensalada de frutas', descripcion: 'Una mezcla de frutas de temporada.', precioOferta: 6, precioCarta: 10 },
].map((ej) => ({ ...ej, porcentajeDescuento: Math.round((1 - ej.precioOferta / ej.precioCarta) * 100) }));
