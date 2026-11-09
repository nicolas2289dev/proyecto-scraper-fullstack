import React from 'react';
import { getSupermarketLogo } from '@/features/products';

interface SupermarketBadgeProps {
  name: string;
  size?: number;
}

export const SupermarketBadge: React.FC<SupermarketBadgeProps> = ({ name, size = 24 }) => {
  const meta = getSupermarketLogo(name);
  const n = (name || '').toLowerCase();

  // Caso específico Jumbo como en el diseño de referencia
  if (n.includes('jumbo')) {
    return (
      <div
        className="opt-supermarket-badge opt-supermarket-badge--jumbo"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: '#00a859',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '-0.5px',
          flexShrink: 0,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
        title="Jumbo"
      >
        jumbo
      </div>
    );
  }

  // Caso específico Coto como en el diseño de referencia
  if (n.includes('coto')) {
    return (
      <div
        className="opt-supermarket-badge opt-supermarket-badge--coto"
        style={{
          width: size,
          height: size,
          borderRadius: '5px',
          backgroundColor: '#cc0000',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '7.5px',
          fontWeight: 900,
          fontStyle: 'italic',
          letterSpacing: '-0.3px',
          flexShrink: 0,
          border: '1px solid rgba(255, 255, 255, 0.4)',
        }}
        title="Coto"
      >
        COTO
      </div>
    );
  }

  // Supermercados con logotipo oficial en assets
  if (meta?.logoUrl) {
    return (
      <img
        src={meta.logoUrl}
        alt={meta.alt}
        className="opt-supermarket-badge"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'contain',
          backgroundColor: '#ffffff',
          padding: '2px',
          flexShrink: 0,
        }}
      />
    );
  }

  // Fallback con inicial de la cadena
  return (
    <div
      className="opt-supermarket-badge opt-supermarket-badge--fallback"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#00e699',
        color: '#070d19',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 700,
        flexShrink: 0,
      }}
      title={name}
    >
      {name ? name.charAt(0).toUpperCase() : 'S'}
    </div>
  );
};

