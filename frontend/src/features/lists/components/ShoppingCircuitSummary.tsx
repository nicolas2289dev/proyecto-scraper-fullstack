import React from 'react';
import { MapPin } from 'lucide-react';
import type { TiendaOptima } from '../types/lists.types';
import { SupermarketBadge } from './SupermarketBadge';

interface ShoppingCircuitSummaryProps {
  totalItems: number;
  totalOptimo: number;
  totalAhorrado: number;
  totalMasCaro: number;
  hojaDeRuta?: TiendaOptima[];
  onOpenMapModal: () => void;
}

export const ShoppingCircuitSummary: React.FC<ShoppingCircuitSummaryProps> = ({
  totalOptimo,
  totalAhorrado,
  totalMasCaro,
  hojaDeRuta = [],
  onOpenMapModal,
}) => {
  return (
    <div className="opt-card opt-card--summary-v2">
      {/* Título de la tarjeta */}
      <h3 className="opt-summary-v2-title">Resumen de tu compra</h3>

      {/* Lista / Desglose por supermercado */}
      <div className="opt-summary-v2-stores-list">
        {hojaDeRuta.map((tienda) => {
          const count = tienda.productos.length;
          return (
            <div key={tienda.supermercadoId} className="opt-summary-v2-store-row">
              <div className="opt-summary-v2-store-info">
                <SupermarketBadge name={tienda.supermercadoNombre} size={26} />
                <span className="opt-summary-v2-store-name">
                  {tienda.supermercadoNombre} ({count} {count === 1 ? 'producto' : 'productos'})
                </span>
              </div>
              <span className="opt-summary-v2-store-subtotal">
                ${tienda.subtotalTienda.toLocaleString('es-AR')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tarjeta interior oscura con Total Estimado, precio original tachado y pill de ahorro */}
      <div className="opt-summary-v2-box">
        <span className="opt-summary-v2-box-label">Total estimado</span>
        <div className="opt-summary-v2-box-price">${totalOptimo.toLocaleString('es-AR')}</div>

        <div className="opt-summary-v2-box-bottom">
          {totalMasCaro > totalOptimo ? (
            <span className="opt-summary-v2-strikethrough">
              ${totalMasCaro.toLocaleString('es-AR')}
            </span>
          ) : (
            <span />
          )}

          {totalAhorrado > 0 && (
            <div className="opt-summary-v2-savings-pill">
              Ahorro: ${totalAhorrado.toLocaleString('es-AR')}
            </div>
          )}
        </div>
      </div>

      {/* Botón CTA: Ver recorrido en mapa */}
      <button
        type="button"
        className="opt-btn-cta-map"
        onClick={onOpenMapModal}
        aria-label="Ver recorrido en mapa interactivo"
      >
        <MapPin size={18} />
        <span>Ver recorrido en mapa</span>
      </button>
    </div>
  );
};
