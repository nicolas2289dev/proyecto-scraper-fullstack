import apiClient from '@/shared/api';
import type { ApiResponse, Supermercado } from '@/shared/types';

interface RawSupermercado {
  id?: number | string;
  nombre?: string;
  urlBase?: string;
}

export const supermercadoApi = {
  getAll: async (): Promise<Supermercado[]> => {
    const response = await apiClient.get<ApiResponse<RawSupermercado[]>>('/supermercados');
    const data = Array.isArray(response.data?.data) ? response.data.data : [];
    return data
      .map((raw) => ({
        id: Number(raw?.id ?? 0),
        nombre: raw?.nombre ?? 'Supermercado',
        urlBase: raw?.urlBase ?? undefined,
      }))
      .filter((s) => s.id > 0);
  },
};
