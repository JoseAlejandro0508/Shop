const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);

  if (!response.ok) {
    const body = await tryJson(response);
    const message = body?.message || `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return tryJson(response);
}

async function tryJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  getCatalog: () => request('/catalog'),
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
  updateSettings: (settings, token) =>
    request('/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(settings),
    }),
  addCategory: (name, token) =>
    request('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify({ name }),
    }),
  removeCategory: (id, token) =>
    request(`/categories/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
  addProduct: (product, token) =>
    request('/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(product),
    }),
  updateProduct: (id, product, token) =>
    request(`/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(product),
    }),
  removeProduct: (id, token) =>
    request(`/products/${id}`, {
      method: 'DELETE',
      headers: authHeaders(token),
    }),
  uploadProductImage: async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/uploads/product-image', {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    });
  },
  uploadStoreLogo: async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/uploads/store-logo', {
      method: 'POST',
      headers: authHeaders(token),
      body: formData,
    });
  },
  supportChat: (message) =>
    request('/support/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    }),
  getSupportConfig: (token) =>
    request('/admin/support-config', {
      method: 'GET',
      headers: authHeaders(token),
    }),
  updateSupportConfig: (payload, token) =>
    request('/admin/support-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(payload),
    }),
};
