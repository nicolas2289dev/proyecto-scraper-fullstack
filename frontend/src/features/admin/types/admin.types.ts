export interface UsuarioAdminDto {
  id: number;
  email: string;
  nombre: string;
  estado: string;
  roles: string[];
}

export interface RolAdminDto {
  id: number;
  nombreRol: string;
}

export interface CategoriaAdminDto {
  id: number;
  nombre: string;
}

export interface ProductoAdminDto {
  id: number;
  nombreGenerico: string;
  marca?: string;
  varianteEspecifica?: string;
  pesoValor?: number;
  pesoUnidad?: string;
  categoriaId: number;
  categoriaNombre?: string;
}

export interface ProductoTiendaAdminDto {
  id: number;
  productoId: number;
  productoNombre?: string;
  productoMarca?: string;
  supermercadoId: number;
  supermercadoNombre?: string;
  supermercadoUrlBase?: string;
  urlEspecifica?: string;
  codigoExterno?: string;
  urlImagen?: string;
}

export interface CriterioBusquedaAdminDto {
  id: number;
  terminoBusqueda: string;
  categoriaId: number;
  categoriaNombre?: string;
}

export interface SupermercadoAdminDto {
  id: number;
  nombre: string;
  urlBase: string;
}

export interface DashboardStats {
  totalUsuarios: number;
  usuariosActivos: number;
  usuariosInactivos: number;
  administradores: number;
  totalProductos: number;
  totalCategorias: number;
  totalSupermercados: number;
  totalMapeos: number;
  productosConImagen: number;
}
