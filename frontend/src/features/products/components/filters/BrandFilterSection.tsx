import React, { useState, useMemo } from 'react';
import { Bookmark, Search, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterAccordion } from './FilterAccordion';

interface BrandFilterSectionProps {
  availableMarcas: string[];
  selectedMarca: string | 'all';
  onSelectMarca: (marca: string | 'all') => void;
  loading?: boolean;
}

const INITIAL_VISIBLE_COUNT = 6;

export const BrandFilterSection: React.FC<BrandFilterSectionProps> = ({
  availableMarcas,
  selectedMarca,
  onSelectMarca,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredMarcas = useMemo(() => {
    if (!searchQuery.trim()) return availableMarcas;
    const query = searchQuery.toLowerCase().trim();
    return availableMarcas.filter((marca) =>
      marca.toLowerCase().includes(query)
    );
  }, [availableMarcas, searchQuery]);

  const displayedMarcas = useMemo(() => {
    if (isExpanded || searchQuery.trim().length > 0) {
      return filteredMarcas;
    }
    return filteredMarcas.slice(0, INITIAL_VISIBLE_COUNT);
  }, [filteredMarcas, isExpanded, searchQuery]);

  const hasMore =
    !searchQuery.trim() && filteredMarcas.length > INITIAL_VISIBLE_COUNT;
  const remainingCount = filteredMarcas.length - INITIAL_VISIBLE_COUNT;
  const activeCount = selectedMarca !== 'all' ? 1 : 0;

  return (
    <FilterAccordion
      id="filter-marcas"
      title="Marcas"
      icon={<Bookmark size={16} />}
      badge={activeCount > 0 ? activeCount : undefined}
      defaultOpen={true}
    >
      <div className="filter-brand-section">
        {/* Quick brand search input */}
        <div className="filter-inner-search">
          <Search size={14} className="filter-inner-search-icon" />
          <input
            type="text"
            className="filter-inner-search-input"
            placeholder="Buscar marca..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="filter-inner-search-clear"
              onClick={() => setSearchQuery('')}
              title="Borrar búsqueda de marca"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Brands list */}
        <div className="filter-brand-list">
          {!searchQuery && (
            <label
              className={`filter-checkbox-item ${
                selectedMarca === 'all' ? 'active' : ''
              }`}
            >
              <input
                type="radio"
                name="marca-filter"
                checked={selectedMarca === 'all'}
                onChange={() => onSelectMarca('all')}
                className="filter-native-radio"
              />
              <span className="filter-custom-radio">
                {selectedMarca === 'all' && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="filter-item-label">Todas las marcas</span>
            </label>
          )}

          {loading ? (
            <div className="filter-loading-skeleton">
              <div className="filter-skeleton-line" />
              <div className="filter-skeleton-line" />
              <div className="filter-skeleton-line" />
            </div>
          ) : displayedMarcas.length === 0 ? (
            <div className="filter-empty-state">
              <span>No se encontraron marcas</span>
            </div>
          ) : (
            displayedMarcas.map((marca) => {
              const isSelected = selectedMarca === marca;
              return (
                <label
                  key={marca}
                  className={`filter-checkbox-item ${isSelected ? 'active' : ''}`}
                >
                  <input
                    type="radio"
                    name="marca-filter"
                    checked={isSelected}
                    onChange={() => onSelectMarca(marca)}
                    className="filter-native-radio"
                  />
                  <span className="filter-custom-radio">
                    {isSelected && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="filter-item-label" title={marca}>
                    {marca}
                  </span>
                </label>
              );
            })
          )}
        </div>

        {/* Show more / show less toggle */}
        {hasMore && (
          <button
            type="button"
            className="filter-expand-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? (
              <>
                <ChevronUp size={14} />
                <span>Ver menos</span>
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                <span>Ver más ({remainingCount})</span>
              </>
            )}
          </button>
        )}
      </div>
    </FilterAccordion>
  );
};

export default BrandFilterSection;
