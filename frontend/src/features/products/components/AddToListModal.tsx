import React from 'react';
import type { ProductoBusqueda } from '../types/products.types';
import type { ListaCompra } from '@/features/lists';
import { formatNombreCompleto } from '../utils/formatters';

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductoBusqueda | null;
  modalMode: 'clasica' | 'compacta';
  selectedSupermarketId: number | string;
  onSelectSupermarket: (id: number | string) => void;
  listOptions: ListaCompra[];
  selectedListId: number | string;
  onSelectList: (id: number | string) => void;
  quantity: number;
  onQuantityChange: (qty: number) => void;
  onConfirm: () => void;
  adding: boolean;
  successMsg: string | null;
  onGoCreateList: () => void;
}

export const AddToListModal: React.FC<AddToListModalProps> = ({
  isOpen,
  onClose,
  product,
  modalMode,
  selectedSupermarketId,
  onSelectSupermarket,
  listOptions,
  selectedListId,
  onSelectList,
  quantity,
  onQuantityChange,
  onConfirm,
  adding,
  successMsg,
  onGoCreateList,
}) => {
  if (!isOpen || !product) return null;

  const modalTiendas =
    product.tiendas && product.tiendas.length > 0
      ? product.tiendas
      : [
          {
            productoId: product.id,
            supermercadoId:
              typeof selectedSupermarketId === 'number' ? selectedSupermarketId : 1,
            supermercadoNombre: product.nombreSupermercado,
            precio: product.precio,
            urlImagen: product.urlImagen,
          },
        ];

  const currentTienda =
    modalTiendas.find((t) => t.supermercadoId === selectedSupermarketId) ||
    modalTiendas[0];

  return (
    <div className="modal-overlay" onClick={() => !adding && onClose()}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Agregar a mi lista</h2>

        {modalMode === 'clasica' ? (
          <div className="modal-product-info">
            <img
              src={
                currentTienda.urlImagen ||
                product.urlImagen ||
                'https://via.placeholder.com/120?text=Producto'
              }
              alt={product.nombreGenerico}
              className="modal-product-img"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.dataset.fallback) {
                  target.dataset.fallback = '1';
                  target.src = 'https://via.placeholder.com/120x120.png?text=Producto';
                }
              }}
            />
            <div className="modal-store-details">
              <p className="modal-product-name">{formatNombreCompleto(product)}</p>
              <p className="modal-product-brand">
                {product.marca} ·{' '}
                <strong className="modal-super-name">
                  {currentTienda.supermercadoNombre || product.nombreSupermercado}
                </strong>
              </p>
              <p className="modal-product-price">
                $
                {Number(
                  currentTienda.precio ?? product.precio ?? 0
                ).toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        ) : (
          <div className="modal-stores-selection">
            <label className="label modal-selection-title">
              Seleccioná el supermercado:
            </label>
            <div className="modal-stores-list">
              {modalTiendas.map((t, idx) => {
                const isSelected = selectedSupermarketId === t.supermercadoId;
                return (
                  <div
                    key={t.supermercadoId || idx}
                    className={`modal-product-info modal-store-card ${
                      isSelected ? 'selected' : ''
                    }`}
                    onClick={() => onSelectSupermarket(t.supermercadoId)}
                  >
                    <div className="store-radio-container">
                      <input
                        type="radio"
                        name="selectedStore"
                        checked={isSelected}
                        onChange={() => onSelectSupermarket(t.supermercadoId)}
                      />
                    </div>
                    <img
                      src={
                        t.urlImagen ||
                        product.urlImagen ||
                        'https://via.placeholder.com/120?text=Producto'
                      }
                      alt={product.nombreGenerico}
                      className="modal-product-img"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.dataset.fallback) {
                          target.dataset.fallback = '1';
                          target.src =
                            'https://via.placeholder.com/120x120.png?text=Producto';
                        }
                      }}
                    />
                    <div className="modal-store-details">
                      <p className="modal-product-name">
                        {formatNombreCompleto(product)}
                      </p>
                      <p className="modal-product-brand">
                        {product.marca} ·{' '}
                        <strong className="modal-super-name">
                          {t.supermercadoNombre}
                        </strong>
                      </p>
                      <p className="modal-product-price">
                        ${Number(t.precio || 0).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="modal-fields">
          {listOptions.length === 0 ? (
            <div className="empty-lists-warning">
              <p>⚠️ Todavía no tenés listas creadas.</p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onGoCreateList}
              >
                Crear mi primera lista
              </button>
            </div>
          ) : (
            <>
              <div className="field">
                <label className="label">Lista destino</label>
                <select
                  className="input"
                  value={selectedListId}
                  onChange={(e) => onSelectList(e.target.value)}
                >
                  <option value="">Seleccioná una lista</option>
                  {listOptions.map((l) => (
                    <option key={l.id} value={String(l.id)}>
                      {l.favorita ? '⭐ ' : ''}
                      {l.nombreLista}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Cantidad</label>
                <input
                  type="number"
                  className="input"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    onQuantityChange(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>
            </>
          )}
        </div>

        {successMsg && <div className="modal-success">✅ {successMsg}</div>}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={adding}
          >
            Cancelar
          </button>
          {listOptions.length > 0 && (
            <button
              type="button"
              className="btn"
              onClick={onConfirm}
              disabled={adding || selectedListId === ''}
            >
              {adding ? 'Agregando...' : 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddToListModal;
