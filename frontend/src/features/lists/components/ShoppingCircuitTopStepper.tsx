import React from 'react';
import { ShoppingCart, Store, CheckCircle2 } from 'lucide-react';

interface ShoppingCircuitTopStepperProps {
  totalProductos: number;
  nombresTiendas: string;
  paradasCount: number;
  isAllCompleted: boolean;
}

export const ShoppingCircuitTopStepper: React.FC<ShoppingCircuitTopStepperProps> = ({
  totalProductos,
  nombresTiendas,
  paradasCount,
  isAllCompleted,
}) => {
  return (
    <div className="opt-stepper" aria-label="Progreso del recorrido de compra">
      {/* Paso 1: Tu carrito */}
      <div className="opt-stepper-item opt-stepper-item--active">
        <div className="opt-stepper-circle opt-stepper-circle--glow">
          <span>1</span>
        </div>
        <ShoppingCart className="opt-stepper-icon opt-stepper-icon--green" size={24} />
        <div className="opt-stepper-info">
          <span className="opt-stepper-title">Tu carrito</span>
          <span className="opt-stepper-subtitle">{totalProductos} productos</span>
        </div>
      </div>

      {/* Conector 1 -> 2 (Siempre activo en esta vista) */}
      <div className="opt-stepper-line opt-stepper-line--active" />

      {/* Paso 2: Tu recorrido óptimo */}
      <div className="opt-stepper-item opt-stepper-item--active">
        <div className="opt-stepper-circle opt-stepper-circle--glow">
          <span>2</span>
        </div>
        <Store className="opt-stepper-icon opt-stepper-icon--green" size={24} />
        <div className="opt-stepper-info">
          <span className="opt-stepper-title">Tu recorrido óptimo</span>
          <span className="opt-stepper-subtitle">
            {paradasCount === 1
              ? `1 parada • ${nombresTiendas}`
              : `${paradasCount} paradas • ${nombresTiendas}`}
          </span>
        </div>
      </div>

      {/* Conector 2 -> 3 */}
      <div
        className={`opt-stepper-line ${
          isAllCompleted ? 'opt-stepper-line--active' : 'opt-stepper-line--inactive'
        }`}
      />

      {/* Paso 3: Compra completada */}
      <div
        className={`opt-stepper-item ${
          isAllCompleted ? 'opt-stepper-item--completed' : 'opt-stepper-item--pending'
        }`}
      >
        <div
          className={`opt-stepper-circle ${
            isAllCompleted ? 'opt-stepper-circle--glow' : 'opt-stepper-circle--muted'
          }`}
        >
          <span>3</span>
        </div>
        <CheckCircle2
          className={`opt-stepper-icon ${
            isAllCompleted ? 'opt-stepper-icon--green' : 'opt-stepper-icon--muted'
          }`}
          size={25}
        />
        <div className="opt-stepper-info">
          <span className="opt-stepper-title">Compra completada</span>
        </div>
      </div>
    </div>
  );
};

