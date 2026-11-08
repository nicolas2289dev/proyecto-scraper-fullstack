import React from 'react';
import { Check, MapPin, ChevronRight } from 'lucide-react';

interface ShoppingCircuitHeroBannerProps {
  paradasCount: number;
  supermercadoPrincipal: string;
  onOpenMapModal: () => void;
}

export const ShoppingCircuitHeroBanner: React.FC<ShoppingCircuitHeroBannerProps> = ({
  paradasCount,
  supermercadoPrincipal,
  onOpenMapModal,
}) => {
  const isSingleStore = paradasCount === 1;

  return (
    <div className="opt-hero-banner">
      {/* Lado izquierdo: Icono de Check + Título + Badge + Subtítulo */}
      <div className="opt-hero-banner-main">
        <div className="opt-hero-banner-check" aria-hidden="true">
          <Check size={26} strokeWidth={3} />
        </div>

        <div className="opt-hero-banner-text">
          <div className="opt-hero-banner-title-row">
            <h2 className="opt-hero-banner-title">
              {isSingleStore
                ? `Parada única en ${supermercadoPrincipal}`
                : `Recorrido en ${paradasCount} paradas`}
            </h2>
            <span className="opt-hero-banner-badge">
              {isSingleStore ? 'Mejor opción' : 'Mayor ahorro'}
            </span>
          </div>

          <p className="opt-hero-banner-subtitle">
            {isSingleStore
              ? `Todos los productos de tu lista están en ${supermercadoPrincipal}, con el mejor precio.`
              : 'Tu compra dividida estratégicamente entre supermercados para maximizar tu ahorro.'}
          </p>
        </div>
      </div>

      {/* Lado derecho: Ubicación y acceso a mapa */}
      <button
        type="button"
        className="opt-hero-banner-location"
        onClick={onOpenMapModal}
        aria-label="Ver ubicación y recorrido en mapa"
      >
        <MapPin className="opt-hero-location-icon" size={20} />
        <div className="opt-hero-location-text">
          <span className="opt-hero-location-address">
            {isSingleStore ? `${supermercadoPrincipal} • Sucursal central` : 'Ruta recomendada'}
          </span>
          <span className="opt-hero-location-dist">a 2.3 km • Ver mapa</span>
        </div>
        <ChevronRight className="opt-hero-location-chevron" size={18} />
      </button>
    </div>
  );
};

