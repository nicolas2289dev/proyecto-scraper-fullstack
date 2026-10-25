export interface ListaCompra {
  id: number;
  nombreLista: string;
  fechaCreacion: string;
  favorita: boolean;
}

export interface ItemLista {
  id: number;
  productoId: number;
  productoNombre: string;
  marca: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
  supermercadoId?: number;
  supermercadoNombre: string;
}

export interface ListaCompraDetalle extends ListaCompra {
  items: ItemLista[];
  totalEstimado: number;
}

export interface ProductoOptimo {
  productoId: number;
  productoNombre: string;
  marca: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface TiendaOptima {
  supermercadoId: number;
  supermercadoNombre: string;
  productos: ProductoOptimo[];
  subtotalTienda: number;
}

export interface OptimizacionCompra {
  listaId: number;
  nombreLista: string;
  totalOptimo: number;
  totalMasCaro: number;
  totalAhorrado: number;
  hojaDeRuta: TiendaOptima[];
  productosSinPrecio: ProductoOptimo[];
}
