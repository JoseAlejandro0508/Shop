function placeholder(label, from, to) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${from}"/>
          <stop offset="100%" stop-color="${to}"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" rx="40" fill="url(#g)"/>
      <circle cx="640" cy="140" r="110" fill="rgba(255,255,255,0.12)"/>
      <text x="56" y="500" fill="#fff" font-size="54" font-family="Segoe UI, sans-serif" font-weight="700">${label}</text>
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const seedSettings = {
  storeName: 'Nova Market',
  whatsappPhone: '573001112233',
  description: 'Catálogo configurable con carrito y pedidos por WhatsApp.',
};

export const seedCategories = [
  { id: 'cat-1', name: 'Tecnología', slug: 'tecnologia' },
  { id: 'cat-2', name: 'Hogar', slug: 'hogar' },
  { id: 'cat-3', name: 'Accesorios', slug: 'accesorios' },
];

export const seedProducts = [
  {
    id: 'prd-1',
    categoryId: 'cat-1',
    name: 'Auriculares inalámbricos',
    description: 'Audio claro, controles táctiles y estuche de carga compacto.',
    price: 129.9,
    stock: 24,
    image: placeholder('Auriculares', '#1f2937', '#4f46e5'),
  },
  {
    id: 'prd-2',
    categoryId: 'cat-1',
    name: 'Teclado mecánico',
    description: 'Retroiluminación, switches suaves y diseño de alto rendimiento.',
    price: 189.5,
    stock: 15,
    image: placeholder('Teclado', '#0f172a', '#0891b2'),
  },
  {
    id: 'prd-3',
    categoryId: 'cat-2',
    name: 'Lámpara minimalista',
    description: 'Iluminación cálida para escritorio, sala o habitación.',
    price: 74.0,
    stock: 30,
    image: placeholder('Lámpara', '#432818', '#d97706'),
  },
  {
    id: 'prd-4',
    categoryId: 'cat-2',
    name: 'Difusor aromático',
    description: 'Ambiente relajante con luces suaves y temporizador.',
    price: 58.75,
    stock: 18,
    image: placeholder('Difusor', '#111827', '#6b7280'),
  },
  {
    id: 'prd-5',
    categoryId: 'cat-3',
    name: 'Cargador rápido',
    description: 'Carga eficiente para distintos dispositivos móviles.',
    price: 39.9,
    stock: 40,
    image: placeholder('Cargador', '#052e16', '#22c55e'),
  },
  {
    id: 'prd-6',
    categoryId: 'cat-3',
    name: 'Bolso premium',
    description: 'Diseño compacto con acabado resistente y versátil.',
    price: 96.2,
    stock: 10,
    image: placeholder('Bolso', '#3f1d38', '#db2777'),
  },
];
