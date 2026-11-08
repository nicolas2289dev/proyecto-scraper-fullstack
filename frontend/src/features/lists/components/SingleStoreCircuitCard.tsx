import React from 'react';
import { Sparkles, ShoppingBag, CheckCircle2 } from 'lucide-react';
import type { TiendaOptima } from '../types/lists.types';
import type { StoreProgress } from '../hooks/useShoppingCircuitProgress';
import { StoreCircuitChecklist } from './StoreCircuitChecklist';
import { getSupermarketLogo } from '@/features/products';

interface SingleStoreCircuitCardProps {
  tienda: TiendaOptima;
  totalOptimo: number;
  totalAhorrado: number;
  isItemChecked: (supermercadoId: number, productoId: number) => boolean;
  onToggleItem: (supermercadoId: number, productoId: number) => void;
  progress: StoreProgress;
}

export const SingleStoreCircuitCard: React.FC<SingleStoreCircuitCardProps> = ({
  tienda,
  totalOptimo,
  totalAhorrado,
  isItemChecked,
  onToggleItem,
  progress,
}) => {
  const logo = getSupermarketLogo(tienda.supermercadoNombre);
  const { total, checked, completed } = progress;

  return (
    <div className="single-circuit-card">
      <div className="single-circuit-banner">
        <div className="single-circuit-banner-icon">
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
        </div>
        <div className="single-circuit-banner-text">
          <h3 className="single-circuit-banner-title">
            ¡Compra directa en un solo lugar!
          </h3>
          <p className="single-circuit-banner-desc">
            El circuito óptimo determinó que la totalidad de tu compra se concentra en una única parada.
            Obtenés el máximo ahorro sin necesidad de realizar traslados entre múltiples comercios.
          </p>
        </div>
      </div>

      <div className="single-circuit-header">
        <div className="single-circuit-store-identity">
          {logo ? (
            <img
              src={logo.logoUrl}
              alt={logo.alt}
              className="single-circuit-logo"
            />
          ) : (
            <ShoppingBag size={24} className="text-emerald-600 dark:text-emerald-400" />
          )}
          <div>
            <span className="single-circuit-store-tag">Establecimiento Único Óptimo</span>
            <h4 className="single-circuit-store-name">{tienda.supermercadoNombre}</h4>
          </div>
        </div>

        <div className="single-circuit-stats">
          {completed ? (
            <span className="circuit-store-completed-pill">
              <CheckCircle2 size={16} />
              <span>Todos los ítems en el carrito</span>
            </span>
          ) : (
            <span className="circuit-store-progress-pill">
              {checked} de {total} ítems comprados
            </span>
          )}
        </div>
      </div>

      <div className="single-circuit-body">
        <StoreCircuitChecklist
          supermercadoId={tienda.supermercadoId}
          productos={tienda.productos}
          isItemChecked={isItemChecked}
          onToggleItem={onToggleItem}
        />
      </div>

      <div className="single-circuit-footer">
        <div className="single-circuit-footer-row">
          <span className="single-circuit-footer-label">Total a abonar en caja:</span>
          <span className="single-circuit-footer-total">
            ${totalOptimo.toLocaleString('es-AR')}
          </span>
        </div>
        {totalAhorrado > 0 && (
          <p className="single-circuit-savings-badge">
            Ahorro estimado conseguido: <strong>${totalAhorrado.toLocaleString('es-AR')}</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default SingleStoreCircuitCard;

