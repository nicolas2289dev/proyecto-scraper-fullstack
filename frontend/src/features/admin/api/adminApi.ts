import apiClient from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import type {
  UsuarioAdminDto,
  RolAdminDto,
  CategoriaAdminDto,
  ProductoAdminDto,
  ProductoTiendaAdminDto,
  CriterioBusquedaAdminDto,
  SupermercadoAdminDto,
} from '../types/admin.types';

export const adminApi = {
  // ─── Gestión de Usuarios (CU-09) ──────────────────────────────────────────
  getUsuarios: async (): Promise<UsuarioAdminDto[]> => {
    const res = await apiClient.get<ApiResponse<UsuarioAdminDto[]>>('/usuarios');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  actualizarEstadoUsuario: async (
    id: number,
    estado: 'ACTIVO' | 'INACTIVO'
  ): Promise<UsuarioAdminDto> => {
    const res = await apiClient.patch<ApiResponse<UsuarioAdminDto>>(
      `/usuarios/${id}/estado`,
      { estado }
    );
    return res.data?.data;
  },

  createUsuario: async (dto: {
    email: string;
    password: string;
    nombre: string;
    estado?: 'ACTIVO' | 'INACTIVO';
  }): Promise<UsuarioAdminDto> => {
    const res = await apiClient.post<ApiResponse<UsuarioAdminDto>>('/usuarios', dto);
    return res.data?.data;
  },

  getRoles: async (): Promise<RolAdminDto[]> => {
    const res = await apiClient.get<ApiResponse<RolAdminDto[]>>('/usuarios/roles');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  asignarRol: async (
    usuarioId: number,
    rolId: number
  ): Promise<UsuarioAdminDto> => {
    const res = await apiClient.post<ApiResponse<UsuarioAdminDto>>(
      '/usuarios/asignar/roles',
      { usuarioId, rolId }
    );
    return res.data?.data;
  },

  // ─── Categorías (CU-10) ──────────────────────────────────────────────────
  getCategorias: async (): Promise<CategoriaAdminDto[]> => {
    const res = await apiClient.get<ApiResponse<CategoriaAdminDto[]>>('/categorias');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  crearCategoria: async (nombre: string): Promise<CategoriaAdminDto> => {
    const res = await apiClient.post<ApiResponse<CategoriaAdminDto>>('/categorias', {
      nombre,
    });
    return res.data?.data;
  },

  actualizarCategoria: async (
    id: number,
    nombre: string
  ): Promise<CategoriaAdminDto> => {
    const res = await apiClient.put<ApiResponse<CategoriaAdminDto>>(
      `/categorias/${id}`,
      { nombre }
    );
    return res.data?.data;
  },

  eliminarCategoria: async (id: number): Promise<void> => {
    await apiClient.delete(`/categorias/${id}`);
  },

  // ─── Productos Maestros (CU-10) ──────────────────────────────────────────
  getProductos: async (params?: {
    nombre?: string;
    marca?: string;
    categoriaId?: number;
    page?: number;
    size?: number;
  }) => {
    const qp = new URLSearchParams();
    if (params?.nombre) qp.append('nombre', params.nombre);
    if (params?.marca) qp.append('marca', params.marca);
    if (params?.categoriaId) qp.append('categoriaId', params.categoriaId.toString());
    if (params?.page !== undefined) qp.append('page', params.page.toString());
    if (params?.size !== undefined) qp.append('size', params.size.toString());

    const res = await apiClient.get<
      ApiResponse<{
        content: ProductoAdminDto[];
        totalElements: number;
        totalPages: number;
      }>
    >('/productos', {
      params: qp,
    });
    return res.data?.data;
  },

  crearProducto: async (
    dto: Omit<ProductoAdminDto, 'id' | 'categoriaNombre'>
  ): Promise<ProductoAdminDto> => {
    const res = await apiClient.post<ApiResponse<ProductoAdminDto>>('/productos', dto);
    return res.data?.data;
  },

  actualizarProducto: async (
    id: number,
    dto: Omit<ProductoAdminDto, 'id' | 'categoriaNombre'>
  ): Promise<ProductoAdminDto> => {
    const res = await apiClient.put<ApiResponse<ProductoAdminDto>>(
      `/productos/${id}`,
      dto
    );
    return res.data?.data;
  },

  eliminarProducto: async (id: number): Promise<void> => {
    await apiClient.delete(`/productos/${id}`);
  },

  eliminarProductos: async (ids: number[]): Promise<void> => {
    if (!ids.length) return;
    await apiClient.delete('/productos/bulk', { data: ids });
  },

  // ─── Mapeos Producto - Supermercado (CU-10) ──────────────────────────────
  getProductosTienda: async (): Promise<ProductoTiendaAdminDto[]> => {
    const res = await apiClient.get<ApiResponse<ProductoTiendaAdminDto[]>>(
      '/productos-tienda'
    );
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  getProductosTiendaByProducto: async (
    productoId: number
  ): Promise<ProductoTiendaAdminDto[]> => {
    const res = await apiClient.get<ApiResponse<ProductoTiendaAdminDto[]>>(
      `/productos-tienda/producto/${productoId}`
    );
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  crearProductoTienda: async (dto: {
    productoId: number;
    supermercadoId: number;
    urlEspecifica?: string;
    codigoExterno?: string;
    urlImagen?: string;
  }): Promise<ProductoTiendaAdminDto> => {
    const res = await apiClient.post<ApiResponse<ProductoTiendaAdminDto>>(
      '/productos-tienda',
      dto
    );
    return res.data?.data;
  },

  actualizarProductoTienda: async (
    id: number,
    dto: {
      productoId: number;
      supermercadoId: number;
      urlEspecifica?: string;
      codigoExterno?: string;
      urlImagen?: string;
    }
  ): Promise<ProductoTiendaAdminDto> => {
    const res = await apiClient.put<ApiResponse<ProductoTiendaAdminDto>>(
      `/productos-tienda/${id}`,
      dto
    );
    return res.data?.data;
  },

  eliminarProductoTienda: async (id: number): Promise<void> => {
    await apiClient.delete(`/productos-tienda/${id}`);
  },

  // ─── Supermercados ────────────────────────────────────────────────────────
  getSupermercados: async (): Promise<SupermercadoAdminDto[]> => {
    const res = await apiClient.get<ApiResponse<SupermercadoAdminDto[]>>(
      '/supermercados'
    );
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // ─── Criterios de Búsqueda para Scraper ──────────────────────────────────
  getCriteriosBusqueda: async (): Promise<CriterioBusquedaAdminDto[]> => {
    const res = await apiClient.get<ApiResponse<CriterioBusquedaAdminDto[]>>(
      '/criterios-busqueda'
    );
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  crearCriterioBusqueda: async (dto: {
    terminoBusqueda: string;
    categoriaId: number;
  }): Promise<CriterioBusquedaAdminDto> => {
    const res = await apiClient.post<ApiResponse<CriterioBusquedaAdminDto>>(
      '/criterios-busqueda',
      dto
    );
    return res.data?.data;
  },

  actualizarCriterioBusqueda: async (
    id: number,
    dto: { terminoBusqueda: string; categoriaId: number }
  ): Promise<CriterioBusquedaAdminDto> => {
    const res = await apiClient.put<ApiResponse<CriterioBusquedaAdminDto>>(
      `/criterios-busqueda/${id}`,
      dto
    );
    return res.data?.data;
  },

  eliminarCriterioBusqueda: async (id: number): Promise<void> => {
    await apiClient.delete(`/criterios-busqueda/${id}`);
  },
};
