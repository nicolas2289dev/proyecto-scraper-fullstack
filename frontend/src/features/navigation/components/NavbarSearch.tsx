import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, X } from 'lucide-react';

interface NavbarSearchProps {
  placeholder?: string;
  className?: string;
}

export const NavbarSearch: React.FC<NavbarSearchProps> = ({
  placeholder = 'Buscar productos... (ej: leche, arroz, aceite)',
  className = '',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const urlQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(urlQuery);

  // Sincronizar input si la URL cambia externamente (ej: clic en logo o botón atrás)
  useEffect(() => {
    setSearchTerm(urlQuery);
  }, [urlQuery]);

  // Manejo de debounce para actualizar la búsqueda
  useEffect(() => {
    const handler = setTimeout(() => {
      const trimmed = searchTerm.trim();
      const currentQ = searchParams.get('q') || '';

      if (trimmed === currentQ) return;

      if (location.pathname === '/home') {
        const nextParams = new URLSearchParams(searchParams);
        if (trimmed) {
          nextParams.set('q', trimmed);
          nextParams.set('page', '0'); // Reiniciar a página 0
        } else {
          nextParams.delete('q');
        }
        setSearchParams(nextParams, { replace: true });
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm, location.pathname, searchParams, setSearchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (location.pathname !== '/home') {
      navigate(trimmed ? `/home?q=${encodeURIComponent(trimmed)}` : '/home');
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    if (location.pathname === '/home') {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('q');
      setSearchParams(nextParams, { replace: true });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`navbar-search-form ${className}`} role="search">
      <div className="navbar-search-wrapper">
        <Search className="navbar-search-icon" size={18} aria-hidden="true" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={placeholder}
          className="navbar-search-input"
          aria-label="Buscar productos"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={handleClear}
            className="navbar-search-clear-btn"
            title="Limpiar búsqueda"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  );
};

export default NavbarSearch;
