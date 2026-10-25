import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutGrid, Layers, SlidersHorizontal } from 'lucide-react';

import { useProductCatalog } from '../hooks/useProductCatalog';
import { useAddToList } from '../hooks/useAddToList';
import { ProductFilters } from '../components/ProductFilters';
import { ProductCatalogGrid } from '../components/ProductCatalogGrid';
import { ProductPagination } from '../components/ProductPagination';
import { AddToListModal } from '../components/AddToListModal';
import { AlertModal } from '../components/AlertModal';

import '../styles/products.css';

export function HomePage() {
  const navigate = useNavigate();
  const catalog = useProductCatalog();
  const addToList = useAddToList(catalog.filterSupermarket);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
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

  const totalCardsCount = catalog.calculateTotalCardsCount(viewMode);

  return (
    <>
      <header className="home-header">
        <h1 className="home-title">Comparador de Precios</h1>
        <p className="subtitle">
          Encontrá los mejores precios y ahorrá en cada compra.
        </p>
      </header>

      <main className="home-content">
        <div className="catalog-layout">
          {/* Columna Izquierda: Sidebar de Filtros (Sticky en Desktop, Drawer en Móvil) */}
          <div className="catalog-sidebar-column">
            <ProductFilters
              selectedCategoryId={catalog.selectedCategoryId}
              onCategoryChange={catalog.setSelectedCategoryId}
              availableMarcas={catalog.availableMarcas}
              filterMarca={catalog.filterMarca}
              onMarcaChange={catalog.setFilterMarca}
              supermarkets={catalog.supermarkets}
              filterSupermarket={catalog.filterSupermarket}
              onSupermarketChange={catalog.setFilterSupermarket}
              minPrice={catalog.minPrice}
              maxPrice={catalog.maxPrice}
              onMinPriceChange={catalog.setMinPrice}
              onMaxPriceChange={catalog.setMaxPrice}
              sortOrder={catalog.sortOrder}
              onSortOrderChange={catalog.setSortOrder}
              onlyDiscount={catalog.onlyDiscount}
              onDiscountToggle={catalog.setOnlyDiscount}
              onClearFilters={catalog.handleClearFilters}
              isMobileDrawerOpen={isMobileDrawerOpen}
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
              onApplyMobileFilters={() => setIsMobileDrawerOpen(false)}
            />
          </div>

          {/* Columna Derecha: Catálogo y Resultados */}
          <div className="catalog-main-column">
            <section className="products-section">
              {catalog.error && catalog.error.startsWith('Para') && (
                <div className="top-banner">
                  <div className="auth-banner">
                    <span>🔐 {catalog.error}</span>
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
                <div className="results-summary-left">
                  <button
                    type="button"
                    className="btn-mobile-filters-trigger"
                    onClick={() => setIsMobileDrawerOpen(true)}
                    aria-label="Abrir filtros"
                  >
                    <SlidersHorizontal size={16} />
                    <span>Filtros</span>
                    {catalog.activeFiltersCount > 0 && (
                      <span className="filter-badge-pill">
                        {catalog.activeFiltersCount}
                      </span>
                    )}
                  </button>

                  <div className="results-summary">
                    {catalog.searching ? (
                      <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>
                        🔄 Buscando...
                      </span>
                    ) : (
                      <>
                        Mostrando <strong>{totalCardsCount}</strong>{' '}
                        {viewMode === 'compacta' ? 'producto' : 'oferta'}
                        {totalCardsCount !== 1 ? 's' : ''}
                        {viewMode === 'compacta'
                          ? ` de ${catalog.totalElements} en catálogo`
                          : ''}
                      </>
                    )}
                  </div>
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

              <ProductCatalogGrid
                products={catalog.filteredProducts}
                viewMode={viewMode}
                loading={catalog.loading}
                supermarkets={catalog.supermarkets}
                selectedSupermarketId={catalog.filterSupermarket}
                onAdd={(product, preselectedSuperId) =>
                  addToList.openAddModal(product, preselectedSuperId, viewMode)
                }
              />

              <ProductPagination
                page={catalog.page}
                totalPages={catalog.totalPages}
                onPageChange={catalog.goToPage}
                disabled={catalog.searching}
              />
            </section>
          </div>
        </div>
      </main>

      <AddToListModal
        isOpen={addToList.showModal}
        onClose={addToList.closeModal}
        product={addToList.selectedProduct}
        modalMode={addToList.modalMode}
        selectedSupermarketId={addToList.selectedSupermarketId}
        onSelectSupermarket={addToList.setSelectedSupermarketId}
        listOptions={addToList.listOptions}
        selectedListId={addToList.selectedListId}
        onSelectList={addToList.setSelectedListId}
        quantity={addToList.quantity}
        onQuantityChange={addToList.setQuantity}
        onConfirm={addToList.handleAddToList}
        adding={addToList.adding}
        successMsg={addToList.successMsg}
        onGoCreateList={() => {
          addToList.closeModal();
          navigate('/mis-listas');
        }}
      />

      <AlertModal
        visible={addToList.alertModal.visible}
        title={addToList.alertModal.title}
        message={addToList.alertModal.message}
        severity={addToList.alertModal.severity}
        onClose={addToList.hideAlert}
      />
    </>
  );
}

export default HomePage;
