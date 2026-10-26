import React from 'react';
import { DollarSign, ArrowDownUp, Check } from 'lucide-react';
import { FilterAccordion } from './FilterAccordion';

interface PriceSortFilterSectionProps {
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  sortOrder: 'default' | 'asc' | 'desc';
  onSortOrderChange: (value: 'default' | 'asc' | 'desc') => void;
}

export const PriceSortFilterSection: React.FC<PriceSortFilterSectionProps> = ({
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  sortOrder,
  onSortOrderChange,
}) => {
  const isPriceActive = minPrice !== '' || maxPrice !== '';
  const isSortActive = sortOrder !== 'default';
  const activeCount = (isPriceActive ? 1 : 0) + (isSortActive ? 1 : 0);

  const sortOptions: Array<{
    id: 'default' | 'asc' | 'desc';
    label: string;
    description: string;
  }> = [
    {
      id: 'default',
      label: 'Por defecto',
      description: 'Relevancia y orden alfabético',
    },
    {
      id: 'asc',
      label: 'Ordenar de menor a mayor',
      description: 'Precios más bajos primero',
    },
    {
      id: 'desc',
      label: 'Ordenar de mayor a menor',
      description: 'Precios más altos primero',
    },
  ];

  return (
    <FilterAccordion
      id="filter-price-sort"
      title="Precio y Orden"
      icon={<DollarSign size={16} />}
      badge={activeCount > 0 ? activeCount : undefined}
      defaultOpen={true}
    >
      <div className="filter-price-sort-container">
        {/* Price Range inputs */}
        <div className="filter-price-range-group">
          <span className="filter-subgroup-title">Rango de precio ($)</span>
          <div className="filter-price-inputs-row">
            <div className="filter-price-input-wrapper">
              <span className="filter-price-prefix">$</span>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="Mín"
                className="filter-price-input"
                value={minPrice}
                onChange={(e) => onMinPriceChange(e.target.value)}
              />
            </div>
            <span className="filter-price-separator">—</span>
            <div className="filter-price-input-wrapper">
              <span className="filter-price-prefix">$</span>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="Máx"
                className="filter-price-input"
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sort options */}
        <div className="filter-sort-group">
          <div className="filter-subgroup-title-row">
            <ArrowDownUp size={13} className="filter-subgroup-icon" />
            <span className="filter-subgroup-title">Criterio de orden</span>
          </div>

          <div className="filter-sort-options-list">
            {sortOptions.map((opt) => {
              const isSelected = sortOrder === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`filter-sort-option-card ${
                    isSelected ? 'active' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="price-sort-order"
                    checked={isSelected}
                    onChange={() => onSortOrderChange(opt.id)}
                    className="filter-native-radio"
                  />
                  <span className="filter-custom-radio">
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <div className="filter-sort-text">
                    <span className="filter-sort-label">{opt.label}</span>
                    <span className="filter-sort-desc">{opt.description}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </FilterAccordion>
  );
};

export default PriceSortFilterSection;
