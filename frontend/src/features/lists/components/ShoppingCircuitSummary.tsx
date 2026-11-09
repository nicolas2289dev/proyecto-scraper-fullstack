import React from 'react';
import { MapPin } from 'lucide-react';
import type { RouteStop, TiendaOptima } from '../types/lists.types';
import { SupermarketBadge } from './SupermarketBadge';

interface ShoppingCircuitSummaryProps {
  totalItems: number;
  totalOptimo: number;
  totalAhorrado: number;
  totalMasCaro: number;
  hojaDeRuta?: TiendaOptima[];
  orderedStops?: RouteStop[];
  totalDistanceKm?: number;
  totalDurationMin?: number;
  onOpenMapModal: () => void;
}

export const ShoppingCircuitSummary: React.FC<ShoppingCircuitSummaryProps> = ({
  totalOptimo,
  totalAhorrado,
  totalMasCaro,
  hojaDeRuta = [],
  orderedStops,
  totalDistanceKm,
  totalDurationMin,
  onOpenMapModal,
}) => {
  const storesToRender =
    orderedStops && orderedStops.length > 0
      ? orderedStops.map((s) => ({
          tienda: s.tienda,
          stopNumber: s.orden,
          branchName: s.sucursal.nombreSucursal,
          legKm: s.distanciaDesdeAnteriorKm,
        }))
      : hojaDeRuta.map((tienda, idx) => ({
          tienda,
          stopNumber: idx + 1,
          branchName: undefined,
          legKm: undefined,
        }));

  return (
    <div className="opt-card opt-card--summary-v2">
      {/* Título de la tarjeta */}
      <h3 className="opt-summary-v2-title">Resumen de tu compra</h3>

      {/* Lista / Desglose por supermercado en orden óptimo de parada */}
      <div className="opt-summary-v2-stores-list">
        {storesToRender.map(({ tienda, stopNumber, branchName, legKm }) => {
          const count = tienda.productos.length;
          return (
            <div key={tienda.supermercadoId} className="opt-summary-v2-store-row">
              <div className="opt-summary-v2-store-info">
                <SupermarketBadge name={tienda.supermercadoNombre} size={26} />
                <div className="opt-summary-v2-store-meta">
                  <span className="opt-summary-v2-store-name">
                    {storesToRender.length > 1 ? `${stopNumber}° ` : ''}
                    {tienda.supermercadoNombre} ({count} {count === 1 ? 'producto' : 'productos'})
                  </span>
                  {branchName && (
                    <span className="opt-summary-v2-branch-hint">
                      {branchName}
                      {legKm !== undefined
                        ? stopNumber === 1
                          ? ` • a ${legKm} km de tu punto de partida`
                          : ` • a ${legKm} km de parada ${stopNumber - 1}`
                        : ''}
                    </span>
                  )}
                </div>
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
        <span>
          Ver recorrido en mapa
        </span>
      </button>
    </div>
  );
};
