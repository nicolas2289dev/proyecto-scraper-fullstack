import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';

export interface ProductPaginationProps {
  page: number; // 0-indexed
  totalPages: number;
  pageSize?: number;
  onPageChange: (newPage: number) => void;
  disabled?: boolean;
}

export const ProductPagination: React.FC<ProductPaginationProps> = ({
  page,
  totalPages,
  pageSize = 12,
  onPageChange,
  disabled = false,
}) => {
  if (totalPages <= 1) return null;

  // Generación de ventana deslizante de páginas (0-indexed)
  const visiblePages = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];

    // Cerca del inicio: 0, 1, 2, 3 ... totalPages - 1
    if (page <= 2) {
      for (let i = 0; i <= 3; i++) {
        pages.push(i);
      }
      pages.push('ellipsis-end');
      pages.push(totalPages - 1);
      return pages;
    }

    // Cerca del final: 0 ... totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1
    if (page >= totalPages - 3) {
      pages.push(0);
      pages.push('ellipsis-start');
      for (let i = totalPages - 4; i < totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // En el centro: 0 ... page - 1, page, page + 1 ... totalPages - 1
    pages.push(0);
    pages.push('ellipsis-start');
    pages.push(page - 1);
    pages.push(page);
    pages.push(page + 1);
    pages.push('ellipsis-end');
    pages.push(totalPages - 1);
    return pages;
  }, [page, totalPages]);

  return (
    <nav className="pagination-wrapper" aria-label="Paginación de catálogo de productos">
      {/* Dock flotante de navegación */}
      <div className="pagination-dock" role="toolbar" aria-label="Controles de navegación de página">
        {/* Botón Ir a primera página */}
        <button
          type="button"
          onClick={() => onPageChange(0)}
          disabled={page === 0 || disabled}
          className="pagination-nav-btn icon-only"
          aria-label="Primera página"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0 || disabled}
          className="pagination-nav-btn"
          aria-label="Página anterior"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="pagination-nav-label">Anterior</span>
        </button>

        <span className="pagination-divider" aria-hidden="true" />

        {/* Lista de números de página */}
        <ul className="pagination-pages-list" role="list">
          {visiblePages.map((item, idx) => {
            if (item === 'ellipsis-start') {
              return (
                <li key={`ellipsis-start-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onPageChange(Math.max(0, page - 3))}
                    disabled={disabled}
                    className="pagination-ellipsis"
                    title="Retroceder 3 páginas"
                    aria-label="Retroceder 3 páginas"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </li>
              );
            }

            if (item === 'ellipsis-end') {
              return (
                <li key={`ellipsis-end-${idx}`}>
                  <button
                    type="button"
                    onClick={() => onPageChange(Math.min(totalPages - 1, page + 3))}
                    disabled={disabled}
                    className="pagination-ellipsis"
                    title="Avanzar 3 páginas"
                    aria-label="Avanzar 3 páginas"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </li>
              );
            }

            const pageNum = item;
            const isActive = page === pageNum;

            return (
              <li key={`page-${pageNum}`}>
                <button
                  type="button"
                  onClick={() => onPageChange(pageNum)}
                  disabled={disabled}
                  className={`pagination-num-btn ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Página ${pageNum + 1}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="paginationActivePill"
                      className="pagination-active-indicator"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="pagination-num-text">{pageNum + 1}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <span className="pagination-divider" aria-hidden="true" />

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1 || disabled}
          className="pagination-nav-btn"
          aria-label="Página siguiente"
          title="Página siguiente"
        >
          <span className="pagination-nav-label">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Botón Ir a última página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages - 1)}
          disabled={page >= totalPages - 1 || disabled}
          className="pagination-nav-btn icon-only"
          aria-label="Última página"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
};

export default ProductPagination;
