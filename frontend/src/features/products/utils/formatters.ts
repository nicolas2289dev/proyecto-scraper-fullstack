import type { ProductoBusqueda } from '../types/products.types';

export const formatNombreCompleto = (p: ProductoBusqueda): string =>
  [
    p.nombreGenerico,
    p.varianteEspecifica,
    p.pesoValor ? `${p.pesoValor}${p.pesoUnidad ? ' ' + p.pesoUnidad : ''}` : '',
  ]
    .filter(Boolean)
    .join(' ');
