import apiClient from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import type { Sucursal } from '../types/lists.types';

/**
 * Catálogo de respaldo local con las mismas sucursales geolocalizadas del DataInitializer
 * por si el servidor backend aún no ha ejecutado la migración o se encuentra sin seed.
 */
export const FALLBACK_SUCURSALES_JUJUY: Sucursal[] = [
  // Comodín
  {
    id: 101,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal Alberdi (Centro)',
    direccion: 'Alberdi 164',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1879,
    longitud: -65.3061,
  },
  {
    id: 102,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal Éxodo',
    direccion: 'Av. El Éxodo 561',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1912,
    longitud: -65.3045,
  },
  {
    id: 103,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal Almirante Brown',
    direccion: 'Av. Almirante Brown 924',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1984,
    longitud: -65.2942,
  },
  {
    id: 104,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal Ciudad de Nieva',
    direccion: 'Av. Libertad 670',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1815,
    longitud: -65.3198,
  },
  {
    id: 105,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal Alto Comedero',
    direccion: 'Av. Fuerza Aérea 290',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.2385,
    longitud: -65.2651,
  },
  {
    id: 106,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal Palpalá',
    direccion: 'Av. Martijena 215',
    ciudad: 'Palpalá',
    latitud: -24.2568,
    longitud: -65.2074,
  },
  {
    id: 107,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal Perico',
    direccion: 'Av. Belgrano 430',
    ciudad: 'Perico',
    latitud: -24.3821,
    longitud: -65.1132,
  },
  {
    id: 108,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal San Pedro Mitre',
    direccion: 'Bartolomé Mitre 436',
    ciudad: 'San Pedro de Jujuy',
    latitud: -24.229346,
    longitud: -64.867706,
  },
  {
    id: 109,
    supermercadoId: 1,
    supermercadoNombre: 'Comodín en Casa',
    nombreSucursal: 'Comodín Sucursal San Pedro Alberdi',
    direccion: 'Juan B. Alberdi 52',
    ciudad: 'San Pedro de Jujuy',
    latitud: -24.234462,
    longitud: -64.866341,
  },

  // Día
  {
    id: 201,
    supermercadoId: 2,
    supermercadoNombre: 'Día',
    nombreSucursal: 'Día Peatonal Belgrano',
    direccion: 'Av. Gral. Belgrano 860',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1856,
    longitud: -65.3023,
  },
  {
    id: 202,
    supermercadoId: 2,
    supermercadoNombre: 'Día',
    nombreSucursal: 'Día Senador Pérez',
    direccion: 'Senador Pérez 345',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1842,
    longitud: -65.3069,
  },
  {
    id: 203,
    supermercadoId: 2,
    supermercadoNombre: 'Día',
    nombreSucursal: 'Día Necochea',
    direccion: 'Necochea 250',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1868,
    longitud: -65.3011,
  },
  {
    id: 204,
    supermercadoId: 2,
    supermercadoNombre: 'Día',
    nombreSucursal: 'Día Hipólito Yrigoyen',
    direccion: 'Av. Hipólito Yrigoyen 1120',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.193,
    longitud: -65.2985,
  },
  {
    id: 205,
    supermercadoId: 2,
    supermercadoNombre: 'Día',
    nombreSucursal: 'Día Almirante Brown',
    direccion: 'Av. Almirante Brown 1280',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.2015,
    longitud: -65.2918,
  },
  {
    id: 206,
    supermercadoId: 2,
    supermercadoNombre: 'Día',
    nombreSucursal: 'Día Palpalá Centro',
    direccion: 'Av. Río de la Plata 310',
    ciudad: 'Palpalá',
    latitud: -24.2584,
    longitud: -65.2052,
  },
  {
    id: 207,
    supermercadoId: 2,
    supermercadoNombre: 'Día',
    nombreSucursal: 'Día Perico Centro',
    direccion: 'Mariano Moreno 185',
    ciudad: 'Perico',
    latitud: -24.3809,
    longitud: -65.1148,
  },
  {
    id: 208,
    supermercadoId: 2,
    supermercadoNombre: 'Día',
    nombreSucursal: 'Día San Pedro Centro',
    direccion: 'Gobernador Tello 215',
    ciudad: 'San Pedro de Jujuy',
    latitud: -24.23298,
    longitud: -64.86598,
  },

  // Vea
  {
    id: 301,
    supermercadoId: 3,
    supermercadoNombre: 'Vea',
    nombreSucursal: 'Vea Av. El Éxodo',
    direccion: 'Av. El Éxodo 352',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1904,
    longitud: -65.3028,
  },
  {
    id: 302,
    supermercadoId: 3,
    supermercadoNombre: 'Vea',
    nombreSucursal: 'Vea Belgrano Centro',
    direccion: 'Av. Gral. Belgrano 980',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1851,
    longitud: -65.3048,
  },
  {
    id: 303,
    supermercadoId: 3,
    supermercadoNombre: 'Vea',
    nombreSucursal: 'Vea Chijra',
    direccion: 'Av. Gral. Mosconi 245',
    ciudad: 'San Salvador de Jujuy',
    latitud: -24.1755,
    longitud: -65.2862,
  },
  {
    id: 304,
    supermercadoId: 3,
    supermercadoNombre: 'Vea',
    nombreSucursal: 'Vea San Pedro Centro',
    direccion: 'Av. Siria 164',
    ciudad: 'San Pedro de Jujuy',
    latitud: -24.2338,
    longitud: -64.8649,
  },
];

let cachedSucursales: Sucursal[] | null = null;

export const sucursalApi = {
  getAll: async (supermercadoId?: number): Promise<Sucursal[]> => {
    try {
      if (!supermercadoId && cachedSucursales && cachedSucursales.length > 0) {
        return cachedSucursales;
      }

      const params = supermercadoId ? { supermercadoId } : undefined;
      const response = await apiClient.get<ApiResponse<Sucursal[]>>('/sucursales', { params });
      const data = response.data?.data;

      if (Array.isArray(data) && data.length > 0) {
        if (!supermercadoId) {
          cachedSucursales = data;
        }
        return data;
      }
      return FALLBACK_SUCURSALES_JUJUY;
    } catch {
      return FALLBACK_SUCURSALES_JUJUY;
    }
  },
};

