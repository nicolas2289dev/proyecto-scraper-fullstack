import React, { useRef, useEffect } from 'react';
import type { Supermercado } from '@/shared/types';

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  supermarkets: Supermercado[];
  filterSupermarket: number | 'all';
  onSupermarketChange: (value: number | 'all') => void;
  availableMarcas: string[];
  filterMarca: string | 'all';
  onMarcaChange: (value: string | 'all') => void;
  sortOrder: 'default' | 'asc' | 'desc';
  onSortOrderChange: (value: 'default' | 'asc' | 'desc') => void;
  hasSearched: boolean;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  onSearchChange,
  supermarkets,
  filterSupermarket,
  onSupermarketChange,
  availableMarcas,
  filterMarca,
  onMarcaChange,
  sortOrder,
  onSortOrderChange,
  hasSearched,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Garantiza el foco tras el montaje del componente en el DOM
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="controls-container">
      <div className="search-container">
        <input
          ref={searchInputRef}
          type="text"
          className="search-input"
          placeholder="Buscá por producto o marca (ej: Leche La Serenísima, Fideos Matarazzo)..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {hasSearched && (
        <div className="filters-bar">
          <div className="filter-group">
            <label>🏪 Supermercado:</label>
            <select
              value={filterSupermarket}
              onChange={(e) =>
                onSupermarketChange(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
            >
              <option value="all">Todos los supermercados</option>
              {supermarkets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>🏷️ Marca:</label>
            <select
              value={filterMarca}
              onChange={(e) => onMarcaChange(e.target.value)}
            >
              <option value="all">Todas las marcas</option>
              {availableMarcas.map((marca) => (
                <option key={marca} value={marca}>
                  {marca}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>💰 Orden:</label>
            <select
              value={sortOrder}
              onChange={(e) =>
                onSortOrderChange(e.target.value as 'default' | 'asc' | 'desc')
              }
            >
              <option value="default">Por defecto</option>
              <option value="asc">Precio: Menor a Mayor</option>
              <option value="desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
