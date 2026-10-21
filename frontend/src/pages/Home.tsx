import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog } from 'primereact/dialog'
import { Button } from 'primereact/button'
import { SelectButton } from 'primereact/selectbutton'
import type { Supermercado, ProductoBusqueda, ListaCompra } from '../types/Supermercado'
import { productoApi } from '../api/productoApi'
import { supermercadoApi } from '../api/supermercadoApi'
import { listaApi } from '../api/listaApi'
import { useAuthStore } from '../store/authStore'

const PAGE_SIZE = 12

export default function Home() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => !!state.token)
  const [searchTerm, setSearchTerm] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [filterSupermarket, setFilterSupermarket] = useState<number | 'all'>('all')
  const [filterMarca, setFilterMarca] = useState<string | 'all'>('all')
  const [availableMarcas, setAvailableMarcas] = useState<string[]>([])
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default')
  const [supermarkets, setSupermarkets] = useState<Supermercado[]>([])
  const [products, setProducts] = useState<ProductoBusqueda[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modo de vista: 'compacta' (unificada) o 'clasica' (todas las ofertas individuales)
  const [viewMode, setViewMode] = useState<'clasica' | 'compacta'>(() => {
    return (localStorage.getItem('preferredViewMode') as 'clasica' | 'compacta') || 'compacta'
  })

  const viewOptions = [
    { label: 'Vista Clásica', value: 'clasica', icon: 'pi pi-th-large' },
    { label: 'Vista Compacta', value: 'compacta', icon: 'pi pi-clone' }
  ]

  const handleViewModeChange = (val: 'clasica' | 'compacta' | null) => {
    if (val) {
      setViewMode(val)
      localStorage.setItem('preferredViewMode', val)
    }
  }

  // Paginación (server-side, /productos/busqueda)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'clasica' | 'compacta'>('compacta')
  const [selectedProduct, setSelectedProduct] = useState<ProductoBusqueda | null>(null)
  const [selectedListId, setSelectedListId] = useState<number | string>('')
  const [selectedSupermarketId, setSelectedSupermarketId] = useState<number | string>('')
  const [quantity, setQuantity] = useState(1)
  const [listOptions, setListOptions] = useState<ListaCompra[]>([])
  const [adding, setAdding] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [alertModal, setAlertModal] = useState<{
    visible: boolean
    title: string
    message: string
    severity: 'warning' | 'info' | 'error'
  }>({
    visible: false,
    title: '',
    message: '',
    severity: 'warning',
  })

  const showAlert = (title: string, message: string, severity: 'warning' | 'info' | 'error' = 'warning') => {
    setAlertModal({
      visible: true,
      title,
      message,
      severity,
    })
  }

  const hideAlert = () => {
    setAlertModal((prev) => ({ ...prev, visible: false }))
  }

  const searchDebounceRef = useRef<number | null>(null)

  const fetchInitial = async () => {
    setLoading(true)
    setError(null)
    const [supersResult, listasResult] = await Promise.allSettled([
      supermercadoApi.getAll(),
      isAuthenticated ? listaApi.getAll() : Promise.resolve([]),
    ])

    let supers: Supermercado[] = []
    let authWarning: string | null = null

    if (supersResult.status === 'fulfilled') {
      supers = supersResult.value
      setSupermarkets(supers)
    }

    if (isAuthenticated && listasResult.status === 'fulfilled') {
      setListOptions(listasResult.value)
    } else if (isAuthenticated && listasResult.status === 'rejected') {
      console.warn('No se pudieron cargar las listas del usuario (posiblemente sin sesión):', listasResult.reason)
      const status = (listasResult.reason as any)?.response?.status
      if (status === 401 || status === 403) {
        authWarning = 'Para crear y administrar listas de compras, iniciá sesión.'
      }
    }

    if (supersResult.status === 'rejected') {
      console.error('Error cargando supermercados:', supersResult.reason)
      setError('No se pudieron cargar los supermercados. Revisá la conexión con el backend.')
    } else if (authWarning) {
      setError(authWarning)
    }

    setLoading(false)
    return supers
  }

  const fetchProducts = async (nombre: string, supermercadoId: number | 'all', pageNumber = 0, currentSortOrder = sortOrder, marca = filterMarca) => {
    try {
      setSearching(true)
      setError(null)
      const sid = supermercadoId === 'all' ? undefined : Number(supermercadoId)
      const m = marca === 'all' ? undefined : marca

      let sortParam = undefined
      if (currentSortOrder === 'asc') sortParam = 'precio,asc'
      else if (currentSortOrder === 'desc') sortParam = 'precio,desc'

      const result = await productoApi.buscarPaginado(nombre || undefined, sid, pageNumber, PAGE_SIZE, sortParam, m)
      setProducts(result.items)
      setTotalPages(result.totalPages)
      setTotalElements(result.totalElements)

      // Si estamos en la primera página y no hay filtro de marca activo, recargar las marcas disponibles
      if (pageNumber === 0 && marca === 'all') {
        const marcas = await productoApi.obtenerMarcas(nombre || undefined, sid)
        setAvailableMarcas(marcas)
      }
    } catch (err) {
      console.error('Error buscando productos:', err)
      setError('No se pudieron cargar los productos. Revisá la conexión con el backend.')
      setProducts([])
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    fetchInitial()
  }, [isAuthenticated])

  useEffect(() => {
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = window.setTimeout(() => {
      setAppliedSearch(searchTerm.trim())
    }, 400)
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current)
    }
  }, [searchTerm])

  useEffect(() => {
    setPage(0)
    fetchProducts(appliedSearch, filterSupermarket, 0, sortOrder, filterMarca)
  }, [appliedSearch, filterSupermarket, sortOrder, filterMarca])

  const goToPage = (newPage: number) => {
    setPage(newPage)
    fetchProducts(appliedSearch, filterSupermarket, newPage, sortOrder, filterMarca)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const nombreCompleto = (p: ProductoBusqueda) =>
    [p.nombreGenerico, p.varianteEspecifica, p.pesoValor ? `${p.pesoValor}${p.pesoUnidad ? ' ' + p.pesoUnidad : ''}` : '']
      .filter(Boolean)
      .join(' ')


  const openAddModal = (product: ProductoBusqueda, preselectedSuperId?: number) => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    refreshLists()
    setSelectedProduct(product)
    setSelectedListId(listOptions.length ? listOptions[0].id : '')
    setQuantity(1)

    const isClassic = viewMode === 'clasica' || preselectedSuperId !== undefined
    setModalMode(isClassic ? 'clasica' : 'compacta')

    // Preseleccionar el supermercado de acuerdo al parametro explicito, al filtro activo o el primero disponible
    const tiendas = product.tiendas && product.tiendas.length > 0 ? product.tiendas : []
    if (preselectedSuperId !== undefined && preselectedSuperId > 0) {
      setSelectedSupermarketId(preselectedSuperId)
    } else if (filterSupermarket !== 'all') {
      const matchFilter = tiendas.find(t => t.supermercadoId === Number(filterSupermarket))
      if (matchFilter) {
        setSelectedSupermarketId(matchFilter.supermercadoId)
      } else if (tiendas.length > 0) {
        setSelectedSupermarketId(tiendas[0].supermercadoId)
      } else {
        setSelectedSupermarketId(Number(filterSupermarket))
      }
    } else if (tiendas.length > 0) {
      setSelectedSupermarketId(tiendas[0].supermercadoId)
    } else {
      const matched = supermarkets.find(
        (s) => s.nombre.trim().toLowerCase() === product.nombreSupermercado?.trim().toLowerCase()
      )
      setSelectedSupermarketId(matched ? matched.id : '')
    }

    setShowModal(true)
    setSuccessMsg(null)
  }

  const handleAddToList = async () => {
    if (!selectedProduct || selectedListId === '') return

    if (!selectedSupermarketId || selectedSupermarketId === '') {
      showAlert('Seleccionar supermercado', 'Debe seleccionar un supermercado antes de agregar el producto.', 'warning')
      return
    }

    setAdding(true)
    try {
      let productId = selectedProduct.id
      const listaId = Number(selectedListId)
      const supermercadoId = Number(selectedSupermarketId)

      // Si el ID es inválido (producto comparativo), buscar por nombre
      if (productId <= 0) {
        const prods = await productoApi.buscar(selectedProduct.nombreGenerico)
        if (prods.length > 0) {
          productId = prods[0].id
        } else {
          console.error('Producto no encontrado en búsqueda:', selectedProduct.nombreGenerico)
          showAlert('Producto no encontrado', 'No se encontró el producto para agregarlo a la lista.', 'warning')
          setAdding(false)
          return
        }
      }

      await listaApi.addItem(listaId, productId, quantity, supermercadoId)
      setSuccessMsg(`"${selectedProduct.nombreGenerico}" agregado correctamente.`)
      setTimeout(() => {
        setShowModal(false)
        setSuccessMsg(null)
      }, 1200)
    } catch (err) {
      console.error('Error agregando item a la lista:', err)
      showAlert('Producto ya existente', 'Este producto ya existe en tu lista.', 'info')
    } finally {
      setAdding(false)
    }
  }

  const goCreateList = () => {
    setShowModal(false)
    navigate('/mis-listas')
  }

  const refreshLists = async () => {
    if (!isAuthenticated) return
    try {
      const listas = await listaApi.getAll()
      setListOptions(listas)
    } catch (err) {
      console.error(err)
    }
  }

  const totalCardsCount = viewMode === 'compacta'
    ? products.length
    : products.reduce((acc, p) => acc + (p.tiendas && p.tiendas.length > 0 ? p.tiendas.length : 1), 0)

  return (
    <>
      <header className="home-header">
        <h1 className="home-title">Tu Comparador de Precios</h1>
        <p className="subtitle">Encontrá los mejores precios y ahorrá en cada compra.</p>

        <div className="controls-container">
          <div className="search-container">
            <input
              type="text"
              placeholder="¿Qué estás buscando hoy? (ej: fideos, arroz, aceite)"
              className="search-input"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setFilterMarca('all')
              }}
            />
          </div>

          {/* Filtros para búsqueda de productos */}
          {(
            <div className="filters-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="filter-group">
                <label>🏪 Supermercado:</label>
                <select
                  value={filterSupermarket}
                  onChange={(e) => {
                    setFilterSupermarket(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    setFilterMarca('all')
                  }}
                >
                  <option value="all">Todos</option>
                  {supermarkets.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>🏷️ Marca:</label>
                <select
                  value={filterMarca}
                  onChange={(e) => setFilterMarca(e.target.value)}
                  disabled={availableMarcas.length === 0}
                >
                  <option value="all">Todas</option>
                  {availableMarcas.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label>💰 Orden:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'default' | 'asc' | 'desc')}
                >
                  <option value="default">Por defecto</option>
                  <option value="asc">Precio: Menor a Mayor</option>
                  <option value="desc">Precio: Mayor a Menor</option>
                </select>
              </div>
            </div>
          )}
        </div>
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
              {error && !error.startsWith('Para') && (
                <div className="top-banner" style={{ display: 'none' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div className="error-banner-inline">{error}</div>
                    <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => fetchProducts(appliedSearch, filterSupermarket)}>
                      Reintentar
                    </button>
                  </div>
                </div>
              )}
              {error && error.startsWith('Para') && (
                <div className="top-banner">
                  <div className="auth-banner">
                    <span>🔐 {error}</span>
                    <button className="btn" style={{ padding: '0.45rem 1.1rem' }} onClick={() => navigate('/login')}>
                      Iniciar sesión
                    </button>
                  </div>
                </div>
              )}
              <div className="results-summary-row">
                <div className="results-summary">
                  {searching ? (
                    <span style={{ color: 'var(--primary-color)', fontWeight: 600 }}>🔄 Buscando...</span>
                  ) : (
                    <>
                      Mostrando <strong>{totalCardsCount}</strong> {viewMode === 'compacta' ? 'producto' : 'oferta'}{totalCardsCount !== 1 ? 's' : ''}
                      {viewMode === 'compacta' ? ` de ${totalElements} en catálogo` : ''}
                    </>
                  )}
                </div>

                <div className="view-mode-selector">
                  <SelectButton
                    value={viewMode}
                    onChange={(e) => handleViewModeChange(e.value)}
                    options={viewOptions}
                    className="custom-view-selectbutton"
                  />
                </div>
              </div>

              {/* Resultados paginados de /productos/busqueda segun el modo de vista */}
              {products.length > 0 ? (
                <div className="product-grid">
                  {viewMode === 'compacta' ? (
                    /* ── VISTA COMPACTA: 1 card unificada por producto maestro ── */
                    products.map((product) => {
                      const tiendas = product.tiendas && product.tiendas.length > 0
                        ? product.tiendas
                        : [{
                          productoId: product.id,
                          supermercadoId: 0,
                          supermercadoNombre: product.nombreSupermercado,
                          precio: product.precio,
                          urlImagen: product.urlImagen,
                        }]
                      const cantTiendas = tiendas.length

                      return (
                        <div key={`compact-${product.id}`} className="product-card">
                          <div className="product-image-container">
                            <img
                              src={product.urlImagen || 'https://via.placeholder.com/400?text=Producto'}
                              alt={product.nombreGenerico}
                              className="product-image"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = '1'
                                  target.src = 'https://via.placeholder.com/400x400.png?text=Sin+imagen'
                                }
                              }}
                            />
                          </div>
                          <div className="product-info">
                            <div className="product-header">
                              <span className="product-category">{product.marca || 'Sin marca'}</span>
                            </div>
                            <h3 className="product-name">{nombreCompleto(product)}</h3>

                            <div className="product-stores-availability">
                              <span className="product-stores-label">
                                Disponible en {cantTiendas} {cantTiendas === 1 ? 'supermercado' : 'supermercados'}:
                              </span>
                              <div className="product-stores-badges">
                                {tiendas.map((t, idx) => (
                                  <span key={t.supermercadoId || idx} className="store-badge">
                                    {t.supermercadoNombre}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="product-footer">
                              <button
                                className="product-action-btn product-action-btn-full"
                                onClick={() => openAddModal(product)}
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    /* ── VISTA CLÁSICA: 1 card por cada oferta/tienda individual ── */
                    products.flatMap((product) => {
                      const tiendas = product.tiendas && product.tiendas.length > 0
                        ? product.tiendas
                        : [{
                          productoId: product.id,
                          supermercadoId: supermarkets.find(s => s.nombre.trim().toLowerCase() === product.nombreSupermercado?.trim().toLowerCase())?.id || 0,
                          supermercadoNombre: product.nombreSupermercado,
                          precio: product.precio,
                          urlImagen: product.urlImagen,
                        }]

                      return tiendas.map((t, idx) => (
                        <div key={`classic-${product.id}-${t.supermercadoId || idx}`} className="product-card">
                          <div className="product-image-container">
                            <img
                              src={t.urlImagen || product.urlImagen || 'https://via.placeholder.com/400?text=Producto'}
                              alt={product.nombreGenerico}
                              className="product-image"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                if (!target.dataset.fallback) {
                                  target.dataset.fallback = '1'
                                  target.src = 'https://via.placeholder.com/400x400.png?text=Sin+imagen'
                                }
                              }}
                            />
                            <span className="product-super-badge">{t.supermercadoNombre}</span>
                          </div>
                          <div className="product-info">
                            <div className="product-header">
                              <span className="product-category">{product.marca || 'Sin marca'}</span>
                            </div>
                            <h3 className="product-name">{nombreCompleto(product)}</h3>

                            <div className="product-footer">
                              <p className="product-price">${Number(t.precio || 0).toLocaleString('es-AR')}</p>
                              <button
                                className="product-action-btn"
                                onClick={() => openAddModal(product, t.supermercadoId)}
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    })
                  )}
                </div>
              ) : (
                <div className="no-results-container">
                  <p className="no-results">No se encontraron productos que coincidan con tu búsqueda.</p>
                </div>
              )}

              {totalPages > 1 && (
                <nav className="pagination" aria-label="Paginación de productos">
                  <button
                    className="btn btn-secondary pagination-btn"
                    disabled={page === 0 || searching}
                    onClick={() => goToPage(page - 1)}
                  >
                    ← Anterior
                  </button>
                  <span className="pagination-info">Página {page + 1} de {totalPages}</span>
                  <button
                    className="btn btn-secondary pagination-btn"
                    disabled={page >= totalPages - 1 || searching}
                    onClick={() => goToPage(page + 1)}
                  >
                    Siguiente →
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>

      {showModal && selectedProduct && (() => {
        const modalTiendas = selectedProduct.tiendas && selectedProduct.tiendas.length > 0
          ? selectedProduct.tiendas
          : [{
            productoId: selectedProduct.id,
            supermercadoId: typeof selectedSupermarketId === 'number' ? selectedSupermarketId : 1,
            supermercadoNombre: selectedProduct.nombreSupermercado,
            precio: selectedProduct.precio,
            urlImagen: selectedProduct.urlImagen,
          }]

        const currentTienda = modalTiendas.find(t => t.supermercadoId === selectedSupermarketId) || modalTiendas[0]

        return (
          <div className="modal-overlay" onClick={() => !adding && setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2 className="modal-title">Agregar a mi lista</h2>

              {modalMode === 'clasica' ? (
                /* ── SECCIÓN VISTA CLÁSICA: Producto individual de la card seleccionada ── */
                <div className="modal-product-info">
                  <img
                    src={currentTienda.urlImagen || selectedProduct.urlImagen || 'https://via.placeholder.com/120?text=Producto'}
                    alt={selectedProduct.nombreGenerico}
                    className="modal-product-img"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (!target.dataset.fallback) {
                        target.dataset.fallback = '1'
                        target.src = 'https://via.placeholder.com/120x120.png?text=Producto'
                      }
                    }}
                  />
                  <div className="modal-store-details">
                    <p className="modal-product-name">{nombreCompleto(selectedProduct)}</p>
                    <p className="modal-product-brand">
                      {selectedProduct.marca} · <strong className="modal-super-name">{currentTienda.supermercadoNombre || selectedProduct.nombreSupermercado}</strong>
                    </p>
                    <p className="modal-product-price">${Number(currentTienda.precio ?? selectedProduct.precio ?? 0).toLocaleString('es-AR')}</p>
                  </div>
                </div>
              ) : (
                /* ── SECCIÓN VISTA COMPACTA: Selección de supermercado disponible ── */
                <div className="modal-stores-selection">
                  <label className="label modal-selection-title">Seleccioná el supermercado:</label>
                  <div className="modal-stores-list">
                    {modalTiendas.map((t, idx) => {
                      const isSelected = selectedSupermarketId === t.supermercadoId
                      return (
                        <div
                          key={t.supermercadoId || idx}
                          className={`modal-product-info modal-store-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedSupermarketId(t.supermercadoId)}
                        >
                          <div className="store-radio-container">
                            <input
                              type="radio"
                              name="selectedStore"
                              checked={isSelected}
                              onChange={() => setSelectedSupermarketId(t.supermercadoId)}
                            />
                          </div>
                          <img
                            src={t.urlImagen || selectedProduct.urlImagen || 'https://via.placeholder.com/120?text=Producto'}
                            alt={selectedProduct.nombreGenerico}
                            className="modal-product-img"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = '1'
                                target.src = 'https://via.placeholder.com/120x120.png?text=Producto'
                              }
                            }}
                          />
                          <div className="modal-store-details">
                            <p className="modal-product-name">{nombreCompleto(selectedProduct)}</p>
                            <p className="modal-product-brand">
                              {selectedProduct.marca} · <strong className="modal-super-name">{t.supermercadoNombre}</strong>
                            </p>
                            <p className="modal-product-price">${Number(t.precio || 0).toLocaleString('es-AR')}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="modal-fields">
                {listOptions.length === 0 ? (
                  <div className="empty-lists-warning">
                    <p>⚠️ Todavía no tenés listas creadas.</p>
                    <button className="btn btn-secondary" onClick={goCreateList}>
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
                        onChange={(e) => setSelectedListId(e.target.value)}
                      >
                        <option value="">Seleccioná una lista</option>
                        {listOptions.map(l => (
                          <option key={l.id} value={String(l.id)}>
                            {l.favorita ? '⭐ ' : ''}{l.nombreLista}
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
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                  </>
                )}
              </div>

              {successMsg && <div className="modal-success">✅ {successMsg}</div>}

              <div className="modal-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                  disabled={adding}
                >
                  Cancelar
                </button>
                {listOptions.length > 0 && (
                  <button
                    className="btn"
                    onClick={handleAddToList}
                    disabled={adding || selectedListId === ''}
                  >
                    {adding ? 'Agregando...' : 'Confirmar'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* PrimeReact Dialog para Alertas / Notificaciones */}
      <Dialog
        visible={alertModal.visible}
        onHide={hideAlert}
        draggable={false}
        resizable={false}
        dismissableMask
        maskClassName="modern-dialog-mask"
        className="modern-alert-dialog"
        header={
          <div className="alert-modal-header">
            <div className={`alert-modal-icon-badge ${alertModal.severity}`}>
              <i
                className={
                  alertModal.severity === 'warning'
                    ? 'pi pi-exclamation-triangle'
                    : alertModal.severity === 'info'
                      ? 'pi pi-info-circle'
                      : 'pi pi-times-circle'
                }
              />
            </div>
            <span className="alert-modal-title">{alertModal.title}</span>
          </div>
        }
        footer={
          <div className="alert-modal-footer">
            <Button
              label="Entendido"
              onClick={hideAlert}
              autoFocus
              className="alert-modal-btn"
            />
          </div>
        }
      >
        <div className="alert-modal-body">
          <p className="alert-modal-message">{alertModal.message}</p>
        </div>
      </Dialog>

      <style>{`
        .home-header { text-align: center; padding: 2.5rem 1rem; background: var(--white); margin-bottom: 2rem; border-bottom: 1px solid var(--accent-color); }
        .home-title { font-size: 2.2rem; color: var(--brand-blue); margin-bottom: 0.5rem; font-weight: 800; }
        .subtitle { color: var(--text-muted); font-size: 1.1rem; margin-bottom: 1.5rem; }
        .controls-container { max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
        .search-container { position: relative; width: 100%; max-width: 720px; margin: 0 auto; }
        .search-input {
          width: 100%; padding: 0.9rem 1.5rem 0.9rem 3.5rem; border-radius: 30px;
          border: 2px solid var(--accent-color); background: var(--white) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='%238ca4b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E") no-repeat 1.25rem center;
          color: var(--text-dark); font-size: 1rem; outline: none; transition: all 0.2s ease; box-shadow: var(--card-shadow);
        }
        .search-input:focus { border-color: var(--brand-blue); box-shadow: 0 6px 15px rgba(0,0,0,0.06); }

        .filters-bar { display: flex; justify-content: center; gap: 2.5rem; flex-wrap: wrap; }
        .filter-group { display: flex; align-items: center; gap: 0.75rem; color: var(--brand-blue); font-weight: 600; font-size: 0.95rem; }
        .filter-group select { padding: 0.5rem 1rem; border-radius: 10px; border: 1px solid var(--accent-color); background: var(--white); color: var(--text-dark); font-size: 0.9rem; outline: none; }

        .home-content { padding: 0 2rem 4rem; max-width: 1400px; margin: 0 auto; }
        .results-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .results-summary { color: var(--text-muted); font-size: 0.95rem; font-weight: 500; margin: 0; }
        .view-mode-selector { display: flex; align-items: center; }

        /* Custom segmented pill SelectButton */
        .custom-view-selectbutton.p-selectbutton {
          display: inline-flex;
          background: var(--white);
          border: 1px solid var(--accent-color);
          border-radius: 30px;
          padding: 3px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .custom-view-selectbutton .p-button {
          border: none !important;
          border-radius: 25px !important;
          padding: 0.45rem 1rem !important;
          font-size: 0.85rem !important;
          font-weight: 600 !important;
          color: var(--text-muted) !important;
          background: transparent !important;
          transition: all 0.2s ease !important;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
        }

        .custom-view-selectbutton .p-button:not(.p-highlight):hover {
          color: var(--text-dark) !important;
          background: rgba(140, 164, 184, 0.1) !important;
        }

        .custom-view-selectbutton .p-button.p-highlight {
          background: var(--brand-blue) !important;
          color: #ffffff !important;
          box-shadow: 0 2px 8px rgba(140, 164, 184, 0.45) !important;
        }

        [data-theme='dark'] .custom-view-selectbutton.p-selectbutton {
          background: #1e1e1e;
          border-color: rgba(255, 255, 255, 0.12);
        }

        [data-theme='dark'] .custom-view-selectbutton .p-button:not(.p-highlight):hover {
          background: rgba(255, 255, 255, 0.06) !important;
          color: #f1f3f5 !important;
        }

        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.75rem; }

        .product-card {
          background: var(--white); border-radius: 16px; overflow: hidden;
          box-shadow: var(--card-shadow); border: 1px solid var(--accent-color); display: flex; flex-direction: column;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .product-card:hover { transform: translateY(-6px); box-shadow: 0 10px 28px rgba(0,0,0,0.09); }

        .product-image-container { position: relative; width: 100%; height: 220px; background-color: var(--secondary-color); display: flex; align-items: center; justify-content: center; }
        .product-image { width: 100%; height: 100%; object-fit: contain; padding: 0.75rem; background: var(--white); }

        .product-super-badge {
          position: absolute; top: 12px; right: 12px;
          background: var(--brand-blue); color: white;
          padding: 4px 10px; border-radius: 20px; font-size: 0.7rem;
          font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px;
        }

        .product-info { padding: 1rem 1rem 1rem; flex-grow: 1; display: flex; flex-direction: column; gap: 0.5rem; }
        .product-header { display: flex; justify-content: space-between; align-items: center; }
        .product-category { color: var(--brand-blue); font-weight: 800; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.4px; }
        .product-name { font-size: 1rem; margin: 0; color: var(--text-dark); font-weight: 700; line-height: 1.35; min-height: 2.8rem; }
        .product-description {
          font-size: 0.85rem; color: var(--text-muted); line-height: 1.45;
          margin: 0; min-height: 3.6rem;
          display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
          overflow: hidden; text-overflow: ellipsis;
        }
        .product-stores-availability {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          margin-top: 0.35rem;
          margin-bottom: 0.6rem;
        }
        .product-stores-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .product-stores-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }
        .store-badge {
          background: rgba(140, 164, 184, 0.16);
          color: var(--brand-blue);
          border: 1px solid rgba(140, 164, 184, 0.32);
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          display: inline-block;
          letter-spacing: 0.2px;
        }
        [data-theme='dark'] .store-badge {
          background: rgba(140, 164, 184, 0.12);
          color: #a5c2d9;
          border-color: rgba(140, 164, 184, 0.28);
        }

        .product-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 0.85rem; border-top: 1px dashed var(--accent-color); }
        .product-price { font-weight: 800; color: var(--brand-blue); margin: 0; }
        .product-action-btn {
          background: var(--brand-peach);
          color: var(--text-dark);
          border: none;
          padding: 0.6rem 1.1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .product-action-btn:hover { filter: brightness(0.95); transform: scale(1.02); }
        .product-action-btn:active { transform: scale(0.98); }
        .product-action-btn-full { width: 100%; text-align: center; }

        .pagination { display: flex; justify-content: center; align-items: center; gap: 1.25rem; margin-top: 2.5rem; flex-wrap: wrap; }
        .pagination-btn { width: auto; padding: 0.6rem 1.25rem; margin: 0; }
        .pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .pagination-info { color: var(--text-muted); font-weight: 600; font-size: 0.95rem; }

        .no-results-container { width: 100%; grid-column: 1/-1; text-align: center; padding: 3rem 1rem; }
        .no-results { color: var(--text-muted); font-size: 1.1rem; margin: 0 0 0.5rem 0; }
        .no-results-hint { color: var(--text-muted); font-size: 0.9rem; opacity: 0.85; margin: 0; }

        .error-banner-inline { background: #fee2e2; color: #dc2626; padding: 1rem 1.25rem; border-radius: 10px; font-weight: 600; display: inline-block; }

        .top-banner { margin-bottom: 1.5rem; text-align: center; }
        .auth-banner {
          display: inline-flex; align-items: center; gap: 1rem; flex-wrap: wrap;
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe; border-radius: 10px;
          padding: 0.75rem 1rem; font-weight: 600;
        }
        .auth-banner .btn { margin: 0; }

        .grid-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 1.75rem; }
        .card-skeleton {
          height: 380px; border-radius: 16px;
          background: linear-gradient(90deg, var(--secondary-color) 25%, rgba(0,0,0,0.05) 37%, var(--secondary-color) 63%);
          background-size: 400% 100%; animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          z-index: 200; padding: 1rem;
        }
        .modal-content {
          width: 100%; max-width: 520px;
          background: var(--white); border-radius: 16px; padding: 1.75rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal-title { font-size: 1.35rem; color: var(--text-dark); font-weight: 800; margin-bottom: 1.15rem; }

        .modal-stores-selection { margin-bottom: 1.25rem; }
        .modal-selection-title { display: block; margin-bottom: 0.6rem; font-size: 0.9rem; font-weight: 700; color: var(--text-dark); }
        .modal-stores-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 240px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .modal-product-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--secondary-color);
          border: 2px solid transparent;
          border-radius: 12px;
          margin-bottom: 1.25rem;
          transition: all 0.2s ease;
        }
        .modal-store-card {
          margin-bottom: 0;
          cursor: pointer;
          padding: 0.85rem 1rem;
        }
        .modal-store-card:hover {
          background: rgba(140, 164, 184, 0.12);
          border-color: rgba(140, 164, 184, 0.35);
        }
        .modal-store-card.selected {
          border-color: var(--brand-blue);
          background: rgba(140, 164, 184, 0.16);
          box-shadow: 0 2px 10px rgba(140, 164, 184, 0.2);
        }
        .store-radio-container {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .store-radio-container input[type="radio"] {
          accent-color: var(--brand-blue);
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .modal-store-details { flex: 1; }
        .modal-super-name { color: var(--brand-blue); font-weight: 700; }
        .modal-product-img { width: 68px; height: 68px; object-fit: contain; border-radius: 8px; background: var(--white); padding: 4px; }
        .modal-product-name { font-weight: 700; color: var(--text-dark); margin: 0 0 0.2rem 0; font-size: 0.95rem; line-height: 1.3; }
        .modal-product-brand { color: var(--text-muted); font-size: 0.82rem; margin: 0 0 0.25rem 0; }
        .modal-product-price { color: var(--brand-blue); font-weight: 800; font-size: 1.1rem; margin: 0; }
        .modal-fields { margin-bottom: 1rem; }
        .empty-lists-warning { text-align: center; padding: 1rem; background: #fff7ed; border: 1px dashed #fdba74; border-radius: 10px; color: #9a3412; }
        .empty-lists-warning p { margin: 0 0 0.75rem 0; font-size: 0.9rem; }
        .modal-success { background: #dcfce7; color: #166534; padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; font-size: 0.9rem; margin-bottom: 1rem; text-align: center; }
        .modal-actions { display: flex; gap: 0.75rem; }
        .btn-secondary { background-color: #e5e7eb; color: #374151; }
        .btn-secondary:hover { filter: brightness(0.95); }

        /* PrimeReact Alert Dialog Modern Styles */
        .modern-dialog-mask {
          background-color: rgba(15, 23, 42, 0.45) !important;
          backdrop-filter: blur(5px) !important;
          -webkit-backdrop-filter: blur(5px) !important;
        }

        .modern-alert-dialog.p-dialog {
          width: 90vw;
          max-width: 440px;
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.05);
          border: none;
          overflow: hidden;
        }

        [data-theme='dark'] .modern-alert-dialog.p-dialog {
          background: #1e293b;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.08);
        }

        .modern-alert-dialog .p-dialog-header {
          padding: 1.5rem 1.5rem 0.5rem 1.5rem;
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
        }

        .modern-alert-dialog .p-dialog-header-icons {
          margin-left: auto;
        }

        .modern-alert-dialog .p-dialog-header-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .modern-alert-dialog .p-dialog-header-close:hover {
          background: rgba(0, 0, 0, 0.05);
          color: var(--text-dark);
        }

        .alert-modal-header {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .alert-modal-icon-badge {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .alert-modal-icon-badge.warning {
          background: #fffbeb;
          color: #d97706;
          border: 1px solid #fde68a;
        }

        .alert-modal-icon-badge.info {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #bfdbfe;
        }

        .alert-modal-icon-badge.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }

        .alert-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-dark);
          letter-spacing: -0.01em;
        }

        .modern-alert-dialog .p-dialog-content {
          padding: 0.5rem 1.5rem 1.5rem 1.5rem;
          background: transparent;
        }

        .alert-modal-body {
          padding-left: calc(42px + 0.85rem);
        }

        @media (max-width: 480px) {
          .alert-modal-body {
            padding-left: 0;
          }
        }

        .alert-modal-message {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin: 0;
        }

        .modern-alert-dialog .p-dialog-footer {
          padding: 1rem 1.5rem;
          background: #f8fafc;
          border-top: 1px solid rgba(226, 232, 240, 0.8);
          display: flex;
          justify-content: flex-end;
        }

        [data-theme='dark'] .modern-alert-dialog .p-dialog-footer {
          background: rgba(15, 23, 42, 0.4);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .alert-modal-btn.p-button {
          background: var(--brand-blue);
          border: 1px solid var(--brand-blue);
          color: #ffffff;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.6rem 1.4rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(140, 164, 184, 0.35);
          outline: none;
        }

        .alert-modal-btn.p-button:hover {
          filter: brightness(0.92);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(140, 164, 184, 0.45);
        }

        .alert-modal-btn.p-button:active {
          transform: translateY(0);
        }

        @media (max-width: 600px) {
          .home-title { font-size: 1.8rem; }
          .home-content { padding: 0 1rem 3rem; }
          .product-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.2rem; }
          .filters-bar { gap: 1rem; }
        }
      `}</style>
    </>
  )
}
