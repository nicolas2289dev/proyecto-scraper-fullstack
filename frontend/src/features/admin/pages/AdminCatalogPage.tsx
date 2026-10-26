import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../api/adminApi';
import type {
  CategoriaAdminDto,
  ProductoAdminDto,
  ProductoTiendaAdminDto,
  SupermercadoAdminDto,
  CriterioBusquedaAdminDto,
} from '../types/admin.types';
import { getErrorMessage } from '@/shared/lib/utils';
import '../styles/adminCatalog.css';

type TabType = 'CRITERIOS' | 'CATEGORIAS' | 'PRODUCTOS' | 'TIENDAS';

export default function AdminCatalogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('CRITERIOS');

  // Datos desde BD
  const [categorias, setCategorias] = useState<CategoriaAdminDto[]>([]);
  const [criterios, setCriterios] = useState<CriterioBusquedaAdminDto[]>([]);
  const [productos, setProductos] = useState<ProductoAdminDto[]>([]);
  const [productosTienda, setProductosTienda] = useState<ProductoTiendaAdminDto[]>([]);
  const [supermercados, setSupermercados] = useState<SupermercadoAdminDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroCatId, setFiltroCatId] = useState<string>('TODAS');
  const [filtroSuperId, setFiltroSuperId] = useState<string>('TODOS');
  const [productosSeleccionados, setProductosSeleccionados] = useState<number[]>([]);

  // Modales de Categoría (Crear / Editar)
  const [modalCategoria, setModalCategoria] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<CategoriaAdminDto | null>(null);
  const [formCatNombre, setFormCatNombre] = useState('');

  // Modales de Criterio de Búsqueda (Crear / Editar)
  const [modalCriterio, setModalCriterio] = useState(false);
  const [criterioEditando, setCriterioEditando] = useState<CriterioBusquedaAdminDto | null>(null);
  const [formCritTermino, setFormCritTermino] = useState('');
  const [formCritCatId, setFormCritCatId] = useState('');

  // Modales de Producto Maestro (Crear / Editar)
  const [modalProducto, setModalProducto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<ProductoAdminDto | null>(null);
  const [formProd, setFormProd] = useState({
    nombreGenerico: '',
    marca: '',
    varianteEspecifica: '',
    pesoValor: '',
    pesoUnidad: 'g',
    categoriaId: '',
  });

  // Modal Vincular a Supermercado
  const [modalVincular, setModalVincular] = useState(false);
  const [formVincular, setFormVincular] = useState({
    productoId: '',
    supermercadoId: '',
    urlEspecifica: '',
    codigoExterno: '',
    urlImagen: '',
  });

  // Modal Confirmar Eliminación Genérico
  const [modalEliminar, setModalEliminar] = useState<{
    tipo: 'CATEGORIA' | 'CRITERIO' | 'PRODUCTO' | 'TIENDA';
    id: number;
    nombre: string;
  } | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, crits, prodsRes, pts, supers] = await Promise.all([
        adminApi.getCategorias(),
        adminApi.getCriteriosBusqueda(),
        adminApi.getProductos({ size: 1000 }),
        adminApi.getProductosTienda(),
        adminApi.getSupermercados(),
      ]);

      setCategorias(cats);
      setCriterios(crits);
      setProductos(prodsRes?.content || []);
      setProductosTienda(pts);
      setSupermercados(supers);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al conectar con la base de datos'));
    } finally {
      setLoading(false);
    }
  };

  const notificarExito = (msg: string) => {
    setSuccessMsg(msg);
    setError(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CRUD CATEGORÍAS
  // ══════════════════════════════════════════════════════════════════════════
  const abrirCrearCategoria = () => {
    setCategoriaEditando(null);
    setFormCatNombre('');
    setFormErrors({});
    setModalCategoria(true);
  };

  const abrirEditarCategoria = (c: CategoriaAdminDto) => {
    setCategoriaEditando(c);
    setFormCatNombre(c.nombre);
    setFormErrors({});
    setModalCategoria(true);
  };

  const handleGuardarCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCatNombre.trim()) {
      setFormErrors({ nombre: 'El nombre de la categoría es obligatorio' });
      return;
    }

    setProcesando(true);
    setFormErrors({});
    try {
      if (categoriaEditando) {
        await adminApi.actualizarCategoria(categoriaEditando.id, formCatNombre.trim());
        notificarExito(`Categoría "${formCatNombre}" actualizada exitosamente.`);
      } else {
        await adminApi.crearCategoria(formCatNombre.trim());
        notificarExito(`Categoría "${formCatNombre}" creada exitosamente en la base de datos.`);
      }
      setModalCategoria(false);
      await cargarTodo();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al procesar la categoría'));
    } finally {
      setProcesando(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CRUD CRITERIOS DE BÚSQUEDA (SCRAPER)
  // ══════════════════════════════════════════════════════════════════════════
  const abrirCrearCriterio = () => {
    setCriterioEditando(null);
    setFormCritTermino('');
    setFormCritCatId(categorias.length > 0 ? categorias[0].id.toString() : '');
    setFormErrors({});
    setModalCriterio(true);
  };

  const abrirEditarCriterio = (cr: CriterioBusquedaAdminDto) => {
    setCriterioEditando(cr);
    setFormCritTermino(cr.terminoBusqueda);
    setFormCritCatId(cr.categoriaId.toString());
    setFormErrors({});
    setModalCriterio(true);
  };

  const handleGuardarCriterio = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formCritTermino.trim()) errs.terminoBusqueda = 'El término de búsqueda es obligatorio';
    if (!formCritCatId) errs.categoriaId = 'Selecciona una categoría';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setProcesando(true);
    setFormErrors({});
    try {
      if (criterioEditando) {
        await adminApi.actualizarCriterioBusqueda(criterioEditando.id, {
          terminoBusqueda: formCritTermino.trim(),
          categoriaId: Number(formCritCatId),
        });
        notificarExito(`Criterio de búsqueda "${formCritTermino}" actualizado con éxito.`);
      } else {
        await adminApi.crearCriterioBusqueda({
          terminoBusqueda: formCritTermino.trim(),
          categoriaId: Number(formCritCatId),
        });
        notificarExito(`Criterio de búsqueda "${formCritTermino}" guardado para el Scraper.`);
      }
      setModalCriterio(false);
      await cargarTodo();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al guardar criterio de búsqueda'));
    } finally {
      setProcesando(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CRUD PRODUCTOS MAESTROS
  // ══════════════════════════════════════════════════════════════════════════
  const abrirCrearProducto = () => {
    setProductoEditando(null);
    setFormProd({
      nombreGenerico: '',
      marca: '',
      varianteEspecifica: '',
      pesoValor: '',
      pesoUnidad: 'g',
      categoriaId: categorias.length > 0 ? categorias[0].id.toString() : '',
    });
    setFormErrors({});
    setModalProducto(true);
  };

  const abrirEditarProducto = (p: ProductoAdminDto) => {
    setProductoEditando(p);
    setFormProd({
      nombreGenerico: p.nombreGenerico,
      marca: p.marca || '',
      varianteEspecifica: p.varianteEspecifica || '',
      pesoValor: p.pesoValor !== undefined && p.pesoValor !== null ? p.pesoValor.toString() : '',
      pesoUnidad: p.pesoUnidad || 'g',
      categoriaId: p.categoriaId.toString(),
    });
    setFormErrors({});
    setModalProducto(true);
  };

  const handleGuardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formProd.nombreGenerico.trim()) errs.nombreGenerico = 'El nombre genérico es obligatorio';
    if (!formProd.categoriaId) errs.categoriaId = 'Selecciona una categoría';
    if (formProd.pesoValor && isNaN(Number(formProd.pesoValor))) {
      errs.pesoValor = 'El peso debe ser numérico';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setProcesando(true);
    setFormErrors({});
    try {
      const payload = {
        nombreGenerico: formProd.nombreGenerico.trim(),
        marca: formProd.marca.trim() || undefined,
        varianteEspecifica: formProd.varianteEspecifica.trim() || undefined,
        pesoValor: formProd.pesoValor ? Number(formProd.pesoValor) : undefined,
        pesoUnidad: formProd.pesoUnidad || undefined,
        categoriaId: Number(formProd.categoriaId),
      };

      if (productoEditando) {
        await adminApi.actualizarProducto(productoEditando.id, payload);
        notificarExito(`Producto maestro "${payload.nombreGenerico}" actualizado.`);
      } else {
        await adminApi.crearProducto(payload);
        notificarExito(`Producto maestro "${payload.nombreGenerico}" registrado con éxito.`);
      }
      setModalProducto(false);
      await cargarTodo();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al guardar el producto maestro'));
    } finally {
      setProcesando(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CRUD ASIGNACIÓN A SUPERMERCADOS (PRODUCTO TIENDA)
  // ══════════════════════════════════════════════════════════════════════════
  const abrirVincularTienda = (prodId?: number) => {
    setFormVincular({
      productoId: prodId ? prodId.toString() : (productos.length > 0 ? productos[0].id.toString() : ''),
      supermercadoId: supermercados.length > 0 ? supermercados[0].id.toString() : '',
      urlEspecifica: '',
      codigoExterno: '',
      urlImagen: '',
    });
    setFormErrors({});
    setModalVincular(true);
  };

  const handleGuardarVinculacion = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!formVincular.productoId) errs.productoId = 'Selecciona un producto maestro';
    if (!formVincular.supermercadoId) errs.supermercadoId = 'Selecciona un supermercado';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setProcesando(true);
    setFormErrors({});
    try {
      await adminApi.crearProductoTienda({
        productoId: Number(formVincular.productoId),
        supermercadoId: Number(formVincular.supermercadoId),
        urlEspecifica: formVincular.urlEspecifica.trim() || undefined,
        codigoExterno: formVincular.codigoExterno.trim() || undefined,
        urlImagen: formVincular.urlImagen.trim() || undefined,
      });
      notificarExito('Asignación de producto a supermercado guardada con éxito.');
      setModalVincular(false);
      await cargarTodo();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al vincular producto a supermercado'));
    } finally {
      setProcesando(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ELIMINACIÓN GENERAL
  // ══════════════════════════════════════════════════════════════════════════
  const ejecutarEliminacion = async () => {
    if (!modalEliminar) return;
    setProcesando(true);
    setError(null);
    try {
      const { tipo, id, nombre } = modalEliminar;
      if (tipo === 'CATEGORIA') {
        await adminApi.eliminarCategoria(id);
        notificarExito(`Categoría "${nombre}" eliminada correctamente.`);
      } else if (tipo === 'CRITERIO') {
        await adminApi.eliminarCriterioBusqueda(id);
        notificarExito(`Criterio de búsqueda "${nombre}" eliminado.`);
      } else if (tipo === 'PRODUCTO') {
        await adminApi.eliminarProducto(id);
        notificarExito(`Producto maestro "${nombre}" eliminado.`);
      } else if (tipo === 'TIENDA') {
        await adminApi.eliminarProductoTienda(id);
        notificarExito(`Asignación a supermercado eliminada.`);
      }
      setModalEliminar(null);
      await cargarTodo();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo completar la eliminación'));
      setModalEliminar(null);
    } finally {
      setProcesando(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // FILTRADOS EN CLIENTE
  // ══════════════════════════════════════════════════════════════════════════
  const criteriosFiltrados = useMemo(() => {
    return criterios.filter((cr) => {
      const matchTexto =
        !filtroTexto ||
        cr.terminoBusqueda.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (cr.categoriaNombre && cr.categoriaNombre.toLowerCase().includes(filtroTexto.toLowerCase()));
      const matchCat = filtroCatId === 'TODAS' || cr.categoriaId.toString() === filtroCatId;
      return matchTexto && matchCat;
    });
  }, [criterios, filtroTexto, filtroCatId]);

  const categoriasFiltradas = useMemo(() => {
    return categorias.filter((c) =>
      !filtroTexto || c.nombre.toLowerCase().includes(filtroTexto.toLowerCase())
    );
  }, [categorias, filtroTexto]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const matchNom =
        !filtroTexto ||
        p.nombreGenerico.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        (p.marca && p.marca.toLowerCase().includes(filtroTexto.toLowerCase())) ||
        (p.varianteEspecifica && p.varianteEspecifica.toLowerCase().includes(filtroTexto.toLowerCase()));
      const matchCat = filtroCatId === 'TODAS' || p.categoriaId.toString() === filtroCatId;
      return matchNom && matchCat;
    });
  }, [productos, filtroTexto, filtroCatId]);

  const toggleProductoSeleccionado = (id: number) => {
    setProductosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const seleccionarTodosVisibles = () => {
    const idsVisibles = productosFiltrados.map((p) => p.id);
    const estanTodosSeleccionados = idsVisibles.length > 0 && idsVisibles.every((id) => productosSeleccionados.includes(id));

    if (estanTodosSeleccionados) {
      setProductosSeleccionados((prev) => prev.filter((id) => !idsVisibles.includes(id)));
      return;
    }

    setProductosSeleccionados((prev) => Array.from(new Set([...prev, ...idsVisibles])));
  };

  const eliminarSeleccionados = async () => {
    if (!productosSeleccionados.length) return;

    setProcesando(true);
    try {
      await adminApi.eliminarProductos(productosSeleccionados);
      setProductosSeleccionados([]);
      notificarExito(`Se eliminaron ${productosSeleccionados.length} producto${productosSeleccionados.length > 1 ? 's' : ''} del catálogo maestro.`);
      await cargarTodo();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudieron eliminar los productos seleccionados'));
    } finally {
      setProcesando(false);
    }
  };

  const tiendasFiltradas = useMemo(() => {
    return productosTienda.filter((pt) => {
      const matchSup = filtroSuperId === 'TODOS' || pt.supermercadoId.toString() === filtroSuperId;
      const matchNom =
        !filtroTexto ||
        (pt.productoNombre && pt.productoNombre.toLowerCase().includes(filtroTexto.toLowerCase())) ||
        (pt.productoMarca && pt.productoMarca.toLowerCase().includes(filtroTexto.toLowerCase()));
      return matchSup && matchNom;
    });
  }, [productosTienda, filtroSuperId, filtroTexto]);

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header">
        <div>
          <span className="admin-badge-cu">CU-10</span>
          <h1 className="admin-title">Gestión de Catálogo y Extractor</h1>
          <p className="admin-subtitle">
            Administración de Criterios de Búsqueda (Scraper), Categorías Comerciales, Catálogo Maestro y Supermercados.
          </p>
        </div>
        <button onClick={cargarTodo} className="btn-refresh" title="Sincronizar base de datos" disabled={loading}>
          🔄 Sincronizar
        </button>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="alert-banner alert-success">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert-close">✕</button>
        </div>
      )}

      {/* Pestañas Principales */}
      <div className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'CRITERIOS' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('CRITERIOS')}
        >
          🔎 Criterios de Búsqueda (Scraper) <span className="tab-count">({criterios.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'CATEGORIAS' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('CATEGORIAS')}
        >
          🏷️ Categorías Comerciales <span className="tab-count">({categorias.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'PRODUCTOS' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('PRODUCTOS')}
        >
          📦 Catálogo Maestro <span className="tab-count">({productos.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'TIENDAS' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('TIENDAS')}
        >
          🏪 Asignación a Supermercados <span className="tab-count">({productosTienda.length})</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          PESTAÑA 1: CRITERIOS DE BÚSQUEDA (TABLA criterios_busqueda)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'CRITERIOS' && (
        <div className="tab-content">
          <div className="action-bar">
            <div className="filters-group">
              <input
                type="text"
                placeholder="Buscar criterio o categoría..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="input-search"
              />
              <select
                value={filtroCatId}
                onChange={(e) => setFiltroCatId(e.target.value)}
                className="select-filter"
              >
                <option value="TODAS">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <button onClick={abrirCrearCriterio} className="btn-primary-action">
              + Agregar Criterio de Búsqueda
            </button>
          </div>

          <p className="tab-helper-text">
            ℹ️ Estos términos alimentan la matriz cartesiana <code>supermercados × criterios_busqueda</code>. El bot de Python los utiliza en su Modo Descubrimiento para rastrear y extraer productos automáticamente.
          </p>

          <div className="table-wrapper">
            {loading ? (
              <div className="loading-state"><div className="spinner"></div><p>Cargando criterios de búsqueda...</p></div>
            ) : criteriosFiltrados.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🔎</span>
                <p>No se encontraron criterios de búsqueda registrados en la tabla <code>criterios_busqueda</code>.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Término / Palabra Clave (Scraper)</th>
                    <th>Categoría Asociada</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {criteriosFiltrados.map((cr) => (
                    <tr key={cr.id}>
                      <td className="cell-id">#{cr.id}</td>
                      <td>
                        <span className="keyword-highlight">🔍 "{cr.terminoBusqueda}"</span>
                      </td>
                      <td>
                        <span className="category-pill">
                          {cr.categoriaNombre || `ID Categoría: ${cr.categoriaId}`}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-row">
                          <button
                            onClick={() => abrirEditarCriterio(cr)}
                            className="btn-edit"
                            title="Modificar término o categoría"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() =>
                              setModalEliminar({
                                tipo: 'CRITERIO',
                                id: cr.id,
                                nombre: cr.terminoBusqueda,
                              })
                            }
                            className="btn-delete"
                            title="Eliminar criterio de búsqueda"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PESTAÑA 2: CATEGORÍAS COMERCIALES (TABLA categorias)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'CATEGORIAS' && (
        <div className="tab-content">
          <div className="action-bar">
            <div className="filters-group">
              <input
                type="text"
                placeholder="Buscar categoría por nombre..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="input-search"
              />
            </div>

            <button onClick={abrirCrearCategoria} className="btn-primary-action">
              + Agregar Nueva Categoría
            </button>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <div className="loading-state"><div className="spinner"></div><p>Cargando categorías...</p></div>
            ) : categoriasFiltradas.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏷️</span>
                <p>No se encontraron categorías comerciales en la base de datos.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th>Nombre de la Categoría</th>
                    <th>Criterios Scraper Asociados</th>
                    <th>Productos Maestros</th>
                    <th style={{ textAlign: 'center', width: '180px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categoriasFiltradas.map((c) => {
                    const cantCriterios = criterios.filter((cr) => cr.categoriaId === c.id).length;
                    const cantProductos = productos.filter((p) => p.categoriaId === c.id).length;

                    return (
                      <tr key={c.id}>
                        <td className="cell-id">#{c.id}</td>
                        <td>
                          <span className="product-title">🏷️ {c.nombre}</span>
                        </td>
                        <td>
                          <span className="unit-badge">🔎 {cantCriterios} términos</span>
                        </td>
                        <td>
                          <span className="unit-badge">📦 {cantProductos} productos</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="action-buttons-row">
                            <button
                              onClick={() => abrirEditarCategoria(c)}
                              className="btn-edit"
                              title="Modificar nombre de la categoría"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() =>
                                setModalEliminar({
                                  tipo: 'CATEGORIA',
                                  id: c.id,
                                  nombre: c.nombre,
                                })
                              }
                              className="btn-delete"
                              title="Eliminar categoría"
                            >
                              🗑️ Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PESTAÑA 3: CATÁLOGO MAESTRO (TABLA productos)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PRODUCTOS' && (
        <div className="tab-content">
          <div className="action-bar">
            <div className="filters-group">
              <input
                type="text"
                placeholder="Buscar por nombre, marca o variante..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="input-search"
              />
              <select
                value={filtroCatId}
                onChange={(e) => setFiltroCatId(e.target.value)}
                className="select-filter"
              >
                <option value="TODAS">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div className="bulk-actions-row">
              <button
                type="button"
                onClick={seleccionarTodosVisibles}
                className="btn-secondary-action"
                disabled={productosFiltrados.length === 0 || procesando}
              >
                {productosFiltrados.length > 0 && productosFiltrados.every((p) => productosSeleccionados.includes(p.id))
                  ? 'Deseleccionar visibles'
                  : 'Seleccionar visibles'}
              </button>

              <button
                type="button"
                onClick={eliminarSeleccionados}
                className="btn-delete"
                disabled={productosSeleccionados.length === 0 || procesando}
              >
                🗑️ Eliminar seleccionados ({productosSeleccionados.length})
              </button>
            </div>

            <button onClick={abrirCrearProducto} className="btn-primary-action">
              + Agregar Producto Maestro
            </button>
          </div>

          <div className="table-wrapper">
            {loading ? (
              <div className="loading-state"><div className="spinner"></div><p>Cargando productos maestros...</p></div>
            ) : productosFiltrados.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📦</span>
                <p>No se encontraron productos maestros con los filtros aplicados.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={productosFiltrados.length > 0 && productosFiltrados.every((p) => productosSeleccionados.includes(p.id))}
                        onChange={seleccionarTodosVisibles}
                        aria-label="Seleccionar todos los productos visibles"
                      />
                    </th>
                    <th>ID</th>
                    <th>Producto Genérico</th>
                    <th>Marca</th>
                    <th>Variante</th>
                    <th>Magnitud</th>
                    <th>Categoría</th>
                    <th style={{ textAlign: 'center', width: '220px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={productosSeleccionados.includes(p.id)}
                          onChange={() => toggleProductoSeleccionado(p.id)}
                          aria-label={`Seleccionar producto ${p.nombreGenerico}`}
                        />
                      </td>
                      <td className="cell-id">#{p.id}</td>
                      <td>
                        <span className="product-title">{p.nombreGenerico}</span>
                      </td>
                      <td>{p.marca || <span className="text-muted">Sin marca</span>}</td>
                      <td>{p.varianteEspecifica || <span className="text-muted">-</span>}</td>
                      <td>
                        {p.pesoValor ? (
                          <span className="unit-badge">
                            {p.pesoValor} {p.pesoUnidad}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className="category-pill">{p.categoriaNombre || `ID: ${p.categoriaId}`}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons-row">
                          <button
                            onClick={() => abrirVincularTienda(p.id)}
                            className="btn-link-store"
                            title="Asignar este producto a un supermercado"
                          >
                            🏪 Tienda
                          </button>
                          <button
                            onClick={() => abrirEditarProducto(p)}
                            className="btn-edit"
                            title="Editar producto maestro"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              setModalEliminar({
                                tipo: 'PRODUCTO',
                                id: p.id,
                                nombre: `${p.nombreGenerico} ${p.marca || ''}`,
                              })
                            }
                            className="btn-delete"
                            title="Eliminar producto"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PESTAÑA 4: ASIGNACIÓN A SUPERMERCADOS (TABLA productos_tienda)
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'TIENDAS' && (
        <div className="tab-content">
          <div className="action-bar">
            <div className="filters-group">
              <input
                type="text"
                placeholder="Buscar producto asignado..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="input-search"
              />
              <select
                value={filtroSuperId}
                onChange={(e) => setFiltroSuperId(e.target.value)}
                className="select-filter"
              >
                <option value="TODOS">Todos los supermercados</option>
                {supermercados.map((s) => (
                  <option key={s.id} value={s.id.toString()}>{s.nombre}</option>
                ))}
              </select>
            </div>

            <button onClick={() => abrirVincularTienda()} className="btn-primary-action">
              + Vincular Producto a Tienda
            </button>
          </div>

          <div className="table-wrapper">
            {tiendasFiltradas.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🏪</span>
                <p>No hay asignaciones de productos a supermercados.</p>
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Supermercado</th>
                    <th>Producto Maestro</th>
                    <th>URL Scraping</th>
                    <th>Imagen</th>
                    <th style={{ textAlign: 'center', width: '100px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tiendasFiltradas.map((pt) => (
                    <tr key={pt.id}>
                      <td className="cell-id">#{pt.id}</td>
                      <td>
                        <span className="supermarket-tag">{pt.supermercadoNombre || `ID: ${pt.supermercadoId}`}</span>
                      </td>
                      <td>
                        <span className="product-title">{pt.productoNombre}</span>
                        {pt.productoMarca && <span className="brand-subtitle"> ({pt.productoMarca})</span>}
                      </td>
                      <td className="cell-url">
                        {pt.urlEspecifica ? (
                          <a href={pt.urlEspecifica} target="_blank" rel="noopener noreferrer" className="url-link">
                            🔗 {pt.urlEspecifica.substring(0, 40)}...
                          </a>
                        ) : (
                          <span className="text-muted">Búsqueda dinámica</span>
                        )}
                      </td>
                      <td>
                        {pt.urlImagen ? (
                          <span className="img-badge">📷 Sí</span>
                        ) : (
                          <span className="text-muted">No</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() =>
                            setModalEliminar({
                              tipo: 'TIENDA',
                              id: pt.id,
                              nombre: `${pt.productoNombre} en ${pt.supermercadoNombre}`,
                            })
                          }
                          className="btn-delete"
                          title="Eliminar asignación"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CATEGORÍA (CREAR / EDITAR)
      ══════════════════════════════════════════════════════════════════════ */}
      {modalCategoria && (
        <div className="modal-overlay" onClick={() => !procesando && setModalCategoria(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">🏷️</span>
              <h3>{categoriaEditando ? 'Modificar Categoría' : 'Nueva Categoría Comercial'}</h3>
            </div>

            <form onSubmit={handleGuardarCategoria}>
              <div className="form-group">
                <label className="form-label">
                  Nombre de la Categoría <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${formErrors.nombre ? 'input-error' : ''}`}
                  placeholder="Ej. Lácteos, Bebidas, Almacén, Limpieza"
                  value={formCatNombre}
                  onChange={(e) => setFormCatNombre(e.target.value)}
                  autoFocus
                />
                {formErrors.nombre && <span className="error-text">{formErrors.nombre}</span>}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setModalCategoria(false)}
                  className="btn-modal-cancel"
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-confirm btn-modal-success" disabled={procesando}>
                  {procesando ? 'Guardando...' : categoriaEditando ? '💾 Actualizar' : '💾 Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CRITERIO DE BÚSQUEDA (CREAR / EDITAR)
      ══════════════════════════════════════════════════════════════════════ */}
      {modalCriterio && (
        <div className="modal-overlay" onClick={() => !procesando && setModalCriterio(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">🔎</span>
              <h3>{criterioEditando ? 'Modificar Criterio de Scraping' : 'Nuevo Criterio de Búsqueda'}</h3>
            </div>

            <form onSubmit={handleGuardarCriterio}>
              <div className="form-group">
                <label className="form-label">
                  Palabra / Término Clave (Ej. "fideos", "leche") <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${formErrors.terminoBusqueda ? 'input-error' : ''}`}
                  placeholder="Ej. fideo, leche, arroz, atun, yerba"
                  value={formCritTermino}
                  onChange={(e) => setFormCritTermino(e.target.value)}
                  autoFocus
                />
                {formErrors.terminoBusqueda && <span className="error-text">{formErrors.terminoBusqueda}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Categoría Asociada <span className="req">*</span>
                </label>
                <select
                  className={`form-input ${formErrors.categoriaId ? 'input-error' : ''}`}
                  value={formCritCatId}
                  onChange={(e) => setFormCritCatId(e.target.value)}
                >
                  <option value="">-- Seleccionar categoría --</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id.toString()}>{c.nombre}</option>
                  ))}
                </select>
                {formErrors.categoriaId && <span className="error-text">{formErrors.categoriaId}</span>}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setModalCriterio(false)}
                  className="btn-modal-cancel"
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-confirm btn-modal-success" disabled={procesando}>
                  {procesando ? 'Guardando...' : criterioEditando ? '💾 Actualizar' : '💾 Guardar Criterio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: PRODUCTO MAESTRO (CREAR / EDITAR)
      ══════════════════════════════════════════════════════════════════════ */}
      {modalProducto && (
        <div className="modal-overlay" onClick={() => !procesando && setModalProducto(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">📦</span>
              <h3>{productoEditando ? 'Modificar Producto Maestro' : 'Registrar Producto Maestro'}</h3>
            </div>

            <form onSubmit={handleGuardarProducto}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">
                    Nombre Genérico <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-input ${formErrors.nombreGenerico ? 'input-error' : ''}`}
                    placeholder="Ej. Fideos, Leche Entera, Harina 000"
                    value={formProd.nombreGenerico}
                    onChange={(e) => setFormProd({ ...formProd, nombreGenerico: e.target.value })}
                  />
                  {formErrors.nombreGenerico && <span className="error-text">{formErrors.nombreGenerico}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Marca Comercial</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Matarazzo, La Serenísima, Pureza"
                    value={formProd.marca}
                    onChange={(e) => setFormProd({ ...formProd, marca: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Variante / Formato</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Spaghetti, Tallarines, Descremada"
                    value={formProd.varianteEspecifica}
                    onChange={(e) => setFormProd({ ...formProd, varianteEspecifica: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Peso o Volumen</label>
                  <input
                    type="number"
                    step="any"
                    className={`form-input ${formErrors.pesoValor ? 'input-error' : ''}`}
                    placeholder="Ej. 500, 1, 750"
                    value={formProd.pesoValor}
                    onChange={(e) => setFormProd({ ...formProd, pesoValor: e.target.value })}
                  />
                  {formErrors.pesoValor && <span className="error-text">{formErrors.pesoValor}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Unidad</label>
                  <select
                    className="form-input"
                    value={formProd.pesoUnidad}
                    onChange={(e) => setFormProd({ ...formProd, pesoUnidad: e.target.value })}
                  >
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="l">Litros (l)</option>
                    <option value="cc">Centímetros Cúbicos (cc)</option>
                    <option value="un">Unidades (un)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">
                    Categoría Comercial <span className="req">*</span>
                  </label>
                  <select
                    className={`form-input ${formErrors.categoriaId ? 'input-error' : ''}`}
                    value={formProd.categoriaId}
                    onChange={(e) => setFormProd({ ...formProd, categoriaId: e.target.value })}
                  >
                    <option value="">-- Seleccionar categoría --</option>
                    {categorias.map((c) => (
                      <option key={c.id} value={c.id.toString()}>{c.nombre}</option>
                    ))}
                  </select>
                  {formErrors.categoriaId && <span className="error-text">{formErrors.categoriaId}</span>}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setModalProducto(false)}
                  className="btn-modal-cancel"
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-confirm btn-modal-success" disabled={procesando}>
                  {procesando ? 'Guardando...' : productoEditando ? '💾 Actualizar' : '💾 Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: VINCULAR PRODUCTO A TIENDA
      ══════════════════════════════════════════════════════════════════════ */}
      {modalVincular && (
        <div className="modal-overlay" onClick={() => !procesando && setModalVincular(false)}>
          <div className="modal-card modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">🏪</span>
              <h3>Asignar Producto Maestro a Supermercado</h3>
            </div>

            <form onSubmit={handleGuardarVinculacion}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">
                    Producto Maestro <span className="req">*</span>
                  </label>
                  <select
                    className={`form-input ${formErrors.productoId ? 'input-error' : ''}`}
                    value={formVincular.productoId}
                    onChange={(e) => setFormVincular({ ...formVincular, productoId: e.target.value })}
                  >
                    <option value="">-- Seleccionar producto maestro --</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id.toString()}>
                        {p.nombreGenerico} {p.marca ? `- ${p.marca}` : ''} {p.varianteEspecifica ? `(${p.varianteEspecifica})` : ''} {p.pesoValor ? `[${p.pesoValor}${p.pesoUnidad}]` : ''}
                      </option>
                    ))}
                  </select>
                  {formErrors.productoId && <span className="error-text">{formErrors.productoId}</span>}
                </div>

                <div className="form-group full-width">
                  <label className="form-label">
                    Supermercado Destino <span className="req">*</span>
                  </label>
                  <select
                    className={`form-input ${formErrors.supermercadoId ? 'input-error' : ''}`}
                    value={formVincular.supermercadoId}
                    onChange={(e) => setFormVincular({ ...formVincular, supermercadoId: e.target.value })}
                  >
                    <option value="">-- Seleccionar supermercado --</option>
                    {supermercados.map((s) => (
                      <option key={s.id} value={s.id.toString()}>{s.nombre} ({s.urlBase})</option>
                    ))}
                  </select>
                  {formErrors.supermercadoId && <span className="error-text">{formErrors.supermercadoId}</span>}
                </div>

                <div className="form-group full-width">
                  <label className="form-label">URL Específica de Scraping (Opcional)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://tienda.com.ar/producto-ejemplo/p"
                    value={formVincular.urlEspecifica}
                    onChange={(e) => setFormVincular({ ...formVincular, urlEspecifica: e.target.value })}
                  />
                  <span className="field-hint">
                    Dejar en blanco para que el Scraper resuelva el enlace automáticamente por búsqueda.
                  </span>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">URL de Imagen (Opcional)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://.../imagen.jpg"
                    value={formVincular.urlImagen}
                    onChange={(e) => setFormVincular({ ...formVincular, urlImagen: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setModalVincular(false)}
                  className="btn-modal-cancel"
                  disabled={procesando}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-confirm btn-modal-success" disabled={procesando}>
                  {procesando ? 'Guardando...' : '🔗 Asignar a Supermercado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CONFIRMAR ELIMINACIÓN
      ══════════════════════════════════════════════════════════════════════ */}
      {modalEliminar && (
        <div className="modal-overlay" onClick={() => !procesando && setModalEliminar(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">⚠️</span>
              <h3>Confirmar Eliminación</h3>
            </div>

            <div className="modal-body">
              <p>
                ¿Estás seguro de que deseas eliminar permanentemente{' '}
                <strong>"{modalEliminar.nombre}"</strong> de la base de datos?
              </p>
              <div className="warning-notice">
                ⚠️ Esta acción no se puede deshacer y afectará las consultas del Scraper y el Catálogo.
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setModalEliminar(null)}
                className="btn-modal-cancel"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={ejecutarEliminacion}
                className="btn-modal-confirm btn-modal-danger"
                disabled={procesando}
              >
                {procesando ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
