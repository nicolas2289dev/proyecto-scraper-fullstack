export interface Categoria {
  id: number;
  nombre: string;
}

export interface ProductoTiendaOferta {
  productoId: number;
  supermercadoId: number;
  supermercadoNombre: string;
  precio: number;
  urlImagen?: string;
  urlEspecifica?: string;
}

export interface ProductoBusqueda {
  id: number;
  nombreGenerico: string;
  marca: string;
  precio: number;
  urlImagen?: string;
  nombreSupermercado: string;
  descripcion?: string | null;
  categoria?: string;
  pesoValor?: number;
  pesoUnidad?: string;
  varianteEspecifica?: string;
  urlEspecifica?: string;
  tiendas?: ProductoTiendaOferta[];
}

export interface PaginaProductos {
  items: ProductoBusqueda[];
  totalElements: number;
  totalPages: number;
  page: number;
}

export interface ProductoComparativo {
  producto: string;
  marca: string;
  precio: number;
  urlImagen: string;
  supermercado: string;
}
