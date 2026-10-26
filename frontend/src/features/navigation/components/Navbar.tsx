import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { useAuthStore, isAdmin } from '@/features/auth';
import { listaApi } from '@/features/lists/api/listaApi';
import CartBrandIcon from './CartBrandIcon';
import NavbarSearch from './NavbarSearch';
import SupermarketInfoModal from './SupermarketInfoModal';
import UserDropdownMenu from './UserDropdownMenu';
import '../styles/navbar.css';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const userIsAdmin = isAdmin(user);

  // Tema claro / oscuro
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Estados de interfaz
  const [selectedSupermarket, setSelectedSupermarket] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [activeListItemsCount, setActiveListItemsCount] = useState<number>(() => {
    try {
      const localList = localStorage.getItem('ahorraya_guest_cart');
      if (localList) {
        const parsed = JSON.parse(localList);
        return Array.isArray(parsed) ? parsed.length : 0;
      }
    } catch {
      return 0;
    }
    return 0;
  });

  // Obtener conteo de ítems de la lista activa o favorita
  useEffect(() => {
    let isMounted = true;
    if (isAuthenticated) {
      listaApi
        .getAll()
        .then((listas) => {
          if (!isMounted) return;
          if (listas && listas.length > 0) {
            // Priorizar lista favorita o la primera
            const activeList = listas.find((l) => l.favorita) || listas[0];
            const count = activeList.items
              ? activeList.items.reduce((acc, item) => acc + (item.cantidad || 1), 0)
              : 0;
            setActiveListItemsCount(count);
          } else {
            setActiveListItemsCount(0);
          }
        })
        .catch(() => {
          if (isMounted) setActiveListItemsCount(0);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const handleNavToList = () => {
    if (isAuthenticated) {
      navigate('/mis-listas');
    } else {
      openAuthModal('login');
    }
  };

  return (
    <>
      <header className="navbar-header" role="banner">
        <div className="navbar-container">
          {/* 1. Bloque de Marca y Slogan */}
          <Link to="/home" className="navbar-brand-link" aria-label="Ir a Inicio de AhorraYa">
            <CartBrandIcon size={36} className="navbar-brand-icon" />
            <div className="navbar-brand-text">
              <span className="navbar-brand-title">AhorraYa</span>
              <span className="navbar-brand-slogan">Compará. Ahorrá. Comprá.</span>
            </div>
          </Link>

          {/* 2. Grupo Central: Buscador y Accesos Rápidos a Supermercados */}
          <div className="navbar-center-group">
            <div className="navbar-search-section">
              <NavbarSearch />
            </div>

            <div className="navbar-supermarkets-shortcuts" aria-label="Supermercados disponibles">
              <button
                type="button"
                className="navbar-super-badge"
                onClick={() => setSelectedSupermarket('comodin')}
                title="Ver información de Comodín en Casa"
              >
                <img
                  src="/icons/icon-comodin.png"
                  alt="Comodín"
                  className="navbar-super-img"
                />
              </button>
              <button
                type="button"
                className="navbar-super-badge"
                onClick={() => setSelectedSupermarket('dia')}
                title="Ver información de Supermercados Día"
              >
                <img
                  src="/icons/icon-dia.png"
                  alt="Día"
                  className="navbar-super-img"
                />
              </button>
              <button
                type="button"
                className="navbar-super-badge"
                onClick={() => setSelectedSupermarket('vea')}
                title="Ver información de Supermercados Vea"
              >
                <img
                  src="/icons/icon-vea-removebg-preview.png"
                  alt="Vea"
                  className="navbar-super-img"
                />
              </button>
            </div>
          </div>

          {/* 4. Acciones Derecha (Tema, Favoritos, Mi Lista, Perfil) */}
          <div className="navbar-right-actions">
            {/* Botón Cambiar Tema */}
            <button
              type="button"
              className="btn-theme-toggle"
              onClick={toggleTheme}
              title="Cambiar Tema"
              aria-label="Cambiar Tema"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {/* Botón Favoritos */}
            <button
              type="button"
              className="navbar-action-btn"
              onClick={() => {
                if (isAuthenticated) {
                  navigate('/mis-listas');
                } else {
                  openAuthModal('login');
                }
              }}
              title="Mis Favoritos"
              aria-label="Mis Favoritos"
            >
              <Heart size={20} />
            </button>

            {/* Widget Mi Lista */}
            <button
              type="button"
              className="navbar-list-widget"
              onClick={handleNavToList}
              aria-label="Ver mi lista de compras"
            >
              <div className="navbar-list-icon-wrapper">
                <ShoppingBag size={20} className="navbar-list-icon" />
                {activeListItemsCount > 0 && (
                  <span className="navbar-list-badge">{activeListItemsCount}</span>
                )}
              </div>
              <span className="navbar-list-label">Mi lista</span>
            </button>

            {/* Menú Desplegable de Usuario (Profile Dropdown) */}
            <UserDropdownMenu
              isOpen={isUserMenuOpen}
              onToggle={() => setIsUserMenuOpen((prev) => !prev)}
              onClose={() => setIsUserMenuOpen(false)}
              user={user}
              isAuthenticated={isAuthenticated}
              userIsAdmin={userIsAdmin}
              onLogout={handleLogout}
              onOpenAuth={(mode) => {
                setIsUserMenuOpen(false);
                openAuthModal(mode);
              }}
            />
          </div>
        </div>
      </header>

      {/* Modal Informativo de Supermercados */}
      <SupermarketInfoModal
        supermarketId={selectedSupermarket}
        onClose={() => setSelectedSupermarket(null)}
      />
    </>
  );
};

export default Navbar;
