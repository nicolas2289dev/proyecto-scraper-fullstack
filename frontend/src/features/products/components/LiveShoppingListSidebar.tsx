import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingCart,
  X,
  ShoppingBag,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth';
import type { ItemLista, ListaCompraDetalle } from '@/features/lists';
import { getSupermarketLogo } from '../utils/supermarketLogos';
import '../styles/live-shopping-list.css';

export interface LiveShoppingListSidebarProps {
  activeList: ListaCompraDetalle | null;
  items: ItemLista[];
  itemsCount: number;
  totalUnitsCount: number;
  totalEstimado: number;
  loading: boolean;
  updatingItemId: number | null;
  isDrawerOpen: boolean;
  onOpenDrawer: () => void;
  onCloseDrawer: () => void;
  onIncrement: (item: ItemLista) => void;
  onDecrement: (item: ItemLista) => void;
  onRemove: (item: ItemLista) => void;
}

const MAX_VISIBLE_ITEMS = 3;

const formatItemTitle = (item: ItemLista): string => {
  return [item.productoNombre, item.varianteEspecifica, item.marca]
    .filter(Boolean)
    .join(' ');
};

const formatItemPresentation = (item: ItemLista): string => {
  if (item.pesoValor) {
    return `${item.pesoValor}${item.pesoUnidad ? ' ' + item.pesoUnidad : ''}`;
  }
  return item.marca || '';
};

export const LiveShoppingListSidebar: React.FC<LiveShoppingListSidebarProps> = ({
  activeList,
  items,
  itemsCount,
  totalUnitsCount,
  totalEstimado,
  loading,
  updatingItemId,
  isDrawerOpen,
  onOpenDrawer,
  onCloseDrawer,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);
  const hasMoreItems = items.length > MAX_VISIBLE_ITEMS;
  const remainingCount = items.length - MAX_VISIBLE_ITEMS;

  const handleGoToList = () => {
    onCloseDrawer();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (activeList?.id) {
      navigate(`/mis-listas/${activeList.id}`);
    } else {
      navigate('/mis-listas');
    }
  };

  const renderPanelBody = (showDrawerClose = false) => (
    <>
      {/* Encabezado: "Mi lista (N)" */}
      <div className="live-list-header">
        <h2 className="live-list-title">
          <span>Mi lista</span>
          <span className="live-list-count">({itemsCount})</span>
        </h2>
        {showDrawerClose && (
          <button
            type="button"
            className="live-list-drawer-close"
            onClick={onCloseDrawer}
            aria-label="Cerrar panel de lista"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Cuerpo de Ítems */}
      {loading ? (
        <div className="live-list-empty">
          <p className="live-list-empty-desc">Cargando tu lista...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="live-list-empty">
          <div className="live-list-empty-icon">
            <ShoppingBag size={20} />
          </div>
          <p className="live-list-empty-title">Tu lista está vacía</p>
          <p className="live-list-empty-desc">
            {isAuthenticated
              ? 'Agregá productos del catálogo para comparar precios y calcular tu ahorro.'
              : 'Iniciá sesión y agregá productos para armar tu lista inteligente.'}
          </p>
        </div>
      ) : (
        <div className="live-list-items">
          {visibleItems.map((item) => {
            const storeLogo = getSupermarketLogo(item.supermercadoNombre);
            const presentation = formatItemPresentation(item);
            const unitPrice = Number(item.precioUnitario || 0);
            const isUpdating = updatingItemId === item.id;

            return (
              <div
                key={item.id}
                className={`live-list-item ${isUpdating ? 'updating' : ''}`}
              >
                <div className="live-list-item-thumb-wrap">
                  <img
                    src={
                      item.urlImagen ||
                      'https://via.placeholder.com/100?text=Producto'
                    }
                    alt={item.productoNombre}
                    className="live-list-item-thumb"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = '1';
                        target.src =
                          'https://via.placeholder.com/100x100.png?text=Producto';
                      }
                    }}
                  />
                </div>

                <div className="live-list-item-body">
                  <div className="live-list-item-top">
                    <h4 className="live-list-item-name">
                      {formatItemTitle(item)}
                    </h4>
                    <button
                      type="button"
                      className="live-list-item-remove"
                      onClick={() => onRemove(item)}
                      title="Quitar de la lista"
                      aria-label={`Quitar ${item.productoNombre}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="live-list-item-meta">
                    {presentation && (
                      <span className="live-list-item-unit">{presentation}</span>
                    )}
                    {presentation && <span className="live-list-meta-dot">·</span>}
                    <div className="live-list-item-store">
                      {storeLogo && (
                        <img
                          src={storeLogo.logoUrl}
                          alt={storeLogo.alt}
                          className="live-list-item-store-logo"
                        />
                      )}
                      {/* <span className="live-list-item-store-name">
                        {item.supermercadoNombre || 'Supermercado'}
                      </span> */}
                    </div>
                  </div>

                  <div className="live-list-qty-row">
                    <div className="live-list-qty-stepper">
                      <button
                        type="button"
                        className="live-list-qty-btn"
                        onClick={() => onDecrement(item)}
                        disabled={(item.cantidad || 1) <= 1 || isUpdating}
                        aria-label="Disminuir cantidad"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="live-list-qty-value">
                        {item.cantidad || 1}
                      </span>
                      <button
                        type="button"
                        className="live-list-qty-btn"
                        onClick={() => onIncrement(item)}
                        disabled={isUpdating}
                        aria-label="Aumentar cantidad"
                      >
                        <Plus size={11} />
                      </button>
                    </div>
                    <span className="live-list-item-price">
                      $ {unitPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {hasMoreItems && (
            <button
              type="button"
              className="live-list-more-indicator"
              onClick={handleGoToList}
              title="Ver mi lista completa"
              aria-label={`Ver ${remainingCount} productos más en mi lista`}
            >
              <span>
                +{remainingCount} {remainingCount === 1 ? 'producto más' : 'productos más'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Resumen de Total Estimado */}
      <div className="live-list-summary">
        <span className="live-list-summary-label">
          Total estimado ({itemsCount}{' '}
          {itemsCount === 1 ? 'producto' : 'productos'})
        </span>
        <span className="live-list-summary-total">
          $ {totalEstimado.toLocaleString('es-AR')}
        </span>
      </div>

      {/* Botón Principal Verde -> /mis-listas/:id */}
      <button
        type="button"
        className="live-list-cta-btn"
        onClick={handleGoToList}
      >
        <ShoppingCart size={18} />
        <span>Ver mi lista</span>
      </button>
    </>
  );

  return (
    <>
      {/* Columna Desktop (> 1280px) */}
      <aside className="live-list-card" aria-label="Panel lateral Mi lista">
        {renderPanelBody(false)}
      </aside>

      {/* Botón Flotante para Resoluciones <= 1280px */}
      <button
        type="button"
        className="live-list-fab"
        onClick={onOpenDrawer}
        aria-label="Abrir Mi lista"
      >
        <ShoppingCart size={18} />
        <span>Mi lista ({totalUnitsCount})</span>
        <span className="live-list-fab-total">
          $ {totalEstimado.toLocaleString('es-AR')}
        </span>
      </button>

      {/* Drawer Lateral para Resoluciones <= 1280px */}
      {isDrawerOpen && (
        <div
          className="live-list-drawer-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCloseDrawer();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Drawer Mi lista"
        >
          <div className="live-list-drawer-panel">{renderPanelBody(true)}</div>
        </div>
      )}
    </>
  );
};

export default LiveShoppingListSidebar;

