import React from 'react';

interface CartBrandIconProps {
  size?: number;
  className?: string;
}

export const CartBrandIcon: React.FC<CartBrandIconProps> = ({ size = 32, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      {/* Fondo circular suave decorativo opcional o transparente */}
      <rect width="40" height="40" rx="10" fill="#10b981" fillOpacity="0.12" />
      
      {/* Canasta del carrito con diseño curvo moderno */}
      <path
        d="M8 11h4.5l3.2 13.8a2 2 0 0 0 1.95 1.55h12.7a2 2 0 0 0 1.95-1.55L34 14H13.2"
        stroke="url(#cartGradient)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ruedas del carrito */}
      <circle cx="18.5" cy="31" r="2" fill="#10b981" />
      <circle cx="28.5" cy="31" r="2" fill="#10b981" />
      {/* Detalle interno de cuadrícula / compras */}
      <path
        d="M16 18h14.5M17 22h12"
        stroke="#10b981"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </svg>
  );
};

export default CartBrandIcon;
