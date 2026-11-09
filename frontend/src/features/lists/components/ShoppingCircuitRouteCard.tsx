import React from 'react';
import { ShieldCheck, Sparkles, Navigation } from 'lucide-react';

interface ShoppingCircuitRouteCardProps {
  paradasCount: number;
  nombresTiendas: string;
  tiempoEstimadoMin?: number;
  distanciaTotalKm?: number;
}

/**
 * Tarjeta informativa fija (sin hover ni acción de clic) que comunica la estrategia
 * algorítmica y los criterios de optimización aplicados al circuito de compra.
 */
export const ShoppingCircuitRouteCard: React.FC<ShoppingCircuitRouteCardProps> = ({
  paradasCount,
}) => {
  const isSingleStore = paradasCount <= 1;

  return (
    <div
      className="opt-card--route opt-card--route-static"
      aria-label="Criterio de optimización aplicado a la ruta de compra"
    >
      {/* Información técnica y estratégica de la optimización */}
      <div className="opt-route-info">
        <div className="opt-route-badge-row">
          <span className="opt-route-strategy-badge">
            <Sparkles size={11} />
            {isSingleStore ? 'Compra Concentrada' : 'Ahorro Combinado'}
          </span>
        </div>

        <p className="opt-route-strategy-desc">
          {isSingleStore
            ? 'Todos los productos con mejor balance de precio en una sola sucursal.'
            : 'Paradas encadenadas por cercanía.'}
        </p>

        <div className="opt-route-meta-pills">
          <span className="opt-route-meta-pill">
            <ShieldCheck size={12} />
            Precios verificados
          </span>
          <span className="opt-route-meta-pill">
            <Navigation size={11} />
            {isSingleStore ? '1 parada directa' : `${paradasCount} paradas secuenciales`}
          </span>
        </div>
      </div>
    </div>
  );
};


