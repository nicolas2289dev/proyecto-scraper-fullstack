import React from 'react';
import { Check, MapPin, ChevronRight } from 'lucide-react';
import type { RouteStop } from '../types/lists.types';

interface ShoppingCircuitHeroBannerProps {
  paradasCount: number;
  supermercadoPrincipal: string;
  onOpenMapModal: () => void;
  nearestStop?: RouteStop;
  totalDistanceKm?: number;
  totalDurationMin?: number;
  orderedStoreNames?: string;
}

export const ShoppingCircuitHeroBanner: React.FC<ShoppingCircuitHeroBannerProps> = ({
  paradasCount,
  supermercadoPrincipal,
  onOpenMapModal,
  nearestStop,
  totalDistanceKm,
  totalDurationMin,
  orderedStoreNames,
}) => {
  const isSingleStore = paradasCount <= 1;
  const primaryBranchLabel = nearestStop
    ? `${nearestStop.sucursal.nombreSucursal}`
    : `${supermercadoPrincipal} • Sucursal más cercana`;

  // Métrica coherente: si es multitienda, comunica la distancia total del circuito;
  // si es monotienda, la distancia a la sucursal asignada.
  const routeHeaderLabel = isSingleStore
    ? primaryBranchLabel
    : `Circuito completo (${paradasCount} paradas)`;

  const routeSubLabel =
    totalDistanceKm && totalDistanceKm > 0
      ? isSingleStore
        ? `a ${nearestStop?.distanciaDesdeAnteriorKm ?? totalDistanceKm} km${totalDurationMin ? ` • ~${totalDurationMin} min` : ''} • Ver mapa`
        : `${totalDistanceKm} km totales${totalDurationMin ? ` • ~${totalDurationMin} min` : ''} • Ver mapa`
      : 'Ver recorrido en mapa';

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
                ? `Parada única en ${nearestStop?.tienda.supermercadoNombre || supermercadoPrincipal}`
                : `Recorrido en ${paradasCount} paradas${orderedStoreNames ? `: ${orderedStoreNames}` : ''}`}
            </h2>
            <span className="opt-hero-banner-badge">
              {isSingleStore ? 'Mejor opción' : 'Mayor ahorro'}
            </span>
          </div>

          <p className="opt-hero-banner-subtitle">
            {isSingleStore
              ? `Todos los productos de tu lista están en ${nearestStop?.sucursal.nombreSucursal || supermercadoPrincipal}, con el mejor precio.`
              : nearestStop
                ? `1° parada más cercana: ${nearestStop.sucursal.nombreSucursal} (${nearestStop.sucursal.direccion}).`
                : 'Tu compra dividida estratégicamente entre supermercados para maximizar tu ahorro.'}
          </p>
        </div>
      </div>

      {/* Lado derecho: Acceso a mapa con métricas globales claras */}
      <button
        type="button"
        className="opt-hero-banner-location"
        onClick={onOpenMapModal}
        aria-label="Ver ubicación y recorrido en mapa"
      >
        <MapPin className="opt-hero-location-icon" size={20} />
        <div className="opt-hero-location-text">
          <span className="opt-hero-location-address">{routeHeaderLabel}</span>
          <span className="opt-hero-location-dist">{routeSubLabel}</span>
        </div>
        <ChevronRight className="opt-hero-location-chevron" size={18} />
      </button>
    </div>
  );
};

