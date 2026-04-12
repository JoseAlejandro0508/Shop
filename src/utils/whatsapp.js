export function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

export function buildWhatsAppUrl(phone, message) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
