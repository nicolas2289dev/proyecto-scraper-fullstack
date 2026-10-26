import React from 'react';
import { Sparkles } from 'lucide-react';
import '../styles/hero-banner.css';

export interface HeroBannerProps {
  className?: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ className = '' }) => {
  return (
    <section className={`hero-banner ${className}`.trim()} aria-label="Banner de bienvenida y ahorro">
      {/* Columna Izquierda: Información y propuesta de valor */}
      <div className="hero-banner-content">
        <div className="hero-badge">
          <Sparkles size={13} className="hero-badge-icon" />
          <span>AHORRÁ EN TUS COMPRAS</span>
        </div>

        <h1 className="hero-title">
          Compará precios en los principales supermercados
        </h1>

        <p className="hero-subtitle">
          Encontrá los mejores precios, agregá tus productos a la lista y ahorrá tiempo y dinero.
        </p>

        <div className="hero-stores-row">
          <span className="hero-stores-label">Comparando en:</span>
          <div className="hero-store-pill" title="Supermercado Comodín">
            <img
              src="/icons/icon-comodin.png"
              alt="Comodín"
              className="hero-store-logo"
            />
          </div>
          <div className="hero-store-pill" title="Supermercado Día">
            <img
              src="/icons/icon-dia.png"
              alt="Día"
              className="hero-store-logo"
            />
          </div>
          <div className="hero-store-pill" title="Supermercado Vea">
            <img
              src="/icons/icon-vea-removebg-preview.png"
              alt="Vea"
              className="hero-store-logo"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
