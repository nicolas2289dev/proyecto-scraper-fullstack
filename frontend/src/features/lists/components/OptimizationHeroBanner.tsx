import React from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';

interface OptimizationHeroBannerProps {
  nombreLista?: string;
  totalAhorrado: number;
  className?: string;
  onBack?: () => void;
}

export const OptimizationHeroBanner: React.FC<OptimizationHeroBannerProps> = ({
  nombreLista,
  totalAhorrado,
  className = '',
  onBack,
}) => {
  const formattedSavings = Number(totalAhorrado || 0).toLocaleString('es-AR');
  const title = nombreLista ? `Optimización de ${nombreLista}` : 'Optimización de compra';

  return (
    <div
      className={`opt-hero-banner-container ${className}`.trim()}
      role="region"
      aria-label={`Banner de ${title}`}
    >
      {/* 1. Botón 'Volver al detalle' estilo hero-badge arriba */}
      {onBack && (
        <div className="opt-hero-top-bar">
          <button
            type="button"
            onClick={onBack}
            className="opt-hero-badge-btn"
            aria-label="Volver al detalle de la lista"
          >
            <ArrowLeft size={13} className="opt-hero-badge-icon" />
            <span>Volver al detalle</span>
          </button>
        </div>
      )}

      {/* 2. Cuerpo del Banner debajo */}
      <div className="opt-hero-banner-body">
        {/* Icono de mapa personalizado con resplandor neón */}
        <div className="opt-hero-icon-wrap" aria-hidden="true">
          <img
            src="/images/icono-punto-mapa-banner.png"
            alt="Punto de ubicación"
            className="opt-hero-pin-img"
          />
        </div>

        {/* Contenido textual */}
        <div className="opt-hero-text-wrap">
          <h1 className="opt-hero-banner-title opt-hero-banner-title-size">
            {title}
          </h1>
          <p className="opt-hero-banner-desc">
            Una ruta interactiva para comprar de manera inteligente, ahorrando tiempo y dinero
          </p>
        </div>

        {/* Tarjeta de Ahorro Máximo (Glass Pill) */}
        {/* <div className="opt-hero-savings-card">
          <span className="opt-hero-savings-label">Ahorrá hasta</span>
          <div className="opt-hero-savings-value-row">
            <span className="opt-hero-savings-amount">
              $ {formattedSavings}
            </span>
            <TrendingUp className="opt-hero-savings-arrow" size={24} strokeWidth={2.8} />
          </div>
        </div> */}
      </div>
    </div>
  );
};
