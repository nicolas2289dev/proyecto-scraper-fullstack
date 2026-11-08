import React from 'react';
import { Loader2, Rocket } from 'lucide-react';

interface OptimizePurchaseButtonProps {
  onClick: () => void;
  disabled?: boolean;
  optimizing?: boolean;
  itemCount?: number;
  className?: string;
}

/**
 * OptimizePurchaseButton
 *
 * Primary call to action for initiating purchase optimization.
 * Designed with a dynamic moving border beam (conic-gradient perimeter loop),
 * obsidian-glass surface, luminous emerald/cyan glow, and full WCAG accessibility.
 */
export const OptimizePurchaseButton: React.FC<OptimizePurchaseButtonProps> = ({
  onClick,
  disabled = false,
  optimizing = false,
  itemCount = 0,
  className = '',
}) => {
  const isDisabled = disabled || optimizing || itemCount === 0;

  return (
    <div
      className={`list-detail-optimize-wrapper ${isDisabled ? 'is-disabled' : ''} ${className}`}
    >
      {/* Outer ambient glow reflection that glides along with the moving beam */}
      {!isDisabled && (
        <div className="list-detail-optimize-ambient" aria-hidden="true">
          <div className="list-detail-optimize-ambient-beam" />
        </div>
      )}

      {/* Sharp moving border line track */}
      <div className="list-detail-optimize-track" aria-hidden="true">
        {!isDisabled && <div className="list-detail-optimize-beam" />}
      </div>

      {/* Core Interactive Button */}
      <button
        type="button"
        className="list-detail-btn-optimize"
        onClick={onClick}
        disabled={isDisabled}
        aria-busy={optimizing}
        aria-label={optimizing ? 'Optimizando compra...' : 'Optimizar compra'}
      >
        {optimizing ? (
          <>
            <Loader2
              size={16}
              className="list-detail-optimize-spinner"
              aria-hidden="true"
            />
            <span>Optimizando compra...</span>
          </>
        ) : (
          <>
            <Rocket
              size={19}
              className="list-detail-optimize-sparkle"
              aria-hidden="true"
            />
            <span>Optimizar compra</span>
          </>
        )}
      </button>
    </div>
  );
};

