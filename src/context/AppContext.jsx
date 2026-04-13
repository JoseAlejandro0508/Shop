import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { api } from '../api/client';

const STORAGE_KEY = 'tienda-react-whatsapp-state-v2';
const AppContext = createContext(null);

const initialState = {
  theme: 'dark',
  isCartOpen: false,
  isAdminAuthenticated: false,
  adminToken: '',
  isLoadingCatalog: true,
  notice: '',
  settings: { storeName: 'Nova Market', whatsappPhone: '573001112233', description: '', logoUrl: '/logo.svg', supportPrompt: '' },
  categories: [],
  products: [],
  cartItems: [],
};

function readInitialState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }

    const parsed = JSON.parse(raw);
    return {
      ...initialState,
      theme: parsed.theme || initialState.theme,
      cartItems: Array.isArray(parsed.cartItems) ? parsed.cartItems : [],
      adminToken: parsed.adminToken || '',
      isAdminAuthenticated: Boolean(parsed.adminToken),
    };
  } catch {
    return initialState;
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'toggle-theme':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'toggle-cart':
      return { ...state, isCartOpen: !state.isCartOpen };
    case 'set-loading-catalog':
      return { ...state, isLoadingCatalog: action.value };
    case 'set-catalog':
      return {
        ...state,
        notice: '',
        settings: normalizeSettings(action.payload.settings),
        categories: action.payload.categories,
        products: action.payload.products,
      };
    case 'login-success':
      return { ...state, isAdminAuthenticated: true, adminToken: action.token, notice: '' };
    case 'set-notice':
      return { ...state, notice: action.message };
    case 'logout':
      return { ...state, isAdminAuthenticated: false, adminToken: '' };
    case 'add-to-cart': {
      const product = state.products.find((entry) => entry.id === action.id);
      if (!product || product.stock === 0) {
        return state;
      }

      const existing = state.cartItems.find((item) => item.productId === action.id);
      if (existing) {
        return {
          ...state,
          cartItems: state.cartItems.map((item) =>
            item.productId === action.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) } : item,
          ),
        };
      }

      return { ...state, cartItems: [...state.cartItems, { productId: action.id, quantity: 1 }] };
    }
    case 'increase-cart-item':
      return {
        ...state,
        cartItems: state.cartItems.map((item) => {
          if (item.productId !== action.id) {
            return item;
          }

          const product = state.products.find((entry) => entry.id === item.productId);
          return { ...item, quantity: Math.min(item.quantity + 1, product?.stock || item.quantity + 1) };
        }),
      };
    case 'decrease-cart-item':
      return {
        ...state,
        cartItems: state.cartItems
          .map((item) => (item.productId === action.id ? { ...item, quantity: item.quantity - 1 } : item))
          .filter((item) => item.quantity > 0),
      };
    case 'remove-from-cart':
      return { ...state, cartItems: state.cartItems.filter((item) => item.productId !== action.id) };
    default:
      return state;
  }
}

function normalizeSettings(settings) {
  return {
    storeName: settings?.storeName ?? 'Nova Market',
    whatsappPhone: settings?.whatsappPhone ?? '',
    description: settings?.description ?? '',
    logoUrl: settings?.logoUrl || '/logo.svg',
    supportPrompt:
      settings?.supportPrompt ??
      'Responde como asesor de la tienda. Sé amable, claro y orientado a ayudar al cliente a comprar.',
  };
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, readInitialState);

  const getAdminToken = useCallback(() => state.adminToken, [state.adminToken]);

  const loadCatalog = useCallback(async () => {
    try {
      dispatch({ type: 'set-loading-catalog', value: true });
      const data = await api.getCatalog();
      dispatch({ type: 'set-catalog', payload: data });
    } catch (error) {
      dispatch({ type: 'set-notice', message: `No se pudo cargar el catálogo: ${error.message}` });
    } finally {
      dispatch({ type: 'set-loading-catalog', value: false });
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: state.theme,
        cartItems: state.cartItems,
        adminToken: state.adminToken,
      }),
    );
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const actions = useMemo(
    () => ({
      toggleTheme: () => dispatch({ type: 'toggle-theme' }),
      toggleCart: () => dispatch({ type: 'toggle-cart' }),
      login: async (email, password) => {
        try {
          const response = await api.login(email, password);
          dispatch({ type: 'login-success', token: response.token });
          dispatch({ type: 'set-notice', message: '' });
        } catch {
          dispatch({ type: 'set-notice', message: 'Credenciales inválidas. Usa admin@tienda.com / 123456.' });
        }
      },
      logout: () => dispatch({ type: 'logout' }),
      updateSettings: async (payload) => {
        await api.updateSettings(payload, state.adminToken);
        await loadCatalog();
      },
      addCategory: async (name) => {
        await api.addCategory(name, state.adminToken);
        await loadCatalog();
      },
      removeCategory: async (id) => {
        await api.removeCategory(id, state.adminToken);
        await loadCatalog();
      },
      addProduct: async (product) => {
        await api.addProduct(normalizeProduct(product), state.adminToken);
        await loadCatalog();
      },
      updateProduct: async (id, product) => {
        await api.updateProduct(id, normalizeProduct(product), state.adminToken);
        await loadCatalog();
      },
      removeProduct: async (id) => {
        await api.removeProduct(id, state.adminToken);
        await loadCatalog();
      },
      uploadProductImage: async (file) => {
        const response = await api.uploadProductImage(file, state.adminToken);
        return response.imageUrl;
      },
      uploadStoreLogo: async (file) => {
        const response = await api.uploadStoreLogo(file, state.adminToken);
        return response.imageUrl;
      },
      getSupportConfig: async () => {
        return api.getSupportConfig(state.adminToken);
      },
      updateSupportConfig: async (payload) => {
        await api.updateSupportConfig(payload, state.adminToken);
      },
      refreshCatalog: loadCatalog,
      addToCart: (id) => dispatch({ type: 'add-to-cart', id }),
      increaseCartItem: (id) => dispatch({ type: 'increase-cart-item', id }),
      decreaseCartItem: (id) => dispatch({ type: 'decrease-cart-item', id }),
      removeFromCart: (id) => dispatch({ type: 'remove-from-cart', id }),
    }),
    [loadCatalog, state.adminToken, getAdminToken],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function normalizeProduct(product) {
  return {
    name: product.name.trim(),
    description: product.description.trim(),
    price: Number(product.price),
    stock: Number(product.stock),
    image: product.image.trim(),
    categoryId: product.categoryId,
  };
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp debe usarse dentro de AppProvider');
  }

  return context;
}
