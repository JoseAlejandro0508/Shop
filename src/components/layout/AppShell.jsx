import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppUrl, formatMoney } from '../../utils/whatsapp';
import { buildCartSummary, buildProductMap, buildWhatsAppMessage } from '../../utils/cart';

export default function AppShell({ children }) {
  const { state, actions } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');

  const productsById = useMemo(() => buildProductMap(state.products), [state.products]);
  const cartSummary = useMemo(() => buildCartSummary(state.cartItems, productsById), [state.cartItems, productsById]);
  const whatsappMessage = useMemo(
    () => buildWhatsAppMessage(state, cartSummary.total, productsById),
    [state, cartSummary.total, productsById],
  );

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
          <button type="button" className="cart-button" onClick={actions.toggleCart}>
            Carrito - {cartSummary.count}
          </button>
        </nav>
      </header>

      <main className="main-layout">
        {children}

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
              onClick={() => window.open(buildWhatsAppUrl(state.settings.whatsappPhone, whatsappMessage), '_blank', 'noopener,noreferrer')}
              disabled={state.cartItems.length === 0}
            >
              Enviar por WhatsApp
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
