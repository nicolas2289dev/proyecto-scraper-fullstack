import apiClient from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import type { Categoria } from '../types/products.types';

export const categoriaApi = {
  getAll: async (): Promise<Categoria[]> => {
    const response = await apiClient.get<ApiResponse<Categoria[]>>('/categorias');
    return Array.isArray(response.data?.data) ? response.data.data : [];
  },

  getById: async (id: number): Promise<Categoria | null> => {
    const response = await apiClient.get<ApiResponse<Categoria>>(`/categorias/${id}`);
    return response.data?.data ?? null;
  },
};

export default categoriaApi;
