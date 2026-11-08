import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { ListsSidebar } from '../components/ListsSidebar';
import '../styles/listsSidebar.css';

/**
 * ListsLayout
 *
 * Shell layout for all lists routes (/mis-listas, /mis-listas/:id, /mis-listas/:id/optimizacion).
 * Mounts ListsSidebar once in the 260px left column and renders the active child view in <Outlet />.
 * Includes slide-in drawer support for screens < 1024px.
 */
export const ListsLayout: React.FC = () => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const location = useLocation();
  const [lastPath, setLastPath] = useState(location.pathname);

  // Close drawer during render when the route changes (avoids cascading render effects)
  if (lastPath !== location.pathname) {
    setLastPath(location.pathname);
    setIsMobileDrawerOpen(false);
  }

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileDrawerOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  return (
    <div className="lists-layout-container">
      {/* Columna Izquierda Desktop (260px sticky) */}
      <div className="lists-sidebar-column">
        <ListsSidebar />
      </div>

      {/* Botón Flotante para Móviles y Tablets (< 1024px) */}
      <button
        type="button"
        className="lists-mobile-trigger-btn"
        onClick={() => setIsMobileDrawerOpen(true)}
        aria-label="Abrir menú de navegación de listas"
        title="Abrir menú de listas"
      >
        <Menu size={16} aria-hidden="true" />
        <span>Menú Listas</span>
      </button>

      {/* Drawer Móvil Deslizable */}
      {isMobileDrawerOpen && (
        <div
          className="lists-mobile-drawer-overlay"
          onClick={() => setIsMobileDrawerOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Panel de navegación de listas"
        >
          <div
            className="lists-mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lists-mobile-drawer-header">
              <span className="lists-sidebar-title" style={{ fontSize: '0.95rem' }}>
                Menú de Listas
              </span>
              <button
                type="button"
                className="lists-mobile-drawer-close"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Cerrar panel de listas"
              >
                <X size={18} />
              </button>
            </div>
            <ListsSidebar onNavigate={() => setIsMobileDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Columna Principal de Contenido (Ruta Activa) */}
      <main className="lists-main-column">
        <Outlet />
      </main>
    </div>
  );
};

export default ListsLayout;
