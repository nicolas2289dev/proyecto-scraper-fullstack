import { useState, useEffect, useRef, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Layers } from 'lucide-react';
import type { Supermercado } from '@/shared/types';
import type { ProductoBusqueda } from '../types/products.types';
import { productoApi } from '../api/productoApi';
import { supermercadoApi } from '../api/supermercadoApi';
import { listaApi, type ListaCompra } from '@/features/lists';
import { useAuthStore } from '@/features/auth';

import { ProductCard } from '../components/ProductCard';
import { ProductFilters } from '../components/ProductFilters';
import { AddToListModal } from '../components/AddToListModal';
import { ProductPagination } from '../components/ProductPagination';
import { AlertModal } from '../components/AlertModal';

import '../styles/products.css';

const PAGE_SIZE = 12;

export function HomePage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [filterSupermarket, setFilterSupermarket] = useState<number | 'all'>('all');
  const [filterMarca, setFilterMarca] = useState<string | 'all'>('all');
  const [availableMarcas, setAvailableMarcas] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');

  const [supermarkets, setSupermarkets] = useState<Supermercado[]>([]);
  const [products, setProducts] = useState<ProductoBusqueda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<'clasica' | 'compacta'>(() => {
    return (
      (localStorage.getItem('preferredViewMode') as 'clasica' | 'compacta') ||
      'compacta'
    );
  });

  const handleViewModeChange = (val: 'clasica' | 'compacta') => {
    setViewMode(val);
    localStorage.setItem('preferredViewMode', val);
  };

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'clasica' | 'compacta'>('compacta');
  const [selectedProduct, setSelectedProduct] = useState<ProductoBusqueda | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | string>('');
  const [selectedSupermarketId, setSelectedSupermarketId] = useState<number | string>('');
  const [quantity, setQuantity] = useState(1);
  const [listOptions, setListOptions] = useState<ListaCompra[]>([]);
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [alertModal, setAlertModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    severity: 'warning' | 'info' | 'error';
  }>({
    visible: false,
    title: '',
    message: '',
    severity: 'warning',
  });

  const showAlert = (
    title: string,
    message: string,
    severity: 'warning' | 'info' | 'error' = 'warning'
  ) => {
    setAlertModal({ visible: true, title, message, severity });
  };

  const hideAlert = () => {
    setAlertModal((prev) => ({ ...prev, visible: false }));
  };

  const searchDebounceRef = useRef<number | null>(null);

  const fetchInitial = async () => {
    setLoading(true);
    setError(null);
    const [supersResult, listasResult] = await Promise.allSettled([
      supermercadoApi.getAll(),
      isAuthenticated ? listaApi.getAll() : Promise.resolve([]),
    ]);

    let supers: Supermercado[] = [];
    let authWarning: string | null = null;

    if (supersResult.status === 'fulfilled') {
      supers = supersResult.value;
      setSupermarkets(supers);
    }

    if (isAuthenticated && listasResult.status === 'fulfilled') {
      setListOptions(listasResult.value);
    } else if (isAuthenticated && listasResult.status === 'rejected') {
      const status = (listasResult.reason as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        authWarning = 'Para crear y administrar listas de compras, iniciá sesión.';
      }
    }

    if (supersResult.status === 'rejected') {
      console.error('Error cargando supermercados:', supersResult.reason);
      setError('No se pudieron cargar los supermercados. Revisá la conexión con el backend.');
    } else if (authWarning) {
      setError(authWarning);
    }

    setLoading(false);
    return supers;
  };

  const fetchProducts = async (
    nombre: string,
    supermercadoId: number | 'all',
    pageNumber = 0,
    currentSortOrder = sortOrder,
    marca = filterMarca
  ) => {
    try {
      setSearching(true);
      setError(null);
      const sid = supermercadoId === 'all' ? undefined : Number(supermercadoId);
      const m = marca === 'all' ? undefined : marca;

      let sortParam = undefined;
      if (currentSortOrder === 'asc') sortParam = 'precio,asc';
      else if (currentSortOrder === 'desc') sortParam = 'precio,desc';

      const result = await productoApi.buscarPaginado(
        nombre || undefined,
        sid,
        pageNumber,
        PAGE_SIZE,
        sortParam,
        m
      );
      setProducts(result.items);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);

      if (pageNumber === 0 && marca === 'all') {
        const marcas = await productoApi.obtenerMarcas(nombre || undefined, sid);
        setAvailableMarcas(marcas);
      }
    } catch (err: unknown) {
      console.error('Error buscando productos:', err);
      setError('Error al buscar productos. Revisá la conexión con el backend.');
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchInitial().then(() => {
      fetchProducts('', 'all', 0, 'default', 'all');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (loading) return;

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      startTransition(() => {
        setAppliedSearch(searchTerm);
        setPage(0);
        fetchProducts(searchTerm, filterSupermarket, 0, sortOrder, filterMarca);
      });
    }, 350);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterSupermarket, sortOrder, filterMarca]);

  const goToPage = (newPage: number) => {
    setPage(newPage);
    fetchProducts(appliedSearch, filterSupermarket, newPage, sortOrder, filterMarca);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAddModal = (product: ProductoBusqueda, preselectedSuperId?: number) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setSelectedProduct(product);
    setQuantity(1);
    setSuccessMsg(null);

    if (viewMode === 'clasica' && preselectedSuperId) {
      setModalMode('clasica');
      setSelectedSupermarketId(preselectedSuperId);
    } else {
      setModalMode('compacta');
      const activeSuperId = filterSupermarket !== 'all' ? Number(filterSupermarket) : null;
      const matchedStore = activeSuperId && product.tiendas?.find((t) => t.supermercadoId === activeSuperId);
      const firstSuperId =
        matchedStore
          ? matchedStore.supermercadoId
          : product.tiendas && product.tiendas.length > 0
          ? product.tiendas[0].supermercadoId
          : 1;
      setSelectedSupermarketId(firstSuperId);
    }

    setSelectedListId(listOptions.length ? listOptions[0].id : '');
    setShowModal(true);
  };

  const handleAddToList = async () => {
    if (!selectedProduct || selectedListId === '') return;
    setAdding(true);
    setSuccessMsg(null);
    try {
      const superId =
        typeof selectedSupermarketId === 'number'
          ? selectedSupermarketId
          : Number(selectedSupermarketId) || undefined;

      await listaApi.addItem(
        Number(selectedListId),
        selectedProduct.id,
        quantity,
        superId
      );

      const targetList = listOptions.find((l) => l.id === Number(selectedListId));
      setSuccessMsg(
        `¡Agregaste ${quantity} unidad(es) a "${targetList?.nombreLista || 'tu lista'}"!`
      );
      setTimeout(() => setShowModal(false), 1200);
    } catch (err: unknown) {
      console.error('Error agregando producto:', err);
      const axiosErr = err as { response?: { data?: { message?: string } } };
      showAlert(
        'Error',
        axiosErr?.response?.data?.message || 'Error al agregar producto a la lista',
        'error'
      );
    } finally {
      setAdding(false);
    }
  };

  const selectedSuperId = filterSupermarket !== 'all' ? Number(filterSupermarket) : null;

  const totalCardsCount =
    viewMode === 'compacta'
      ? products.length
      : products.reduce((acc, p) => {
          if (!p.tiendas || p.tiendas.length === 0) return acc + 1;
          const filtered = selectedSuperId
            ? p.tiendas.filter((t) => t.supermercadoId === selectedSuperId)
            : p.tiendas;
          return acc + (filtered.length > 0 ? filtered.length : (selectedSuperId ? 0 : 1));
        }, 0);

  return (
    <>
      <header className="home-header">
        <h1 className="home-title">Comparador de Precios</h1>
        <p className="subtitle">
          Encontrá los mejores precios y ahorrá en cada compra.
        </p>

        <ProductFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          supermarkets={supermarkets}
          filterSupermarket={filterSupermarket}
          onSupermarketChange={(val) => {
            setFilterSupermarket(val);
            setPage(0);
          }}
          availableMarcas={availableMarcas}
          filterMarca={filterMarca}
          onMarcaChange={(val) => {
            setFilterMarca(val);
            setPage(0);
          }}
          sortOrder={sortOrder}
          onSortOrderChange={(val) => {
            setSortOrder(val);
            setPage(0);
          }}
          hasSearched={products.length > 0}
        />
      </header>

      <main className="home-content">
        <section className="products-section">
          {loading ? (
            <div className="no-results-container">
              <div className="grid-skeleton">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card-skeleton" />
                ))}
              </div>
            </div>
          ) : (
            <>
              {error && error.startsWith('Para') && (
                <div className="top-banner">
                  <div className="auth-banner">
                    <span>🔐 {error}</span>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => navigate('/login')}
                    >
                      Iniciar sesión
                    </button>
                  </div>
                </div>
              )}

              <div className="results-summary-row">
                <div className="results-summary">
                  {searching ? (
                    <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                      🔄 Buscando...
                    </span>
                  ) : (
                    <>
                      Mostrando <strong>{totalCardsCount}</strong>{' '}
                      {viewMode === 'compacta' ? 'producto' : 'oferta'}
                      {totalCardsCount !== 1 ? 's' : ''}
                      {viewMode === 'compacta' ? ` de ${totalElements} en catálogo` : ''}
                    </>
                  )}
                </div>

                <div className="view-mode-selector">
                  <div
                    className="view-toggle-container"
                    role="radiogroup"
                    aria-label="Modo de vista de productos"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={viewMode === 'clasica'}
                      onClick={() => handleViewModeChange('clasica')}
                      className={`view-toggle-btn ${
                        viewMode === 'clasica' ? 'active' : ''
                      }`}
                      title="Ver cada oferta de supermercado individualmente"
                    >
                      {viewMode === 'clasica' && (
                        <motion.div
                          layoutId="viewModeActivePill"
                          className="view-toggle-indicator"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <LayoutGrid className="view-toggle-icon" />
                      <span className="view-toggle-label">Vista Clásica</span>
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={viewMode === 'compacta'}
                      onClick={() => handleViewModeChange('compacta')}
                      className={`view-toggle-btn ${
                        viewMode === 'compacta' ? 'active' : ''
                      }`}
                      title="Ver productos unificados con comparativa de supermercados"
                    >
                      {viewMode === 'compacta' && (
                        <motion.div
                          layoutId="viewModeActivePill"
                          className="view-toggle-indicator"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <Layers className="view-toggle-icon" />
                      <span className="view-toggle-label">Vista Compacta</span>
                    </button>
                  </div>
                </div>
              </div>

              {products.length > 0 ? (
                <div className="product-grid">
                  {viewMode === 'compacta'
                    ? products.map((product) => (
                        <ProductCard
                          key={`compact-${product.id}`}
                          mode="compacta"
                          product={product}
                          onAdd={openAddModal}
                        />
                      ))
                    : products.flatMap((product) => {
                        const rawTiendas =
                          product.tiendas && product.tiendas.length > 0
                            ? product.tiendas
                            : [
                                {
                                  productoId: product.id,
                                  supermercadoId:
                                    supermarkets.find(
                                      (s) =>
                                        s.nombre.trim().toLowerCase() ===
                                        product.nombreSupermercado?.trim().toLowerCase()
                                    )?.id || 0,
                                  supermercadoNombre: product.nombreSupermercado,
                                  precio: product.precio,
                                  urlImagen: product.urlImagen,
                                },
                              ];

                        const tiendas = selectedSuperId
                          ? rawTiendas.filter((t) => t.supermercadoId === selectedSuperId)
                          : rawTiendas;

                        return tiendas.map((t, idx) => (
                          <ProductCard
                            key={`classic-${product.id}-${t.supermercadoId || idx}`}
                            mode="clasica"
                            product={product}
                            store={t}
                            onAdd={openAddModal}
                          />
                        ));
                      })}
                </div>
              ) : (
                <div className="no-results-container">
                  <p className="no-results">
                    No se encontraron productos que coincidan con tu búsqueda.
                  </p>
                </div>
              )}

              <ProductPagination
                page={page}
                totalPages={totalPages}
                onPageChange={goToPage}
                disabled={searching}
              />
            </>
          )}
        </section>
      </main>

      <AddToListModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        product={selectedProduct}
        modalMode={modalMode}
        selectedSupermarketId={selectedSupermarketId}
        onSelectSupermarket={setSelectedSupermarketId}
        listOptions={listOptions}
        selectedListId={selectedListId}
        onSelectList={setSelectedListId}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onConfirm={handleAddToList}
        adding={adding}
        successMsg={successMsg}
        onGoCreateList={() => {
          setShowModal(false);
          navigate('/mis-listas');
        }}
      />

      <AlertModal
        visible={alertModal.visible}
        title={alertModal.title}
        message={alertModal.message}
        severity={alertModal.severity}
        onClose={hideAlert}
      />
    </>
  );
}

export default HomePage;
