import React from 'react';
import { Store, Check } from 'lucide-react';
import type { Supermercado } from '@/shared/types';
import { FilterAccordion } from './FilterAccordion';

interface SupermarketFilterSectionProps {
  supermarkets: Supermercado[];
  selectedSupermarketId: number | 'all';
  onSelectSupermarket: (val: number | 'all') => void;
}

export const SupermarketFilterSection: React.FC<SupermarketFilterSectionProps> = ({
  supermarkets,
  selectedSupermarketId,
  onSelectSupermarket,
}) => {
  const activeCount = selectedSupermarketId !== 'all' ? 1 : 0;

  return (
    <FilterAccordion
      id="filter-supermarkets"
      title="Supermercados"
      icon={<Store size={16} />}
      badge={activeCount > 0 ? activeCount : undefined}
      defaultOpen={true}
    >
      <div className="filter-supermarket-list">
        <label
          className={`filter-checkbox-item ${
            selectedSupermarketId === 'all' ? 'active' : ''
          }`}
        >
          <input
            type="radio"
            name="supermarket-filter"
            checked={selectedSupermarketId === 'all'}
            onChange={() => onSelectSupermarket('all')}
            className="filter-native-radio"
          />
          <span className="filter-custom-radio">
            {selectedSupermarketId === 'all' && <Check size={12} strokeWidth={3} />}
          </span>
          <span className="filter-item-label">Todos los supermercados</span>
        </label>

        {supermarkets.map((s) => {
          const isSelected = selectedSupermarketId === s.id;
          return (
            <label
              key={s.id}
              className={`filter-checkbox-item ${isSelected ? 'active' : ''}`}
            >
              <input
                type="radio"
                name="supermarket-filter"
                checked={isSelected}
                onChange={() => onSelectSupermarket(s.id)}
                className="filter-native-radio"
              />
              <span className="filter-custom-radio">
                {isSelected && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="filter-item-label">{s.nombre}</span>
            </label>
          );
        })}
      </div>
    </FilterAccordion>
  );
};

export default SupermarketFilterSection;
