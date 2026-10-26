import apiClient from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import type {
  ProductoBusqueda,
  PaginaProductos,
  ProductoComparativo,
} from '../types/products.types';

const buildImageUrl = (fallback?: string) => {
  if (fallback) return fallback;
  return undefined;
};

interface RawProducto {
  id?: number | string;
  productoId?: number | string;
  productoMaestroId?: number | string;
  nombreGenerico?: string;
  nombre?: string;
  marca?: string;
  precio?: number | string;
  precioActual?: number | string;
  urlImagen?: string;
  supermercado?: string;
  nombreSupermercado?: string;
  supermercadoNombre?: string;
  descripcion?: string | null;
  categoria?: string;
  pesoValor?: number;
  pesoUnidad?: string;
  varianteEspecifica?: string;
  urlEspecifica?: string;
  tiendas?: Array<{
    productoId?: number | string;
    supermercadoId?: number | string;
    supermercadoNombre?: string;
    precio?: number | string;
    urlImagen?: string;
    urlEspecifica?: string;
  }>;
}

const normalizeProducto = (raw: RawProducto): ProductoBusqueda => ({
  id: Number(raw?.id ?? raw?.productoId ?? raw?.productoMaestroId ?? 0),
  nombreGenerico: raw?.nombreGenerico ?? raw?.nombre ?? 'Producto sin nombre',
  marca: raw?.marca ?? 'Sin marca',
  precio: Number(raw?.precio ?? raw?.precioActual ?? 0),
  urlImagen: buildImageUrl(raw?.urlImagen),
  nombreSupermercado:
    raw?.supermercado ??
    raw?.nombreSupermercado ??
    raw?.supermercadoNombre ??
    'Sin supermercado',
  descripcion: raw?.descripcion ?? null,
  categoria: raw?.categoria ?? undefined,
  pesoValor: raw?.pesoValor ?? undefined,
  pesoUnidad: raw?.pesoUnidad ?? undefined,
  varianteEspecifica: raw?.varianteEspecifica ?? undefined,
  urlEspecifica: raw?.urlEspecifica ?? undefined,
  tiendas: Array.isArray(raw?.tiendas)
    ? raw.tiendas.map((t) => ({
        productoId: Number(t?.productoId ?? raw?.id ?? 0),
        supermercadoId: Number(t?.supermercadoId ?? 0),
        supermercadoNombre: t?.supermercadoNombre ?? 'Supermercado',
        precio: Number(t?.precio ?? 0),
        urlImagen: buildImageUrl(t?.urlImagen),
        urlEspecifica: t?.urlEspecifica ?? undefined,
      }))
    : [],
});

interface SpringPage<T> {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
}

export const productoApi = {
  buscarPaginado: async (
    nombre?: string,
    supermercadoId?: number,
    page = 0,
    size = 15,
    sort?: string,
    marca?: string,
    categoriaId?: number
  ): Promise<PaginaProductos> => {
    const params = new URLSearchParams();
    if (nombre) params.append('q', nombre);
    if (supermercadoId) params.append('supermercadoId', supermercadoId.toString());
    if (marca) params.append('marca', marca);
    if (categoriaId) params.append('categoriaId', categoriaId.toString());
    params.append('page', String(page));
    params.append('size', String(size));
    if (sort) params.append('sort', sort);

    const response = await apiClient.get<ApiResponse<SpringPage<RawProducto>>>(
      '/productos/busqueda',
      { params }
    );
    const pageData = response.data?.data;
    const content = Array.isArray(pageData?.content) ? pageData.content : [];
    return {
      items: content
        .map(normalizeProducto)
        .filter(
          (p: ProductoBusqueda) =>
            p.id > 0 || p.nombreGenerico !== 'Producto sin nombre'
        ),
      totalElements: Number(pageData?.totalElements ?? content.length),
      totalPages: Number(pageData?.totalPages ?? 1),
      page: Number(pageData?.number ?? page),
    };
  },

  buscar: async (
    nombre?: string,
    supermercadoId?: number
  ): Promise<ProductoBusqueda[]> => {
    const result = await productoApi.buscarPaginado(nombre, supermercadoId);
    return result.items;
  },

  obtenerMarcas: async (
    nombre?: string,
    supermercadoId?: number
  ): Promise<string[]> => {
    const params = new URLSearchParams();
    if (nombre) params.append('q', nombre);
    if (supermercadoId) params.append('supermercadoId', supermercadoId.toString());

    const response = await apiClient.get<ApiResponse<string[]>>(
      '/productos/busqueda/marcas',
      { params }
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  obtenerComparativos: async (): Promise<ProductoComparativo[]> => {
    const response = await apiClient.get<ApiResponse<ProductoComparativo[]>>(
      '/productos/comparativo/todos'
    );
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },
};
