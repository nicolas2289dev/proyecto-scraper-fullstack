import React, { useMemo } from 'react';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import type { Supermercado } from '@/shared/types';
import { CategoryFilterSection } from './filters/CategoryFilterSection';
import { BrandFilterSection } from './filters/BrandFilterSection';
import { PriceSortFilterSection } from './filters/PriceSortFilterSection';
import { SupermarketFilterSection } from './filters/SupermarketFilterSection';
import { DiscountFilterSection } from './filters/DiscountFilterSection';
import { FilterDrawer } from './filters/FilterDrawer';
import '../styles/product-filters.css';

export interface ProductFiltersProps {
  selectedCategoryId: number | 'all';
  onCategoryChange: (categoryId: number | 'all') => void;
  availableMarcas: string[];
  filterMarca: string | 'all';
  onMarcaChange: (marca: string | 'all') => void;
  supermarkets: Supermercado[];
  filterSupermarket: number | 'all';
  onSupermarketChange: (supermarketId: number | 'all') => void;
  minPrice: string;
  maxPrice: string;
  onMinPriceChange: (val: string) => void;
  onMaxPriceChange: (val: string) => void;
  sortOrder: 'default' | 'asc' | 'desc';
  onSortOrderChange: (val: 'default' | 'asc' | 'desc') => void;
  onlyDiscount: boolean;
  onDiscountToggle: (val: boolean) => void;
  onClearFilters: () => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
  onApplyMobileFilters?: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  selectedCategoryId,
  onCategoryChange,
  availableMarcas,
  filterMarca,
  onMarcaChange,
  supermarkets,
  filterSupermarket,
  onSupermarketChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  sortOrder,
  onSortOrderChange,
  onlyDiscount,
  onDiscountToggle,
  onClearFilters,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer = () => {},
  onApplyMobileFilters = () => {},
}) => {
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategoryId !== 'all') count++;
    if (filterMarca !== 'all') count++;
    if (filterSupermarket !== 'all') count++;
    if (sortOrder !== 'default') count++;
    if (minPrice !== '' || maxPrice !== '') count++;
    if (onlyDiscount) count++;
    return count;
  }, [
    selectedCategoryId,
    filterMarca,
    filterSupermarket,
    sortOrder,
    minPrice,
    maxPrice,
    onlyDiscount,
  ]);

  const filterSections = (
    <div className="product-filters-sections">
      <CategoryFilterSection
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={onCategoryChange}
      />

      <BrandFilterSection
        availableMarcas={availableMarcas}
        selectedMarca={filterMarca}
        onSelectMarca={onMarcaChange}
      />

      <PriceSortFilterSection
        minPrice={minPrice}
        maxPrice={maxPrice}
        onMinPriceChange={onMinPriceChange}
        onMaxPriceChange={onMaxPriceChange}
        sortOrder={sortOrder}
        onSortOrderChange={onSortOrderChange}
      />

      <SupermarketFilterSection
        supermarkets={supermarkets}
        selectedSupermarketId={filterSupermarket}
        onSelectSupermarket={onSupermarketChange}
      />

      <DiscountFilterSection
        onlyDiscount={onlyDiscount}
        onToggleDiscount={onDiscountToggle}
      />
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside
        className="product-filters-sidebar"
        aria-label="Panel de filtros de productos"
      >
        <div className="product-filters-header">
          <div className="product-filters-title-group">
            <SlidersHorizontal size={18} className="product-filters-main-icon" />
            <h2 className="product-filters-title">Filtros</h2>
            {activeFiltersCount > 0 && (
              <span className="filter-badge-pill" title="Filtros activos">
                {activeFiltersCount}
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="product-filters-clear-btn"
              onClick={onClearFilters}
              title="Restablecer todos los filtros"
            >
              <RotateCcw size={13} />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        <div className="product-filters-body">{filterSections}</div>
      </aside>

      {/* Mobile / Tablet Drawer */}
      <FilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={onCloseMobileDrawer}
        onApply={onApplyMobileFilters}
        onClear={onClearFilters}
        activeCount={activeFiltersCount}
      >
        {filterSections}
      </FilterDrawer>
    </>
  );
};

export default ProductFilters;
