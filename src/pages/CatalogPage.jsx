import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatMoney } from '../utils/whatsapp';

export default function CatalogPage() {
  const { state, actions } = useApp();
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [expandedProductId, setExpandedProductId] = useState(null);

  const categoriesById = useMemo(() => {
    const map = new Map();
    for (const category of state.categories) {
      map.set(category.id, category);
    }
    return map;
  }, [state.categories]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.toLowerCase();

    return state.products.filter((product) => {
      const matchesQuery = `${product.name} ${product.description}`.toLowerCase().includes(normalizedQuery);
      const matchesCategory = activeCategoryId === 'all' || product.categoryId === activeCategoryId;
      return matchesQuery && matchesCategory;
    });
  }, [query, activeCategoryId, state.products]);

  return (
    <section className="page catalog-page">
      {state.isLoadingCatalog ? (
        <section className="card">
          <p>Cargando catálogo...</p>
        </section>
      ) : null}

      {state.notice ? (
        <section className="card">
          <p className="notice">{state.notice}</p>
          <button type="button" className="secondary-button" onClick={actions.refreshCatalog}>
            Reintentar
          </button>
        </section>
      ) : null}

      <section className="hero card">
        <div>
          <p className="eyebrow">Catalogo digital</p>
          <h1>Vende con una vitrina moderna, carrito y pedido por WhatsApp.</h1>
          <p>{state.settings.description}</p>
        </div>
        <div className="hero-stats">
          <article>
            <strong>{state.categories.length}</strong>
            <span>Categorias</span>
          </article>
          <article>
            <strong>{state.products.length}</strong>
            <span>Productos</span>
          </article>
          <article>
            <strong>{state.cartItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            <span>En carrito</span>
          </article>
        </div>
      </section>

      <section className="catalog-toolbar card">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar productos" />
        <div className="catalog-results-pill">
          {filteredProducts.length} resultado{filteredProducts.length === 1 ? '' : 's'}
        </div>
        <div className="chips">
          <button type="button" className={activeCategoryId === 'all' ? 'chip active' : 'chip'} onClick={() => setActiveCategoryId('all')}>
            Todas
          </button>
          {state.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={activeCategoryId === category.id ? 'chip active' : 'chip'}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="product-grid">
        {filteredProducts.map((product) => {
          const category = categoriesById.get(product.categoryId);

          return (
            <article key={product.id} className={`product-card card ${expandedProductId === product.id ? 'expanded' : ''}`}>
              <button
                type="button"
                className="product-image-button"
                onClick={() => setExpandedProductId((current) => (current === product.id ? null : product.id))}
                aria-label={`Ver detalle de ${product.name}`}
              >
                <img src={product.image} alt={product.name} />
              </button>
              <div className="product-content">
                <div className="product-meta">
                  <span>{category?.name || 'Sin categoria'}</span>
                  <strong>{formatMoney(product.price)}</strong>
                </div>
                <h3>{product.name}</h3>
                <p className={expandedProductId === product.id ? 'product-description expanded' : 'product-description'}>{product.description}</p>
                <div className="product-footer">
                  <span>Disponibles: {product.stock}</span>
                  <button
                    type="button"
                    className="primary-button"
                    disabled={product.stock === 0}
                    onClick={() => actions.addToCart(product.id)}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </section>
  );
}
