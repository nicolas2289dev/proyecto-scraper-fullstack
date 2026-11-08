import React from 'react';
import { Clock } from 'lucide-react';

interface ShoppingCircuitRouteCardProps {
  paradasCount: number;
  nombresTiendas: string;
  onOpenMapModal: () => void;
}

export const ShoppingCircuitRouteCard: React.FC<ShoppingCircuitRouteCardProps> = ({
  paradasCount,
  nombresTiendas,
  onOpenMapModal,
}) => {
  const tiempoEstimadoMin = paradasCount * 15;

  return (
    <div
      className="opt-card opt-card--route"
      onClick={onOpenMapModal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onOpenMapModal();
        }
      }}
      aria-label="Ver detalles del recorrido de compra"
    >
      {/* Miniatura visual del mapa nocturno con trazado de ruta */}
      <div className="opt-route-map-thumb" aria-hidden="true">
        <svg
          viewBox="0 0 100 70"
          className="opt-route-svg"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fondo oscuro del mapa */}
          <rect width="100" height="70" rx="8" fill="#081a24" />

          {/* Cuadrícula / Calles estilizadas */}
          <path
            d="M-10 20 H110 M-10 48 H110 M25 -10 V80 M75 -10 V80 M0 60 L100 10"
            stroke="#16384c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Trazo punteado de la ruta en verde neón */}
          <path
            d="M25 48 C 45 48, 55 20, 75 20"
            stroke="#00e699"
            strokeWidth="3"
            strokeDasharray="4 3"
            strokeLinecap="round"
          />

          {/* Marcador Pin 1 (Origen / Tienda 1) */}
          <circle cx="25" cy="48" r="6" fill="#00e699" />
          <circle cx="25" cy="48" r="2.5" fill="#070d19" />

          {/* Marcador Pin 2 (Destino / Tienda 2) */}
          <circle cx="75" cy="20" r="6" fill="#00e699" />
          <circle cx="75" cy="20" r="2.5" fill="#070d19" />
        </svg>
      </div>

      {/* Información del recorrido */}
      <div className="opt-route-info">
        <h4 className="opt-route-title">Tu recorrido</h4>
        <span className="opt-route-subtitle">
          {paradasCount === 1
            ? `1 parada en ${nombresTiendas}`
            : `${paradasCount} paradas: ${nombresTiendas}`}
        </span>
        <div className="opt-route-time">
          <Clock size={14} className="opt-route-time-icon" />
          <span>Tiempo estimado: {tiempoEstimadoMin} min</span>
        </div>
      </div>
    </div>
  );
};

