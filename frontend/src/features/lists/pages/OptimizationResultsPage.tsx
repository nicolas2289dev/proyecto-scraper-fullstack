import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import { listaApi } from '../api/listaApi';
import type { ItemLista, OptimizacionCompra } from '../types/lists.types';
import { ShoppingCircuitView } from '../components/ShoppingCircuitView';
import '../styles/listDetail.css';
import '../styles/optimizationResults.css';

interface OptimizationNavigationState {
  optimizationResult?: OptimizacionCompra;
  listItems?: ItemLista[];
}

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
      <ShoppingCircuitView
        listaId={listaId}
        optimizationResult={result}
        listItems={listItems}
        onBack={goBackToList}
      />
    </main>
  );
}

export default OptimizationResultsPage;
