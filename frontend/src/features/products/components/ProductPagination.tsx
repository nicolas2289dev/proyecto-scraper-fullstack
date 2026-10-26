import React from 'react';

interface ProductPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}) => {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginación de productos">
      <button
        type="button"
        className="btn btn-secondary pagination-btn"
        disabled={page === 0 || disabled}
        onClick={() => onPageChange(page - 1)}
      >
        ← Anterior
      </button>
      <span className="pagination-info">
        Página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        className="btn btn-secondary pagination-btn"
        disabled={page >= totalPages - 1 || disabled}
        onClick={() => onPageChange(page + 1)}
      >
        Siguiente →
      </button>
    </nav>
  );
};

export default ProductPagination;
