import React from 'react';
import { ChevronDown, CheckCircle2, ShoppingBag } from 'lucide-react';
import type { TiendaOptima } from '../types/lists.types';
import type { StoreProgress } from '../hooks/useShoppingCircuitProgress';
import { StoreCircuitChecklist } from './StoreCircuitChecklist';
import { getSupermarketLogo } from '@/features/products';

interface StoreCircuitAccordionProps {
  stepNumber: number;
  tienda: TiendaOptima;
  isExpanded: boolean;
  isActiveStep: boolean;
  onToggleExpand: () => void;
  onActivateStep: () => void;
  isItemChecked: (supermercadoId: number, productoId: number) => boolean;
  onToggleItem: (supermercadoId: number, productoId: number) => void;
  progress: StoreProgress;
}

export const StoreCircuitAccordion: React.FC<StoreCircuitAccordionProps> = ({
  stepNumber,
  tienda,
  isExpanded,
  isActiveStep,
  onToggleExpand,
  onActivateStep,
  isItemChecked,
  onToggleItem,
  progress,
}) => {
  const logo = getSupermarketLogo(tienda.supermercadoNombre);
  const { total, checked, completed } = progress;

  const handleHeaderClick = () => {
    onActivateStep();
    onToggleExpand();
  };

  return (
    <div
      className={`circuit-store-card ${isExpanded ? 'expanded' : 'collapsed'} ${isActiveStep ? 'active-step' : ''} ${completed ? 'store-completed' : ''}`}
      id={`parada-${tienda.supermercadoId}`}
    >
      <div
        className="circuit-store-header"
        onClick={handleHeaderClick}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleHeaderClick();
          }
        }}
      >
        <div className="circuit-store-header-left">
          <span className={`circuit-step-badge ${completed ? 'completed' : isActiveStep ? 'active' : ''}`}>
            Paso {stepNumber}
          </span>

          <div className="circuit-store-identity">
            {logo ? (
              <img
                src={logo.logoUrl}
                alt={logo.alt}
                className="circuit-store-logo"
              />
            ) : (
              <ShoppingBag size={20} className="text-emerald-600 dark:text-emerald-400" />
            )}
            <h4 className="circuit-store-title">{tienda.supermercadoNombre}</h4>
          </div>
        </div>

        <div className="circuit-store-header-right">
          <div className="circuit-store-stats-pills">
            {completed ? (
              <span className="circuit-store-completed-pill">
                <CheckCircle2 size={14} />
                <span>Completada</span>
              </span>
            ) : (
              <span className="circuit-store-progress-pill">
                {checked}/{total} ítems
              </span>
            )}
            <span className="circuit-store-subtotal-pill">
              ${tienda.subtotalTienda.toLocaleString('es-AR')}
            </span>
          </div>

          <ChevronDown
            size={20}
            className={`circuit-store-chevron ${isExpanded ? 'rotated' : ''}`}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="circuit-store-body">
          <StoreCircuitChecklist
            supermercadoId={tienda.supermercadoId}
            productos={tienda.productos}
            isItemChecked={isItemChecked}
            onToggleItem={onToggleItem}
          />

          <div className="circuit-store-footer">
            <span className="circuit-store-footer-label">
              Total a pagar en {tienda.supermercadoNombre}:
            </span>
            <span className="circuit-store-footer-val">
              ${tienda.subtotalTienda.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreCircuitAccordion;

