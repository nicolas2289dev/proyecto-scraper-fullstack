import React from 'react';
import type { Supermercado } from '@/shared/types';
import type { ProductoBusqueda } from '../types/products.types';
import { ProductCard } from './ProductCard';

export interface ProductCatalogGridProps {
  products: ProductoBusqueda[];
  viewMode: 'clasica' | 'compacta';
  loading: boolean;
  supermarkets: Supermercado[];
  selectedSupermarketId?: number | 'all';
  onAdd: (product: ProductoBusqueda, preselectedSuperId?: number) => void;
}

export const ProductCatalogGrid: React.FC<ProductCatalogGridProps> = ({
  products,
  viewMode,
  loading,
  supermarkets,
  selectedSupermarketId = 'all',
  onAdd,
}) => {
  if (loading) {
    return (
      <div className="no-results-container">
        <div className="grid-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="no-results-container">
        <p className="no-results">
          No se encontraron productos que coincidan con tu búsqueda.
        </p>
      </div>
    );
  }

  const selectedSuperId =
    selectedSupermarketId !== 'all' ? Number(selectedSupermarketId) : null;

  return (
    <div className="product-grid">
      {viewMode === 'compacta'
        ? products.map((product) => (
            <ProductCard
              key={`compact-${product.id}`}
              mode="compacta"
              product={product}
              onAdd={onAdd}
            />
          ))
        : products.flatMap((product) => {
            const rawTiendas =
              product.tiendas && product.tiendas.length > 0
                ? product.tiendas
                : [
                    {
                      productoId: product.id,
                      supermercadoId:
                        supermarkets.find(
                          (s) =>
                            s.nombre.trim().toLowerCase() ===
                            product.nombreSupermercado?.trim().toLowerCase()
                        )?.id || 0,
                      supermercadoNombre: product.nombreSupermercado,
                      precio: product.precio,
                      urlImagen: product.urlImagen,
                    },
                  ];

            const tiendas = selectedSuperId
              ? rawTiendas.filter((t) => t.supermercadoId === selectedSuperId)
              : rawTiendas;

            return tiendas.map((t, idx) => (
              <ProductCard
                key={`classic-${product.id}-${t.supermercadoId || idx}`}
                mode="clasica"
                product={product}
                store={t}
                onAdd={onAdd}
              />
            ));
          })}
    </div>
  );
};
