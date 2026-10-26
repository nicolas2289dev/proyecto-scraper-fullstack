import { useState, useEffect, useRef, useTransition, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Supermercado } from '@/shared/types';
import type { ProductoBusqueda } from '../types/products.types';
import { productoApi } from '../api/productoApi';
import { supermercadoApi } from '../api/supermercadoApi';

export const PAGE_SIZE = 12;

export function useProductCatalog() {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [appliedSearch, setAppliedSearch] = useState(urlQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [filterSupermarket, setFilterSupermarket] = useState<number | 'all'>('all');
  const [filterMarca, setFilterMarca] = useState<string | 'all'>('all');
  const [availableMarcas, setAvailableMarcas] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'default' | 'asc' | 'desc'>('default');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyDiscount, setOnlyDiscount] = useState(false);

  const [supermarkets, setSupermarkets] = useState<Supermercado[]>([]);
  const [products, setProducts] = useState<ProductoBusqueda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [, startTransition] = useTransition();
  const searchDebounceRef = useRef<number | null>(null);

  // Sincronizar cuando cambia el parámetro de búsqueda en la URL
  useEffect(() => {
    setSearchTerm(urlQuery);
    setAppliedSearch(urlQuery);
    setPage(0);
  }, [urlQuery]);

  // Carga inicial de supermercados
  const fetchSupermarkets = useCallback(async () => {
    try {
      const data = await supermercadoApi.getAll();
      setSupermarkets(data);
      return data;
    } catch (err) {
      console.error('Error cargando supermercados:', err);
      setError('No se pudieron cargar los supermercados. Revisá la conexión con el backend.');
      return [];
    }
  }, []);

  // Búsqueda paginada y marcas
  const fetchProducts = useCallback(
    async (
      nombre: string,
      supermercadoId: number | 'all',
      pageNumber = 0,
      currentSortOrder = sortOrder,
      marca = filterMarca,
      categoriaId = selectedCategoryId
    ) => {
      try {
        setSearching(true);
        setError(null);
        const sid = supermercadoId === 'all' ? undefined : Number(supermercadoId);
        const m = marca === 'all' ? undefined : marca;
        const cid = categoriaId === 'all' ? undefined : Number(categoriaId);

        let sortParam: string | undefined = undefined;
        if (currentSortOrder === 'asc') sortParam = 'precio,asc';
        else if (currentSortOrder === 'desc') sortParam = 'precio,desc';

        const result = await productoApi.buscarPaginado(
          nombre || undefined,
          sid,
          pageNumber,
          PAGE_SIZE,
          sortParam,
          m,
          cid
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
    },
    [sortOrder, filterMarca, selectedCategoryId]
  );

  // Inicialización
  useEffect(() => {
    setLoading(true);
    fetchSupermarkets().then(() => {
      fetchProducts('', 'all', 0, 'default', 'all', 'all').finally(() => {
        setLoading(false);
      });
    });
  }, [fetchSupermarkets, fetchProducts]);

  // Debounce para filtros y búsqueda
  useEffect(() => {
    if (loading) return;

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      startTransition(() => {
        setAppliedSearch(searchTerm);
        setPage(0);
        fetchProducts(
          searchTerm,
          filterSupermarket,
          0,
          sortOrder,
          filterMarca,
          selectedCategoryId
        );
      });
    }, 350);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [
    searchTerm,
    filterSupermarket,
    sortOrder,
    filterMarca,
    selectedCategoryId,
    loading,
    fetchProducts,
  ]);

  // Cambiar de página
  const goToPage = useCallback(
    (newPage: number) => {
      setPage(newPage);
      fetchProducts(
        appliedSearch,
        filterSupermarket,
        newPage,
        sortOrder,
        filterMarca,
        selectedCategoryId
      );
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [appliedSearch, filterSupermarket, sortOrder, filterMarca, selectedCategoryId, fetchProducts]
  );

  // Limpiar todos los filtros
  const handleClearFilters = useCallback(() => {
    setSelectedCategoryId('all');
    setFilterMarca('all');
    setFilterSupermarket('all');
    setSortOrder('default');
    setMinPrice('');
    setMaxPrice('');
    setOnlyDiscount(false);
    setPage(0);
  }, []);

  // Handlers para resetear página automáticamente
  const handleCategoryChange = useCallback((val: number | 'all') => {
    setSelectedCategoryId(val);
    setPage(0);
  }, []);

  const handleMarcaChange = useCallback((val: string | 'all') => {
    setFilterMarca(val);
    setPage(0);
  }, []);

  const handleSupermarketChange = useCallback((val: number | 'all') => {
    setFilterSupermarket(val);
    setPage(0);
  }, []);

  const handleSortOrderChange = useCallback((val: 'default' | 'asc' | 'desc') => {
    setSortOrder(val);
    setPage(0);
  }, []);

  const handleDiscountToggle = useCallback((val: boolean) => {
    setOnlyDiscount(val);
    setPage(0);
  }, []);

  // Filtrado en memoria de precios y ofertas
  const filteredProducts = useMemo(() => {
    let list = products;
    const min = minPrice.trim() !== '' ? Number(minPrice) : null;
    const max = maxPrice.trim() !== '' ? Number(maxPrice) : null;

    if (min !== null && !isNaN(min)) {
      list = list.filter((p) => p.precio >= min);
    }
    if (max !== null && !isNaN(max)) {
      list = list.filter((p) => p.precio <= max);
    }
    if (onlyDiscount) {
      list = list.filter(
        (p) =>
          (p.tiendas && p.tiendas.length > 1) ||
          (p.descripcion && p.descripcion.toLowerCase().includes('oferta'))
      );
    }
    return list;
  }, [products, minPrice, maxPrice, onlyDiscount]);

  // Conteo de filtros activos
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategoryId !== 'all') count++;
    if (filterMarca !== 'all') count++;
    if (filterSupermarket !== 'all') count++;
    if (sortOrder !== 'default') count++;
    if (minPrice.trim() !== '' || maxPrice.trim() !== '') count++;
    if (onlyDiscount) count++;
    return count;
  }, [
    selectedCategoryId,
    filterMarca,
    filterSupermarket,
    sortOrder,
    minPrice,
    maxPrice,
    onlyDiscount,
  ]);

  // Cálculo de tarjetas totales según modo de visualización
  const calculateTotalCardsCount = useCallback(
    (viewMode: 'compacta' | 'clasica') => {
      const selectedSuperId = filterSupermarket !== 'all' ? Number(filterSupermarket) : null;

      if (viewMode === 'compacta') {
        return filteredProducts.length;
      }

      return filteredProducts.reduce((acc, p) => {
        if (!p.tiendas || p.tiendas.length === 0) return acc + 1;
        const filtered = selectedSuperId
          ? p.tiendas.filter((t) => t.supermercadoId === selectedSuperId)
          : p.tiendas;
        return acc + (filtered.length > 0 ? filtered.length : selectedSuperId ? 0 : 1);
      }, 0);
    },
    [filteredProducts, filterSupermarket]
  );

  return {
    searchTerm,
    setSearchTerm,
    appliedSearch,
    selectedCategoryId,
    setSelectedCategoryId: handleCategoryChange,
    filterSupermarket,
    setFilterSupermarket: handleSupermarketChange,
    filterMarca,
    setFilterMarca: handleMarcaChange,
    availableMarcas,
    sortOrder,
    setSortOrder: handleSortOrderChange,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    onlyDiscount,
    setOnlyDiscount: handleDiscountToggle,
    supermarkets,
    products,
    filteredProducts,
    loading,
    searching,
    error,
    page,
    totalPages,
    totalElements,
    activeFiltersCount,
    calculateTotalCardsCount,
    goToPage,
    handleClearFilters,
  };
}
