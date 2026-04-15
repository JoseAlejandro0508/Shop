import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { buildWhatsAppUrl, formatMoney } from '../../utils/whatsapp';
import { buildCartSummary, buildProductMap, buildWhatsAppMessage } from '../../utils/cart';
import { api } from '../../api/client';
import { Menu, MoonStar, SunMedium, ShoppingCart, MessageCircle, X, SendHorizontal } from 'lucide-react';

export default function AppShell({ children }) {
  const { state, actions } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith('/admin');
  const isHome = location.pathname === '/' || location.pathname === '/home';
  const isCatalog = location.pathname.startsWith('/catalogo');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navRef = useRef(null);
  const [checkoutForm, setCheckoutForm] = useState({
    address: '',
    currency: 'USD',
    phone: '',
  });
  const [checkoutError, setCheckoutError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy el asistente de atención al cliente. ¿En qué puedo ayudarte hoy?'
    },
  ]);

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

  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;

    setChatMessages((current) => [...current, { role: 'user', content: text }]);
    setChatInput('');
    try {
      setIsSendingChat(true);
      const response = await api.supportChat(text);
      setChatMessages((current) => [...current, { role: 'assistant', content: response.reply }]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: `Ahora mismo no pude responder desde IA: ${error.message}. Intenta de nuevo en unos segundos.`,
        },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!navRef.current) return;
      if (!navRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={`app-shell theme-${state.theme}`}>
      <header className="topbar">
        <button type="button" className="brand" onClick={() => navigate('/home')}>
          <img src={state.settings.logoUrl || '/logo.svg'} alt="Logo tienda" className="brand-logo" />
          <span>
            <strong>{state.settings.storeName}</strong>
            <small>Calidad y ofertas para vos</small>
          </span>
        </button>

        <nav className="topbar-nav" ref={navRef}>
          <button type="button" className="nav-link menu-trigger" onClick={() => setIsMenuOpen((value) => !value)} aria-label="Abrir menú">
            <Menu size={17} />
            <span>Secciones</span>
          </button>

          {isMenuOpen ? (
            <div className="nav-dropdown nav-dropdown-animated">
              <button
                type="button"
                className={isHome ? 'nav-link active' : 'nav-link'}
                onClick={() => {
                  navigate('/home');
                  setIsMenuOpen(false);
                }}
              >
                Home
              </button>
              <button
                type="button"
                className={isCatalog ? 'nav-link active' : 'nav-link'}
                onClick={() => {
                  navigate('/catalogo');
                  setIsMenuOpen(false);
                }}
              >
                Catálogo
              </button>
              <button
                type="button"
                className={isAdmin ? 'nav-link active' : 'nav-link'}
                onClick={() => {
                  navigate('/admin');
                  setIsMenuOpen(false);
                }}
              >
                Admin
              </button>
            </div>
          ) : null}

          <button type="button" className="theme-toggle modern-theme-toggle" onClick={actions.toggleTheme}>
            {state.theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
            <span>{state.theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
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
            <span className="floating-cart-icon"><ShoppingCart size={18} /></span>
            <span className="floating-cart-count">{cartSummary.count}</span>
          </button>
        ) : null}

        {!isChatOpen ? (
          <button type="button" className="floating-chat-button" onClick={() => setIsChatOpen(true)} aria-label="Abrir chat">
            <MessageCircle size={18} />
          </button>
        ) : null}

        <aside className={`cart-drawer ${state.isCartOpen ? 'open' : ''}`}>
          <div className="cart-drawer-header">
            <div>
              <p className="eyebrow">Resumen</p>
              <h2>Carrito</h2>
            </div>
            <button type="button" className="icon-button" onClick={actions.toggleCart}>
              <X size={16} />
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
                  <X size={16} />
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

        {isChatOpen ? (
          <div className="chat-widget card">
            <div className="chat-header">
              <div>
                <strong>Atención al cliente</strong>
                <small>Asistente virtual</small>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsChatOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="chat-messages">
              {chatMessages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`chat-bubble ${message.role}`}>
                  {message.content}
                </article>
              ))}
            </div>

            <div className="chat-input-row">
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Escribe tu consulta..."
                disabled={isSendingChat}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendChatMessage();
                  }
                }}
              />
              <button type="button" className="primary-button" onClick={sendChatMessage} disabled={isSendingChat}>
                {isSendingChat ? 'Enviando...' : <SendHorizontal size={16} />}
              </button>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}


