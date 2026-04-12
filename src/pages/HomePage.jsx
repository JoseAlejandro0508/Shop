import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function HomePage() {
  const navigate = useNavigate();
  const { state } = useApp();

  const floatingBadges = useMemo(
    () => [
      'Entrega rápida',
      'Soporte dedicado',
      'Calidad premium',
      'Ofertas exclusivas',
      'Compra segura',
      'Precios competitivos',
    ],
    [],
  );

  return (
    <section className="page home-page">
      <div className="home-hero card">
        <div className="home-animated-bg" aria-hidden="true">
          <span className="orb orb-1" />
          <span className="orb orb-2" />
          <span className="orb orb-3" />
          <span className="grid-shimmer" />
        </div>

        <div className="home-content">
          <img src={state.settings.logoUrl || '/logo.svg'} alt="Logo de la tienda" className="home-logo" />
          <p className="home-tagline">{state.settings.storeName}</p>
          <h1>{state.settings.description || 'Los mejores productos de calidad a tu disposición.'}</h1>
          <p className="home-subtitle">Calidad, bajo costo y atención al cliente.</p>

          <button type="button" className="home-cta" onClick={() => navigate('/catalogo')}>
            Ver ofertas
          </button>

          <div className="home-badges" aria-hidden="true">
            {floatingBadges.map((item, index) => (
              <span key={item} style={{ animationDelay: `${index * 0.2}s` }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
