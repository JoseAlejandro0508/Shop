import { formatMoney } from './whatsapp';

export function buildProductMap(products) {
  const map = new Map();
  for (const product of products) {
    map.set(product.id, product);
  }
  return map;
}

export function buildCartSummary(cartItems, productsById) {
  let count = 0;
  let total = 0;

  for (const item of cartItems) {
    count += item.quantity;
    const product = productsById.get(item.productId);
    total += (product?.price || 0) * item.quantity;
  }

  return { count, total };
}

export function buildWhatsAppMessage(state, total, productsById) {
  const lines = [`Hola, quiero realizar este pedido en ${state.settings.storeName}:`, ''];

  for (const [index, item] of state.cartItems.entries()) {
    const product = productsById.get(item.productId);
    const subtotal = (product?.price || 0) * item.quantity;
    lines.push(`${index + 1}. ${product?.name || 'Producto'} x${item.quantity} = ${formatMoney(subtotal)}`);
  }

  lines.push('');
  lines.push(`Total: ${formatMoney(total)}`);
  return lines.join('\n');
}
