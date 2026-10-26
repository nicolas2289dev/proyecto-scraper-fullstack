import { useState, useEffect, useMemo } from 'react';
import { productoApi } from '../api/productoApi';
import { supermercadoApi } from '../api/supermercadoApi';
import { listaApi, type ListaCompra } from '@/features/lists';
import type { Supermercado } from '@/shared/types';
import type { ProductoComparativo } from '../types/products.types';
import '../styles/comparativos.css';

export function ComparativosPage() {
  const [productos, setProductos] = useState<ProductoComparativo[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermercado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroMarca, setFiltroMarca] = useState('');
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroSupermercado, setFiltroSupermercado] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('desc');
  const [listOptions, setListOptions] = useState<ListaCompra[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductoComparativo | null>(null);
  const [selectedListId, setSelectedListId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProductosComparativos();
    fetchListas();
    supermercadoApi.getAll().then(setSupermarkets).catch(console.error);
  }, []);

  const fetchProductosComparativos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productoApi.obtenerComparativos();
      setProductos(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Error al cargar productos comparativos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchListas = async () => {
    try {
      const listas = await listaApi.getAll();
      setListOptions(listas);
    } catch (err) {
      console.error('Error cargando listas:', err);
    }
  };

  const supermercados = useMemo(() => {
    return [...new Set(productos.map((p) => p.supermercado))].sort();
  }, [productos]);

  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideProducto =
        !filtroProducto ||
        p.producto.toLowerCase().includes(filtroProducto.toLowerCase());
      const coincideMarca =
        !filtroMarca || p.marca.toLowerCase().includes(filtroMarca.toLowerCase());
      const coincideSupermercado =
        !filtroSupermercado || p.supermercado === filtroSupermercado;
      return coincideProducto && coincideMarca && coincideSupermercado;
    });
  }, [productos, filtroProducto, filtroMarca, filtroSupermercado]);

  const productosOrdenados = useMemo<ProductoComparativo[]>(() => {
    const list = [...productosFiltrados];
    if (sortOrder === 'asc') list.sort((a, b) => a.precio - b.precio);
    else if (sortOrder === 'desc') list.sort((a, b) => b.precio - a.precio);
    return list;
  }, [productosFiltrados, sortOrder]);

  const openAddModal = (product: ProductoComparativo) => {
    setSelectedProduct(product);
    setSelectedListId(listOptions.length ? listOptions[0].id : '');
    setQuantity(1);
    setShowModal(true);
    setSuccessMsg(null);
  };

  const handleAddToList = async () => {
    if (!selectedProduct || selectedListId === '') return;
    setAdding(true);
    try {
      const prods = await productoApi.buscar(selectedProduct.producto);
      if (prods.length > 0) {
        const matchedSuper = supermarkets.find(
          (s) =>
            s.nombre.toLowerCase().trim() ===
            selectedProduct.supermercado.toLowerCase().trim()
        );
        const prod = prods[0];
        const storeOffer = prod.tiendas?.find(
          (t) => t.supermercadoId === matchedSuper?.id
        );

        await listaApi.addItem(
          Number(selectedListId),
          prod.id,
          quantity,
          storeOffer?.supermercadoId ?? matchedSuper?.id
        );
        setSuccessMsg('¡Producto agregado a tu lista exitosamente!');
        setTimeout(() => setShowModal(false), 1200);
      } else {
        alert(
          'No se pudo encontrar el identificador de catálogo para este producto.'
        );
      }
    } catch (err) {
      console.error('Error agregando a lista:', err);
      alert('Error al agregar el producto a la lista');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="comparativos-container min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
            Comparador de Precios
          </h1>
          <p className="text-gray-400">
            Compará precios entre diferentes supermercados y ahorrá
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="bg-slate-800/60 backdrop-blur border border-slate-700/60 rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />

          <input
            type="text"
            placeholder="Filtrar por marca..."
            value={filtroMarca}
            onChange={(e) => setFiltroMarca(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
          />

          <select
            value={filtroSupermercado}
            onChange={(e) => setFiltroSupermercado(e.target.value)}
            className="comparativos-select px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            <option value="">Todos los supermercados</option>
            {supermercados.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value as 'default' | 'asc' | 'desc')
            }
            className="comparativos-select px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-400"
          >
            <option value="default">Orden por defecto</option>
            <option value="asc">Precio: Menor a Mayor</option>
            <option value="desc">Precio: Mayor a Menor</option>
          </select>
        </div>

        {/* Listado */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Cargando comparativos...
          </div>
        ) : productosOrdenados.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No se encontraron productos con los filtros seleccionados
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productosOrdenados.map((p, idx) => (
              <div
                key={`${p.producto}-${p.supermercado}-${idx}`}
                className="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500/50 transition-all flex flex-col"
              >
                <div className="h-48 bg-white flex items-center justify-center p-4">
                  <img
                    src={p.urlImagen || 'https://via.placeholder.com/200?text=Sin+imagen'}
                    alt={p.producto}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/200?text=Sin+imagen';
                    }}
                  />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-xs uppercase text-blue-400 font-semibold mb-1">
                    {p.marca} · {p.supermercado}
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-white line-clamp-2 flex-1">
                    {p.producto}
                  </h3>
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-700">
                    <span className="text-2xl font-black text-cyan-400">
                      ${Number(p.precio).toLocaleString('es-AR')}
                    </span>
                    <button
                      type="button"
                      onClick={() => openAddModal(p)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
                    >
                      + Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add to List */}
      {showModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => !adding && setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 text-white">
              Agregar a mi lista
            </h2>

            <div className="mb-4 p-3 bg-slate-700/50 rounded-lg">
              <p className="font-bold text-white text-sm">{selectedProduct.producto}</p>
              <p className="text-xs text-gray-400">
                {selectedProduct.marca} · {selectedProduct.supermercado}
              </p>
              <p className="text-lg font-extrabold text-cyan-400 mt-1">
                ${Number(selectedProduct.precio).toLocaleString('es-AR')}
              </p>
            </div>

            {listOptions.length === 0 ? (
              <p className="text-amber-300 text-sm mb-4">
                No tenés listas creadas. Andá a &quot;Mis Listas&quot; para crear una.
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                    Lista destino
                  </label>
                  <select
                    className="comparativos-select w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(Number(e.target.value) || '')}
                  >
                    <option value="">Seleccioná una lista</option>
                    {listOptions.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.favorita ? '⭐ ' : ''}
                        {l.nombreLista}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-6">
                  <label className="block text-xs uppercase font-bold text-gray-400 mb-1">
                    Cantidad
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-10 h-10 rounded-lg"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white text-center rounded-lg"
                      min={1}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-bold w-10 h-10 rounded-lg"
                    >
                      +
                    </button>
                  </div>
                </div>

                {successMsg && (
                  <div className="bg-emerald-900/60 border border-emerald-500 text-emerald-200 px-4 py-2 rounded-lg mb-4 text-center text-sm font-semibold">
                    ✅ {successMsg}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => !adding && setShowModal(false)}
                    className="flex-1 py-2.5 border border-slate-600 text-gray-300 rounded-xl hover:bg-slate-700 font-bold text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToList}
                    disabled={adding || selectedListId === ''}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm disabled:opacity-50"
                  >
                    {adding ? 'Agregando...' : 'Confirmar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ComparativosPage;
