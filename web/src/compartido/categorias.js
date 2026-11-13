export const CATEGORIAS_BASE = [
  { id: 'TODAS', etiqueta: 'Todas', emoji: '✨' },
  { id: 'PASTELERIA', etiqueta: 'Pastelerías', emoji: '🍰' },
  { id: 'PANADERIA', etiqueta: 'Panaderías', emoji: '🥖' },
  { id: 'CAFETERIA', etiqueta: 'Cafeterías', emoji: '☕' },
  { id: 'POLLERIA', etiqueta: 'Pollerías', emoji: '🍗' },
  { id: 'RESTAURANTE', etiqueta: 'Comida', emoji: '🍲' },
  { id: 'JUGUERIA', etiqueta: 'Juguerías', emoji: '🥤' },
  { id: 'OTRO', etiqueta: 'Otros', emoji: '🏪' },
];

export function normalizarClave(texto = '') {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function resolverEmojiDetalle(detalle = '') {
  const d = normalizarClave(detalle);
  if (d.includes('helad')) return '🍦';
  if (d.includes('jug') || d.includes('licua') || d.includes('frut')) return '🥤';
  if (d.includes('pizz')) return '🍕';
  if (d.includes('hambur') || d.includes('sanguch') || d.includes('sandwich')) return '🍔';
  if (d.includes('dulc') || d.includes('postr') || d.includes('choc')) return '🍬';
  if (d.includes('chifa') || d.includes('arroz') || d.includes('chaufa')) return '🥡';
  if (d.includes('poller') || d.includes('pollo') || d.includes('broaster')) return '🍗';
  if (d.includes('ceviche') || d.includes('cebiche') || d.includes('pescad') || d.includes('marisc')) return '🐟';
  if (d.includes('chicha') || d.includes('chancho') || d.includes('cerdo')) return '🍖';
  if (d.includes('cafe')) return '☕';
  if (d.includes('pan') || d.includes('empanad')) return '🥖';
  if (d.includes('torta') || d.includes('pastel') || d.includes('queque')) return '🍰';
  if (d.includes('cervez') || d.includes('bar') || d.includes('coctel') || d.includes('trago')) return '🍻';
  if (d.includes('vegano') || d.includes('vegetar') || d.includes('salad') || d.includes('ensalada')) return '🥗';
  return '🏪';
}

export function capitalizar(texto = '') {
  if (!texto) return '';
  const limpio = texto.trim();
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}
