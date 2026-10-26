import React from 'react';
import type { ProductoBusqueda } from '../types/products.types';
import { formatNombreCompleto } from '../utils/formatters';
import { getSupermarketLogo } from '../utils/supermarketLogos';

interface ProductCardCompactProps {
  mode: 'compacta';
  product: ProductoBusqueda;
  onAdd: (product: ProductoBusqueda) => void;
}

interface ProductCardClassicProps {
  mode: 'clasica';
  product: ProductoBusqueda;
  store: {
    supermercadoId: number;
    supermercadoNombre: string;
    precio: number;
    urlImagen?: string;
  };
  onAdd: (product: ProductoBusqueda, storeId: number) => void;
}

export type ProductCardProps = ProductCardCompactProps | ProductCardClassicProps;

export const ProductCard: React.FC<ProductCardProps> = (props) => {
  if (props.mode === 'compacta') {
    const { product, onAdd } = props;
    const tiendas =
      product.tiendas && product.tiendas.length > 0
        ? product.tiendas
        : [
            {
              productoId: product.id,
              supermercadoId: 0,
              supermercadoNombre: product.nombreSupermercado,
              precio: product.precio,
              urlImagen: product.urlImagen,
            },
          ];
    const cantTiendas = tiendas.length;

    return (
      <div className="product-card">
        <div className="product-image-container">
          <img
            src={product.urlImagen || 'https://via.placeholder.com/400?text=Producto'}
            alt={product.nombreGenerico}
            className="product-image"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.dataset.fallback) {
                target.dataset.fallback = '1';
                target.src = 'https://via.placeholder.com/400x400.png?text=Sin+imagen';
              }
            }}
          />
        </div>
        <div className="product-info">
          <div className="product-header">
            <span className="product-category">{product.marca || 'Sin marca'}</span>
          </div>
          <h3 className="product-name">{formatNombreCompleto(product)}</h3>

          <div className="product-stores-availability">
            <span className="product-stores-label">
              Disponible en {cantTiendas}{' '}
              {cantTiendas === 1 ? 'supermercado' : 'supermercados'}:
            </span>
            <div className="product-stores-badges">
              {tiendas.map((t, idx) => {
                const logo = getSupermarketLogo(t.supermercadoNombre);
                return (
                  <span key={t.supermercadoId || idx} className="store-badge">
                    {logo && (
                      <img
                        src={logo.logoUrl}
                        alt={logo.alt}
                        className="store-badge-mini-logo"
                      />
                    )}
                    <span>{t.supermercadoNombre}</span>
                  </span>
                );
              })}
            </div>
          </div>

          <div className="product-footer">
            <button
              type="button"
              className="product-action-btn product-action-btn-full"
              onClick={() => onAdd(product)}
            >
              Agregar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vista Clásica
  const { product, store, onAdd } = props;
  const storeLogo = getSupermarketLogo(store.supermercadoNombre);

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={
            store.urlImagen ||
            product.urlImagen ||
            'https://via.placeholder.com/400?text=Producto'
          }
          alt={product.nombreGenerico}
          className="product-image"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.dataset.fallback) {
              target.dataset.fallback = '1';
              target.src = 'https://via.placeholder.com/400x400.png?text=Sin+imagen';
            }
          }}
        />
        {storeLogo ? (
          <div
            className="product-super-badge product-super-badge-logo"
            title={`Supermercado ${store.supermercadoNombre}`}
          >
            <img
              src={storeLogo.logoUrl}
              alt={storeLogo.alt}
              className="product-super-logo"
            />
          </div>
        ) : (
          <span className="product-super-badge">{store.supermercadoNombre}</span>
        )}
      </div>
      <div className="product-info">
        <div className="product-header">
          <span className="product-category">{product.marca || 'Sin marca'}</span>
        </div>
        <h3 className="product-name">{formatNombreCompleto(product)}</h3>

        <div className="product-footer">
          <p className="product-price">
            ${Number(store.precio || 0).toLocaleString('es-AR')}
          </p>
          <button
            type="button"
            className="product-action-btn"
            onClick={() => onAdd(product, store.supermercadoId)}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
