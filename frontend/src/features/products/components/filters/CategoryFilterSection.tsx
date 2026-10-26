import React, { useEffect, useState } from 'react';
import { Tag, Check } from 'lucide-react';
import type { Categoria } from '../../types/products.types';
import { categoriaApi } from '../../api/categoriaApi';
import { FilterAccordion } from './FilterAccordion';

interface CategoryFilterSectionProps {
  selectedCategoryId: number | 'all';
  onSelectCategory: (categoryId: number | 'all') => void;
  categories?: Categoria[];
}

export const CategoryFilterSection: React.FC<CategoryFilterSectionProps> = ({
  selectedCategoryId,
  onSelectCategory,
  categories: propCategories,
}) => {
  const [categories, setCategories] = useState<Categoria[]>(propCategories || []);
  const [loading, setLoading] = useState(!propCategories || propCategories.length === 0);

  useEffect(() => {
    if (propCategories && propCategories.length > 0) {
      setCategories(propCategories);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    categoriaApi
      .getAll()
      .then((data) => {
        if (isMounted) {
          setCategories(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error cargando categorías para filtros:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [propCategories]);

  const activeCount = selectedCategoryId !== 'all' ? 1 : 0;

  return (
    <FilterAccordion
      id="filter-categories"
      title="Categorías"
      icon={<Tag size={16} />}
      badge={activeCount > 0 ? activeCount : undefined}
      defaultOpen={true}
    >
      <div className="filter-category-list">
        <label
          className={`filter-checkbox-item ${
            selectedCategoryId === 'all' ? 'active' : ''
          }`}
        >
          <input
            type="radio"
            name="category-filter"
            checked={selectedCategoryId === 'all'}
            onChange={() => onSelectCategory('all')}
            className="filter-native-radio"
          />
          <span className="filter-custom-radio">
            {selectedCategoryId === 'all' && <Check size={12} strokeWidth={3} />}
          </span>
          <span className="filter-item-label">Todas las categorías</span>
        </label>

        {loading ? (
          <div className="filter-loading-skeleton">
            <div className="filter-skeleton-line" />
            <div className="filter-skeleton-line" />
            <div className="filter-skeleton-line" />
          </div>
        ) : (
          categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <label
                key={cat.id}
                className={`filter-checkbox-item ${isSelected ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="category-filter"
                  checked={isSelected}
                  onChange={() => onSelectCategory(cat.id)}
                  className="filter-native-radio"
                />
                <span className="filter-custom-radio">
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="filter-item-label">{cat.nombre}</span>
              </label>
            );
          })
        )}
      </div>
    </FilterAccordion>
  );
};

export default CategoryFilterSection;
