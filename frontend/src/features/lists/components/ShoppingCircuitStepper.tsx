import React from 'react';
import { Check, ArrowRight, MapPin } from 'lucide-react';
import type { TiendaOptima } from '../types/lists.types';
import type { StoreProgress } from '../hooks/useShoppingCircuitProgress';
import { getSupermarketLogo } from '@/features/products';

interface ShoppingCircuitStepperProps {
  hojaDeRuta: TiendaOptima[];
  activeStep: number;
  onSelectStep: (stepIndex: number) => void;
  getStoreProgress: (supermercadoId: number) => StoreProgress;
}

export const ShoppingCircuitStepper: React.FC<ShoppingCircuitStepperProps> = ({
  hojaDeRuta,
  activeStep,
  onSelectStep,
  getStoreProgress,
}) => {
  if (hojaDeRuta.length <= 1) return null;

  return (
    <div className="circuit-stepper-container" aria-label="Secuencia de paradas del circuito">
      <div className="circuit-stepper-title-row">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-emerald-500" />
          <h3 className="circuit-stepper-title">Itinerario de Compra Sugerido</h3>
        </div>
        <span className="circuit-stepper-counter-pill">
          {hojaDeRuta.length} Paradas
        </span>
      </div>

      <div className="circuit-stepper-track">
        {hojaDeRuta.map((tienda, idx) => {
          const storeProg = getStoreProgress(tienda.supermercadoId);
          const isActive = idx === activeStep;
          const isCompleted = storeProg.completed;
          const logo = getSupermarketLogo(tienda.supermercadoNombre);
          const isLast = idx === hojaDeRuta.length - 1;

          return (
            <React.Fragment key={tienda.supermercadoId}>
              <button
                type="button"
                className={`circuit-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => onSelectStep(idx)}
                aria-current={isActive ? 'step' : undefined}
                title={`Ver parada ${idx + 1}: ${tienda.supermercadoNombre}`}
              >
                <div className="circuit-step-circle">
                  {isCompleted ? <Check size={16} strokeWidth={3} /> : <span>{idx + 1}</span>}
                </div>

                <div className="circuit-step-info">
                  <div className="circuit-step-super-row">
                    {logo && (
                      <img
                        src={logo.logoUrl}
                        alt={logo.alt}
                        className="circuit-step-logo"
                      />
                    )}
                    <span className="circuit-step-super-name">
                      {tienda.supermercadoNombre}
                    </span>
                  </div>
                  <div className="circuit-step-meta">
                    <span className="circuit-step-item-count">
                      {storeProg.checked}/{storeProg.total} comprados
                    </span>
                    <span className="circuit-step-price">
                      ${tienda.subtotalTienda.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              </button>

              {!isLast && (
                <div className={`circuit-step-divider ${isCompleted ? 'completed' : ''}`}>
                  <ArrowRight size={16} className="circuit-step-arrow" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ShoppingCircuitStepper;

