import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, RotateCcw } from 'lucide-react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear?: () => void;
  activeCount: number;
  children: React.ReactNode;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  onApply,
  onClear,
  activeCount,
  children,
}) => {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="filter-drawer-portal" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <motion.div
            className="filter-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            className="filter-drawer-panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="filter-drawer-header">
              <div className="filter-drawer-title-wrap">
                <SlidersHorizontal size={18} className="filter-drawer-header-icon" />
                <span className="filter-drawer-title">Filtros</span>
                {activeCount > 0 && (
                  <span className="filter-badge-pill">{activeCount}</span>
                )}
              </div>
              <button
                type="button"
                className="filter-drawer-close-btn"
                onClick={onClose}
                aria-label="Cerrar filtros"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="filter-drawer-body">{children}</div>

            {/* Footer with actions */}
            <div className="filter-drawer-footer">
              {onClear && (
                <button
                  type="button"
                  className="filter-drawer-clear-btn"
                  onClick={onClear}
                  disabled={activeCount === 0}
                >
                  <RotateCcw size={14} />
                  <span>Limpiar</span>
                </button>
              )}
              <button
                type="button"
                className="filter-drawer-apply-btn"
                onClick={onApply}
              >
                Aplicar filtros {activeCount > 0 ? `(${activeCount})` : ''}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FilterDrawer;
