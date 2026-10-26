export interface SupermarketMeta {
  name: string;
  logoUrl: string;
  alt: string;
}

/**
 * Obtiene el logotipo y metadatos oficiales del supermercado según su nombre.
 */
export function getSupermarketLogo(nombre?: string): SupermarketMeta | null {
  if (!nombre) return null;
  const n = nombre.toLowerCase();

  if (n.includes('comodin') || n.includes('comodín')) {
    return {
      name: 'Comodín',
      logoUrl: '/icons/icon-comodin.png',
      alt: 'Supermercado Comodín',
    };
  }

  if (n.includes('dia') || n.includes('día')) {
    return {
      name: 'Día',
      logoUrl: '/icons/icon-dia.png',
      alt: 'Supermercados Día',
    };
  }

  if (n.includes('vea')) {
    return {
      name: 'Vea',
      logoUrl: '/icons/icon-vea-removebg-preview.png',
      alt: 'Supermercados Vea',
    };
  }

  return null;
}
