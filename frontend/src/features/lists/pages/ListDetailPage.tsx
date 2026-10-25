import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { listaApi } from '../api/listaApi';
import type { ListaCompraDetalle, OptimizacionCompra } from '../types/lists.types';
import '../styles/listDetail.css';

export function ListDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [list, setList] = useState<ListaCompraDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizacionCompra | null>(null);
  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const listaId = Number(id);

  const fetchListDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listaApi.getById(listaId);
      setList(data);
    } catch (err) {
      console.error('Error fetching list detail:', err);
      setErrorModal({
        visible: true,
        title: 'Error',
        message: 'Error al cargar el detalle de la lista',
      });
      navigate('/mis-listas');
    } finally {
      setLoading(false);
    }
  }, [listaId, navigate]);

  useEffect(() => {
    if (!Number.isNaN(listaId)) {
      fetchListDetail();
    }
  }, [listaId, fetchListDetail]);

  const handleOptimize = async () => {
    try {
      setOptimizing(true);
      const result = await listaApi.getCircuitoOptimo(listaId);
      setOptimizationResult(result);
    } catch (err) {
      console.error('Error optimizing list:', err);
      setErrorModal({
        visible: true,
        title: 'Error',
        message: 'Error al optimizar la lista',
      });
    } finally {
      setOptimizing(false);
    }
  };

  const removeItem = (itemId: number, productoNombre?: string) => {
    setConfirmModal({
      visible: true,
      title: 'Quitar producto',
      message: productoNombre
        ? `¿Estás seguro de que deseas quitar "${productoNombre}" de tu lista?`
        : '¿Estás seguro de que deseas quitar este producto de tu lista?',
      onConfirm: async () => {
        try {
          await listaApi.removeItem(listaId, itemId);
          setOptimizationResult(null);
          fetchListDetail();
          setConfirmModal((prev) => ({ ...prev, visible: false }));
        } catch (err) {
          console.error('Error eliminando item:', err);
          setErrorModal({
            visible: true,
            title: 'Error',
            message: 'Error al eliminar el ítem de la lista',
          });
          setConfirmModal((prev) => ({ ...prev, visible: false }));
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="container">
        <p>Cargando detalle...</p>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="container">
        <p>Lista no encontrada</p>
      </div>
    );
  }

  return (
    <div className="list-detail-container container">
      <div className="list-detail-top-nav">
        <button
          type="button"
          className="btn list-detail-btn-back"
          onClick={() => navigate('/mis-listas')}
        >
          ← Volver
        </button>
        <h1 className="list-detail-title">
          {list.nombreLista} {list.favorita ? '★' : ''}
        </h1>
        <Link to="/home" className="list-detail-btn-add">
          + Agregar productos
        </Link>
      </div>

      <div className="list-detail-content-grid">
        <section className="list-detail-section">
          <div className="list-detail-section-header">
            <h2 className="list-detail-section-title">Productos en la lista</h2>
            <button
              type="button"
              className="btn list-detail-btn-optimize"
              onClick={handleOptimize}
              disabled={optimizing || list.items.length === 0}
            >
              {optimizing ? 'Optimizando...' : '🚀 Optimizar Compra'}
            </button>
          </div>

          {list.items.length === 0 ? (
            <div className="list-detail-empty">
              No hay productos en esta lista.
              <br />
              <Link to="/home" className="link">
                Ir a buscar productos
              </Link>
            </div>
          ) : (
            <div className="list-detail-table-wrapper">
              <table className="list-detail-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Marca</th>
                    <th>Cant.</th>
                    <th>Precio Est.</th>
                    <th>Supermercado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((item) => (
                    <tr key={item.id}>
                      <td className="list-detail-item-name">{item.productoNombre}</td>
                      <td className="list-detail-item-brand">{item.marca}</td>
                      <td>{item.cantidad}</td>
                      <td className="list-detail-item-price">
                        ${item.precioTotal?.toLocaleString('es-AR') || '-'}
                      </td>
                      <td className="list-detail-item-store">{item.supermercadoNombre}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.productoNombre)}
                          className="list-detail-btn-remove"
                          title="Quitar producto"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="list-detail-total-label">
                      Total Estimado:
                    </td>
                    <td className="list-detail-total-value">
                      ${list.totalEstimado?.toLocaleString('es-AR') || '0'}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>

        {optimizationResult && (
          <section className="list-detail-optimization-section">
            <h2 className="list-detail-opt-header">
              ✅ Resultado de Optimización
            </h2>

            <div className="list-detail-kpi-grid">
              <div className="list-detail-kpi-card">
                <span className="list-detail-kpi-label">Total Óptimo</span>
                <p className="list-detail-kpi-val">
                  ${optimizationResult.totalOptimo.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="list-detail-kpi-card">
                <span className="list-detail-kpi-label">Ahorro Total</span>
                <p className="list-detail-kpi-val savings">
                  ${optimizationResult.totalAhorrado.toLocaleString('es-AR')}
                </p>
              </div>
              <div className="list-detail-kpi-card warning">
                <span className="list-detail-kpi-label">Total Lista (Original)</span>
                <p className="list-detail-kpi-val expensive">
                  ${optimizationResult.totalMasCaro.toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <h3 className="list-detail-roadmap-title">
              📍 Hoja de Ruta (Dónde comprar)
            </h3>
            {optimizationResult.hojaDeRuta.map((tienda) => (
              <div key={tienda.supermercadoId} className="list-detail-store-card">
                <h4 className="list-detail-store-name">{tienda.supermercadoNombre}</h4>
                <ul className="list-detail-store-items">
                  {tienda.productos.map((p) => (
                    <li key={p.productoId} className="list-detail-store-item">
                      <strong>{p.productoNombre}</strong> ({p.marca}) x {p.cantidad} -
                      <span className="list-detail-store-item-price">
                        {' '}
                        ${p.subtotal.toLocaleString('es-AR')}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="list-detail-store-subtotal">
                  <strong>
                    Subtotal en tienda: ${tienda.subtotalTienda.toLocaleString('es-AR')}
                  </strong>
                </div>
              </div>
            ))}

            {optimizationResult.productosSinPrecio.length > 0 && (
              <div className="list-detail-missing-box">
                <h4 className="list-detail-missing-title">
                  ⚠️ Productos sin precio disponible
                </h4>
                <p className="list-detail-missing-desc">
                  No pudimos encontrar precios para estos productos en ningún supermercado:
                </p>
                <ul className="list-detail-missing-list">
                  {optimizationResult.productosSinPrecio.map((p) => (
                    <li key={p.productoId}>
                      {p.productoNombre} ({p.marca})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Error Modal */}
      {errorModal.visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setErrorModal((prev) => ({ ...prev, visible: false }));
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold flex-1 text-slate-900 dark:text-white m-0">
                {errorModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
              {errorModal.message}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setErrorModal((prev) => ({ ...prev, visible: false }))}
                className="px-5 py-2.5 rounded-xl font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmModal.visible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmModal((prev) => ({ ...prev, visible: false }));
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[440px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold flex-1 text-slate-900 dark:text-white m-0">
                {confirmModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="mb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed m-0">
              {confirmModal.message}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
                className="px-4 py-2.5 rounded-xl font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2.5 rounded-xl font-semibold bg-red-600 text-white hover:bg-red-700 transition shadow-sm cursor-pointer"
              >
                Quitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListDetailPage;
