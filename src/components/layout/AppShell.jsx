import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppUrl, formatMoney } from '../../utils/whatsapp';
import { buildCartSummary, buildProductMap, buildWhatsAppMessage } from '../../utils/cart';

export default function AppShell({ children }) {
  const { state, actions } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    address: '',
    currency: 'USD',
    phone: '',
  });
  const [checkoutError, setCheckoutError] = useState('');

  const productsById = useMemo(() => buildProductMap(state.products), [state.products]);
  const cartSummary = useMemo(() => buildCartSummary(state.cartItems, productsById), [state.cartItems, productsById]);

  const openCheckout = () => {
    if (state.cartItems.length === 0) {
      return;
    }
    setCheckoutError('');
    setIsCheckoutOpen(true);
  };

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutError('');
  };

  const submitCheckout = () => {
    const payload = {
      address: checkoutForm.address.trim(),
      currency: checkoutForm.currency.trim(),
      phone: checkoutForm.phone.trim(),
    };

    if (!payload.address || !payload.currency || !payload.phone) {
      setCheckoutError('Completa todos los campos requeridos para continuar.');
      return;
    }

    const whatsappMessage = buildWhatsAppMessage(state, cartSummary.total, productsById, payload);
    window.open(buildWhatsAppUrl(state.settings.whatsappPhone, whatsappMessage), '_blank', 'noopener,noreferrer');
    closeCheckout();
  };

  return (
    <div className={`app-shell theme-${state.theme}`}>
      <header className="topbar">
        <button type="button" className="brand" onClick={() => navigate('/')}>
          <span className="brand-mark">T</span>
          <span>
            <strong>{state.settings.storeName}</strong>
            <small>Catalogo, carrito y WhatsApp</small>
          </span>
        </button>

        <nav className="topbar-nav">
          <button type="button" className={isAdmin ? 'nav-link' : 'nav-link active'} onClick={() => navigate('/')}>
            Catalogo
          </button>
          <button type="button" className={isAdmin ? 'nav-link active' : 'nav-link'} onClick={() => navigate('/admin')}>
            Admin
          </button>
          <button type="button" className="theme-toggle" onClick={actions.toggleTheme}>
            {state.theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          </button>
          <button type="button" className="cart-button desktop-only" onClick={actions.toggleCart}>
            Carrito - {cartSummary.count}
          </button>
        </nav>
      </header>

      <main className="main-layout">
        {children}

        {!state.isCartOpen && !isCheckoutOpen ? (
          <button type="button" className="floating-cart-button" onClick={actions.toggleCart} aria-label="Abrir carrito">
            <span className="floating-cart-icon">🛒</span>
            <span className="floating-cart-count">{cartSummary.count}</span>
          </button>
        ) : null}

        <aside className={`cart-drawer ${state.isCartOpen ? 'open' : ''}`}>
          <div className="cart-drawer-header">
            <div>
              <p className="eyebrow">Resumen</p>
              <h2>Carrito</h2>
            </div>
            <button type="button" className="icon-button" onClick={actions.toggleCart}>
              X
            </button>
          </div>

          {state.cartItems.length === 0 ? (
            <div className="empty-state">
              <h3>No hay productos todavia</h3>
              <p>Agrega productos desde el catalogo para ver el total aqui.</p>
            </div>
          ) : (
            <div className="cart-list">
              {state.cartItems.map((item) => {
                const product = productsById.get(item.productId);
                if (!product) {
                  return null;
                }

                return (
                  <article key={item.productId} className="cart-item">
                    <img src={product.image} alt={product.name} />
                    <div>
                      <strong>{product.name}</strong>
                      <p>
                        {formatMoney(product.price)} - Stock {product.stock}
                      </p>
                      <div className="quantity-controls">
                        <button type="button" onClick={() => actions.decreaseCartItem(item.productId)}>
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => actions.increaseCartItem(item.productId)}
                          disabled={item.quantity >= product.stock}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button type="button" className="remove-button" onClick={() => actions.removeFromCart(item.productId)}>
                      Quitar
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          <div className="cart-footer">
            <div>
              <span>Total</span>
              <strong>{formatMoney(cartSummary.total)}</strong>
            </div>
            <button
              type="button"
              className="whatsapp-button"
              onClick={openCheckout}
              disabled={state.cartItems.length === 0}
            >
              Comprar
            </button>
          </div>
        </aside>

        {isCheckoutOpen ? (
          <div className="checkout-overlay" onClick={closeCheckout}>
            <div className="checkout-modal card" onClick={(event) => event.stopPropagation()}>
              <div className="checkout-header">
                <h3>Finalizar compra</h3>
                <button type="button" className="icon-button" onClick={closeCheckout}>
                  X
                </button>
              </div>

              <div className="stack-form">
                <label className="checkout-field">
                  <span>Dirección de domicilio *</span>
                  <input
                    value={checkoutForm.address}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, address: event.target.value }))}
                    placeholder="Ej: Calle 123, Apto 4, Ciudad"
                  />
                </label>

                <label className="checkout-field">
                  <span>Moneda / Pago *</span>
                  <select
                    value={checkoutForm.currency}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, currency: event.target.value }))}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="CUP efectivo">CUP efectivo</option>
                    <option value="CUP transferencia">CUP transferencia</option>
                  </select>
                </label>

                <label className="checkout-field">
                  <span>Teléfono *</span>
                  <input
                    value={checkoutForm.phone}
                    onChange={(event) => setCheckoutForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Ej: +53 5 123 4567"
                  />
                </label>

                {checkoutError ? <p className="notice error">{checkoutError}</p> : null}

                <button type="button" className="primary-button" onClick={submitCheckout}>
                  Confirmar y enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
