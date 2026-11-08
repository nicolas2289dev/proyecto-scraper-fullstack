import React from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import type { CircuitProgress } from '../hooks/useShoppingCircuitProgress';

interface CircuitProgressBarProps {
  progress: CircuitProgress;
  onReset?: () => void;
}

export const CircuitProgressBar: React.FC<CircuitProgressBarProps> = ({ progress, onReset }) => {
  const { totalItems, checkedItemsCount, percentage, isAllCompleted } = progress;

  if (totalItems === 0) return null;

  return (
    <div className="circuit-progress-card">
      <div className="circuit-progress-header">
        <div className="circuit-progress-title-wrap">
          {isAllCompleted ? (
            <span className="circuit-progress-badge completed">
              <CheckCircle2 size={16} />
              <span>¡Circuito completado!</span>
            </span>
          ) : (
            <span className="circuit-progress-badge in-progress">
              <span>En progreso</span>
            </span>
          )}
          <span className="circuit-progress-text">
            <strong>{checkedItemsCount}</strong> de <strong>{totalItems}</strong> productos en el carrito
          </span>
        </div>

        <div className="circuit-progress-actions">
          <span className="circuit-progress-percent">{percentage}%</span>
          {checkedItemsCount > 0 && onReset && (
            <button
              type="button"
              className="circuit-progress-reset-btn"
              onClick={onReset}
              title="Reiniciar checklist de compra"
              aria-label="Reiniciar checklist de compra"
            >
              <RotateCcw size={14} />
              <span>Reiniciar</span>
            </button>
          )}
        </div>
      </div>

      <div className="circuit-progress-bar-track" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={`circuit-progress-bar-fill ${isAllCompleted ? 'completed' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default CircuitProgressBar;

