import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BadgeDollarSign,
  CircleHelp,
  MapPin,
  RefreshCw,
  Store,
  TriangleAlert,
} from 'lucide-react';
import { listaApi } from '../api/listaApi';
import type { ItemLista, OptimizacionCompra } from '../types/lists.types';
import { getSupermarketLogo } from '../../products/utils/supermarketLogos';
import '../styles/optimizationResults.css';

interface OptimizationNavigationState {
  optimizationResult?: OptimizacionCompra;
  listItems?: ItemLista[];
}

const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-AR')}`;

export function OptimizationResultsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as OptimizationNavigationState | null;
  const listaId = Number(id);
  const initialResult = navigationState?.optimizationResult?.listaId === listaId
    ? navigationState.optimizationResult
    : null;
  const [result, setResult] = useState<OptimizacionCompra | null>(initialResult);
  const [loading, setLoading] = useState(initialResult === null);
  const [listItems, setListItems] = useState<ItemLista[]>(navigationState?.listItems ?? []);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listaApi
      .getById(listaId)
      .then((list) => {
        if (!cancelled) setListItems(list.items);
      })
      .catch((err: unknown) => {
        console.error('Error loading original list items:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [listaId]);

  useEffect(() => {
    const navigatedResult = navigationState?.optimizationResult;
    if (navigatedResult?.listaId === listaId) {
      return;
    }

    let cancelled = false;
    listaApi
      .getCircuitoOptimo(listaId)
      .then((optimization) => {
        if (!cancelled) setResult(optimization);
      })
      .catch((err: unknown) => {
        console.error('Error loading optimization results:', err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [listaId, navigationState, retryCount]);

  const goBackToList = () => navigate(`/mis-listas/${listaId}`);
  const listItemsByProductId = new Map(
    listItems.map((item) => [item.productoId, item])
  );

  if (loading) {
    return (
      <main className="optimization-results-page container">
        <p className="optimization-results-status" role="status">
          Calculando la mejor opción de compra...
        </p>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="optimization-results-page container">
        <button
          type="button"
          className="optimization-results-back"
          onClick={goBackToList}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Volver al detalle</span>
        </button>
        <section className="optimization-results-message" role="alert">
          <TriangleAlert size={22} aria-hidden="true" />
          <h1>No pudimos cargar la optimización</h1>
          <p>Intenta calcularla nuevamente desde el detalle de tu lista.</p>
          <button
            type="button"
            className="optimization-results-retry"
            onClick={() => {
              setError(false);
              setLoading(true);
              setRetryCount((count) => count + 1);
            }}
          >
            <RefreshCw size={16} aria-hidden="true" />
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="optimization-results-page container">
      <header className="optimization-results-header">
        <button
          type="button"
          className="optimization-results-back"
          onClick={goBackToList}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          <span>Volver al detalle</span>
        </button>
        <span className="optimization-results-eyebrow">Plan de compra</span>
        <h1>Optimización de {result.nombreLista}</h1>
        <p>Una ruta simple para comprar mejor y aprovechar el ahorro.</p>
      </header>

      <section className="optimization-results-summary" aria-label="Resumen de ahorro">
        <article className="optimization-results-total">
          <span><BadgeDollarSign size={17} aria-hidden="true" /> Total óptimo</span>
          <strong>{formatCurrency(result.totalOptimo)}</strong>
        </article>
        <article className="optimization-results-saving">
          <span>Ahorro estimado</span>
          <strong>{formatCurrency(result.totalAhorrado)}</strong>
        </article>
        <article className="optimization-results-original">
          <span>Total más caro</span>
          <strong>{formatCurrency(result.totalMasCaro)}</strong>
        </article>
      </section>

      <section className="optimization-results-route">
        <div className="optimization-results-section-heading">
          <span className="optimization-results-heading-icon" aria-hidden="true">
            <MapPin size={18} />
          </span>
          <div>
            <h2>Tu ruta de compra</h2>
            <p>{result.hojaDeRuta.length} supermercado{result.hojaDeRuta.length === 1 ? '' : 's'} recomendado{result.hojaDeRuta.length === 1 ? '' : 's'}</p>
          </div>
        </div>

        {result.hojaDeRuta.length === 0 ? (
          <div className="optimization-results-empty">
            <CircleHelp size={20} aria-hidden="true" />
            <p>No encontramos una ruta con precios disponibles para esta lista.</p>
          </div>
        ) : (
          <div className="optimization-results-stores">
            {result.hojaDeRuta.map((store, index) => {
              const logo = getSupermarketLogo(store.supermercadoNombre);
              return (
                <article className="optimization-results-store" key={store.supermercadoId}>
                  <header className="optimization-results-store-header">
                    <div className="optimization-results-store-title">
                      <span className="optimization-results-store-number">{index + 1}</span>
                      {logo ? (
                        <img
                          className="optimization-results-store-logo"
                          src={logo.logoUrl}
                          alt={logo.alt}
                          title={store.supermercadoNombre}
                        />
                      ) : (
                        <div className="optimization-results-store-name">
                          <h3>{store.supermercadoNombre}</h3>
                          <span>{store.productos.length} producto{store.productos.length === 1 ? '' : 's'}</span>
                        </div>
                      )}
                    </div>
                    <div className="optimization-results-store-total">
                      <span>{store.productos.length} producto{store.productos.length === 1 ? '' : 's'}</span>
                      <strong>{formatCurrency(store.subtotalTienda)}</strong>
                    </div>
                  </header>
                  <ul className="optimization-results-products">
                    {store.productos.map((product) => {
                      const originalItem = listItemsByProductId.get(product.productoId);
                      const hasLowerPrice = originalItem
                        && Number.isFinite(originalItem.precioUnitario)
                        && Number.isFinite(product.precioUnitario)
                        && product.precioUnitario < originalItem.precioUnitario;
                      const originalStoreLogo = hasLowerPrice
                        ? getSupermarketLogo(originalItem.supermercadoNombre)
                        : null;

                      return (
                        <li className="optimization-results-product" key={product.productoId}>
                          <div className="optimization-results-product-names">
                            <div className="optimization-results-product-title">
                              <strong>{product.productoNombre}</strong>
                              {hasLowerPrice && (
                                <span className="optimization-results-product-badge">
                                  Producto optimizado
                                </span>
                              )}
                            </div>
                            {product.marca && <small>{product.marca}</small>}
                            {hasLowerPrice && (
                              <span className="optimization-results-product-original-price">
                                <span>Antes: </span>
                                <strong>{formatCurrency(originalItem.precioUnitario)}</strong>
                                {originalStoreLogo ? (
                                  <img
                                    src={originalStoreLogo.logoUrl}
                                    alt={`Antes en ${originalStoreLogo.name}`}
                                    title={originalItem.supermercadoNombre}
                                  />
                                ) : originalItem.supermercadoNombre ? (
                                  <span className="optimization-results-original-store-name">
                                    {originalItem.supermercadoNombre}
                                  </span>
                                ) : null}
                              </span>
                            )}
                          </div>
                          <span className="optimization-results-product-quantity">x{product.cantidad}</span>
                          <strong className="optimization-results-product-price">
                            {formatCurrency(product.subtotal)}
                          </strong>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {result.productosSinPrecio.length > 0 && (
        <section className="optimization-results-unpriced">
          <div className="optimization-results-unpriced-heading">
            <Store size={17} aria-hidden="true" />
            <h2>Productos sin precio disponible</h2>
          </div>
          <p>No se encontraron precios para estos productos:</p>
          <ul>
            {result.productosSinPrecio.map((product) => (
              <li key={product.productoId}>
                {product.productoNombre}{product.marca ? ` · ${product.marca}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export default OptimizationResultsPage;
