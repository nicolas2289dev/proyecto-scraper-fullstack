import React, { useState, useMemo } from 'react';
import { Check, ShoppingCart, Lightbulb, Package } from 'lucide-react';
import type { TiendaOptima, ItemLista } from '../types/lists.types';
import type { CircuitProgress } from '../hooks/useShoppingCircuitProgress';
import { SupermarketBadge } from './SupermarketBadge';

interface ShoppingCircuitChecklistProps {
  hojaDeRuta: TiendaOptima[];
  listItems?: ItemLista[];
  totalAhorrado: number;
  isItemChecked: (supermercadoId: number, productoId: number) => boolean;
  toggleItem: (supermercadoId: number, productoId: number) => void;
  progress: CircuitProgress;
}

export const ShoppingCircuitChecklist: React.FC<ShoppingCircuitChecklistProps> = ({
  hojaDeRuta,
  listItems,
  totalAhorrado,
  isItemChecked,
  toggleItem,
  progress,
}) => {
  // Filtro opcional por supermercado cuando hay múltiples paradas
  const [selectedStoreId, setSelectedStoreId] = useState<number | 'all'>('all');

  // Mapa de imágenes por productoId
  const imagesMap = useMemo(() => {
    const map = new Map<number, string | undefined>();
    if (listItems) {
      for (const item of listItems) {
        if (item.urlImagen) {
          map.set(item.productoId, item.urlImagen);
        }
      }
    }
    return map;
  }, [listItems]);

  // Lista aplanada de todos los productos del circuito con referencia a su supermercado
  const allProducts = useMemo(() => {
    return hojaDeRuta.flatMap((store) =>
      store.productos.map((producto) => ({
        ...producto,
        supermercadoId: store.supermercadoId,
        supermercadoNombre: store.supermercadoNombre,
      }))
    );
  }, [hojaDeRuta]);

  const filteredProducts = useMemo(() => {
    if (selectedStoreId === 'all') return allProducts;
    return allProducts.filter((p) => p.supermercadoId === selectedStoreId);
  }, [allProducts, selectedStoreId]);

  const nombresTiendas = useMemo(() => {
    return hojaDeRuta.map((s) => s.supermercadoNombre).join(' y ');
  }, [hojaDeRuta]);

  return (
    <div className="opt-checklist-wrapper">
      {/* Cabecera de la lista de compras con progreso interactivo */}
      <div className="opt-checklist-header">
        <h3 className="opt-checklist-title">Tu lista de compras</h3>

        <div className="opt-checklist-progress-wrap">
          <span className="opt-checklist-progress-text">
            {progress.checkedItemsCount} de {progress.totalItems} productos en el carrito •{' '}
            {progress.percentage}%
          </span>
          <div className="opt-checklist-progress-bar-track">
            <div
              className="opt-checklist-progress-bar-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Píldoras de filtro por tienda si es compra multitienda */}
      {hojaDeRuta.length > 1 && (
        <div className="opt-checklist-filters" role="tablist" aria-label="Filtrar por tienda">
          <button
            type="button"
            className={`opt-filter-pill ${selectedStoreId === 'all' ? 'opt-filter-pill--active' : ''}`}
            onClick={() => setSelectedStoreId('all')}
          >
            Todos ({allProducts.length})
          </button>
          {hojaDeRuta.map((store) => (
            <button
              key={store.supermercadoId}
              type="button"
              className={`opt-filter-pill ${
                selectedStoreId === store.supermercadoId ? 'opt-filter-pill--active' : ''
              }`}
              onClick={() => setSelectedStoreId(store.supermercadoId)}
            >
              <SupermarketBadge name={store.supermercadoNombre} size={16} />
              <span>{store.supermercadoNombre}</span>
              <span className="opt-filter-count">({store.productos.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Tabla / Lista de productos optimizados */}
      <div className="opt-checklist-table" role="list">
        {filteredProducts.map((p) => {
          const checked = isItemChecked(p.supermercadoId, p.productoId);
          const imageUrl = imagesMap.get(p.productoId);

          return (
            <div
              key={`${p.supermercadoId}_${p.productoId}`}
              className={`opt-checklist-row ${checked ? 'opt-checklist-row--checked' : ''}`}
              role="listitem"
            >
              {/* Checkbox custom */}
              <button
                type="button"
                className={`opt-checkbox ${checked ? 'opt-checkbox--checked' : ''}`}
                onClick={() => toggleItem(p.supermercadoId, p.productoId)}
                aria-label={`Marcar ${p.productoNombre} como ${checked ? 'pendiente' : 'en el carrito'}`}
              >
                {checked && <Check size={14} strokeWidth={3} />}
              </button>

              {/* Imagen miniatura del producto */}
              <div className="opt-item-thumb">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={p.productoNombre}
                    className="opt-item-img"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Package className="opt-item-placeholder-icon" size={20} />
                )}
              </div>

              {/* Nombre y datos del producto */}
              <div className="opt-item-info">
                <span className="opt-item-name">
                  {p.productoNombre}
                  {p.cantidad > 1 && (
                    <span className="opt-item-qty"> (x{p.cantidad})</span>
                  )}
                </span>
              </div>

              {/* Logo oficial y nombre de la cadena */}
              <div className="opt-item-store">
                <SupermarketBadge name={p.supermercadoNombre} size={22} />
                <span className="opt-item-store-name">{p.supermercadoNombre}</span>
              </div>

              {/* Precio / Subtotal */}
              <div className="opt-item-price">
                <span>${p.subtotal.toLocaleString('es-AR')}</span>
              </div>

              {/* Botón de acción rápida: 'En el carrito' vs 'Agregar al carrito' */}
              <div className="opt-item-action">
                {checked ? (
                  <button
                    type="button"
                    className="opt-btn-cart opt-btn-cart--checked"
                    onClick={() => toggleItem(p.supermercadoId, p.productoId)}
                    title="En el carrito (clic para desmarcar)"
                  >
                    <span>En el carrito</span>
                    <Check size={14} strokeWidth={2.5} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="opt-btn-cart opt-btn-cart--add"
                    onClick={() => toggleItem(p.supermercadoId, p.productoId)}
                    title="Agregar"
                  >
                    <ShoppingCart size={14} />
                    <span>Agregar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip de ahorro al pie de la tarjeta izquierda */}
      <div className="opt-tip-banner">
        <Lightbulb className="opt-tip-icon" size={22} />
        <p className="opt-tip-text">
          Tip: Completá tu compra en {nombresTiendas} y{' '}
          <span className="opt-tip-highlight">
            ahorrá ${totalAhorrado.toLocaleString('es-AR')}
          </span>{' '}
          en comparación con otras opciones.
        </p>
      </div>
    </div>
  );
};

