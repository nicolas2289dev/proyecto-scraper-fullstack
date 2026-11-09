import React from 'react';
import { Check } from 'lucide-react';
import type { ProductoOptimo } from '../types/lists.types';

interface StoreCircuitChecklistProps {
  supermercadoId: number;
  productos: ProductoOptimo[];
  isItemChecked: (supermercadoId: number, productoId: number) => boolean;
  onToggleItem: (supermercadoId: number, productoId: number) => void;
}

export const StoreCircuitChecklist: React.FC<StoreCircuitChecklistProps> = ({
  supermercadoId,
  productos,
  isItemChecked,
  onToggleItem,
}) => {
  if (productos.length === 0) {
    return <p className="circuit-checklist-empty">No hay productos asignados a esta parada.</p>;
  }

  return (
    <ul className="circuit-checklist" aria-label="Lista de productos para esta parada">
      {productos.map((producto) => {
        const checked = isItemChecked(supermercadoId, producto.productoId);

        return (
          <li
            key={producto.productoId}
            className={`circuit-checklist-item ${checked ? 'checked' : ''}`}
            onClick={() => onToggleItem(supermercadoId, producto.productoId)}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onToggleItem(supermercadoId, producto.productoId);
              }
            }}
          >
            <div className="circuit-checkbox-wrap" aria-hidden="true">
              <div className={`circuit-checkbox ${checked ? 'checked' : ''}`}>
                {checked && <Check size={16} strokeWidth={3} className="text-white" />}
              </div>
            </div>

            <div className="circuit-item-details">
              <div className="circuit-item-main-row">
                <span className={`circuit-item-name ${checked ? 'line-through' : ''}`}>
                  {producto.productoNombre}
                </span>
                <span className="circuit-item-subtotal">
                  ${producto.subtotal.toLocaleString('es-AR')}
                </span>
              </div>

              <div className="circuit-item-sub-row">
                <span className="circuit-item-brand">{producto.marca || 'Sin marca'}</span>
                <span className="circuit-item-qty">
                  Cantidad: <strong>{producto.cantidad}</strong> (${producto.precioUnitario?.toLocaleString('es-AR')} c/u)
                </span>
                {checked && (
                  <span className="circuit-item-done-tag">
                    En el carrito
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default StoreCircuitChecklist;

