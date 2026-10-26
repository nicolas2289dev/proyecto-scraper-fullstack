import React from 'react';
import { Sparkles, Percent } from 'lucide-react';
import { FilterAccordion } from './FilterAccordion';

interface DiscountFilterSectionProps {
  onlyDiscount: boolean;
  onToggleDiscount: (val: boolean) => void;
}

export const DiscountFilterSection: React.FC<DiscountFilterSectionProps> = ({
  onlyDiscount,
  onToggleDiscount,
}) => {
  return (
    <FilterAccordion
      id="filter-discounts"
      title="Ofertas y Descuentos"
      icon={<Percent size={16} />}
      badge={onlyDiscount ? 1 : undefined}
      defaultOpen={true}
    >
      <div className="filter-discount-container">
        <label
          className={`filter-discount-toggle-card ${
            onlyDiscount ? 'active' : ''
          }`}
        >
          <div className="filter-discount-info">
            <span className="filter-discount-icon-wrap">
              <Sparkles size={16} className="filter-discount-sparkle" />
            </span>
            <div className="filter-discount-text">
              <span className="filter-discount-title">Solo con descuento</span>
              <span className="filter-discount-desc">
                Ver únicamente productos en promoción
              </span>
            </div>
          </div>

          <div className="filter-switch-wrapper">
            <input
              type="checkbox"
              checked={onlyDiscount}
              onChange={(e) => onToggleDiscount(e.target.checked)}
              className="filter-switch-input"
            />
            <span className="filter-switch-slider" />
          </div>
        </label>
      </div>
    </FilterAccordion>
  );
};

export default DiscountFilterSection;
