import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FolderHeart,
  Home,
  ShoppingBasket,
  ListOrdered,
  Star,
  Sparkles,
} from 'lucide-react';
import { listaApi } from '../api/listaApi';
import type { ListaCompraDetalle } from '../types/lists.types';
import '../styles/listsSidebar.css';

export interface ListsSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

/**
 * ListsSidebar
 *
 * Left navigation for the entire lists module
 * (/mis-listas, /mis-listas/:id, /mis-listas/:id/optimizacion).
 * Matches the 260px sticky card style of ProductFilters.
 */
export const ListsSidebar: React.FC<ListsSidebarProps> = ({
  className = '',
  onNavigate,
}) => {
  const location = useLocation();
  const [listas, setListas] = useState<ListaCompraDetalle[]>([]);

  // Extract current list id from URL if on /mis-listas/:id or /mis-listas/:id/optimizacion
  const currentListId = useMemo(() => {
    const match = location.pathname.match(/\/mis-listas\/(\d+)/);
    return match ? Number(match[1]) : null;
  }, [location.pathname]);

  useEffect(() => {
    let isMounted = true;

    const loadListas = () => {
      listaApi
        .getAll()
        .then((data) => {
          if (isMounted) {
            setListas(data);
          }
        })
        .catch((err) => {
          console.error('Error cargando listas en ListsSidebar:', err);
        });
    };

    loadListas();

    // Real-time synchronization when items are added, modified or deleted
    window.addEventListener('ahorraya:list-updated', loadListas);
    return () => {
      isMounted = false;
      window.removeEventListener('ahorraya:list-updated', loadListas);
    };
  }, []);

  // Contextual target for "Mi Lista Actual"
  const currentListTarget = useMemo(() => {
    if (currentListId) {
      return `/mis-listas/${currentListId}`;
    }
    const favorite = listas.find((l) => l.favorita);
    if (favorite) {
      return `/mis-listas/${favorite.id}`;
    }
    if (listas.length > 0) {
      return `/mis-listas/${listas[0].id}`;
    }
    return '/mis-listas';
  }, [currentListId, listas]);

  // Filter only favorite lists
  const listasFavoritas = useMemo(() => {
    return listas.filter((l) => l.favorita);
  }, [listas]);

  const isHomeActive = location.pathname === '/home';
  const isMyListsActive = location.pathname === '/mis-listas';
  const isCurrentListActive =
    currentListId !== null &&
    location.pathname === `/mis-listas/${currentListId}`;
  const isOptimizationActive =
    currentListId !== null &&
    location.pathname === `/mis-listas/${currentListId}/optimizacion`;

  const handleLinkClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside
      className={`lists-sidebar-card ${className}`}
      aria-label="Gestión y navegación de listas de compra"
    >
      {/* Header */}
      <div className="lists-sidebar-header">
        <div className="lists-sidebar-title-group">
          <FolderHeart size={18} className="lists-sidebar-main-icon" aria-hidden="true" />
          <h2 className="lists-sidebar-title">Panel de Listas</h2>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="lists-sidebar-nav-section">
        <Link
          to="/home"
          onClick={handleLinkClick}
          className={`lists-sidebar-nav-item ${isHomeActive ? 'active' : ''}`}
          title="Ir al catálogo principal"
        >
          <Home size={16} className="lists-sidebar-item-icon" aria-hidden="true" />
          <span>Inicio</span>
        </Link>

        <Link
          to="/mis-listas"
          onClick={handleLinkClick}
          className={`lists-sidebar-nav-item ${isMyListsActive ? 'active' : ''}`}
          title="Ver todas mis listas de compra"
        >
          <ListOrdered size={16} className="lists-sidebar-item-icon" aria-hidden="true" />
          <span>Mis Listas</span>
        </Link>

        <Link
          to={currentListTarget}
          onClick={handleLinkClick}
          className={`lists-sidebar-nav-item ${isCurrentListActive ? 'active' : ''}`}
          title="Ir al detalle de la lista activa"
        >
          <ShoppingBasket size={16} className="lists-sidebar-item-icon" aria-hidden="true" />
          <span>Mi Lista Actual</span>
        </Link>

        {/* Solo visible cuando se encuentra en la vista de optimización */}
        {isOptimizationActive && currentListId && (
          <Link
            to={`/mis-listas/${currentListId}/optimizacion`}
            onClick={handleLinkClick}
            className="lists-sidebar-nav-item active"
            title="Vista del circuito de compra optimizado"
          >
            <Sparkles size={16} className="lists-sidebar-item-icon" aria-hidden="true" />
            <span>Circuito de Compra</span>
          </Link>
        )}
      </div>

      {/* Mis Listas Favoritas Section */}
      <div className="lists-sidebar-sublists-section">
        <div className="lists-sidebar-sublists-header">
          <span className="lists-sidebar-section-label" style={{ margin: 0 }}>
            Mis Listas Favoritas
          </span>
          {listasFavoritas.length > 0 && (
            <span className="lists-sidebar-items-pill" title="Cantidad de listas favoritas">
              {listasFavoritas.length}
            </span>
          )}
        </div>

        <div className="lists-sidebar-scroll-list">
          {listasFavoritas.length === 0 ? (
            <div className="lists-sidebar-empty-state">
              Sin listas favoritas marcadas
            </div>
          ) : (
            listasFavoritas.map((lista) => {
              const isSelected = currentListId === lista.id;
              const itemCount = lista.items?.length ?? 0;

              return (
                <Link
                  key={lista.id}
                  to={`/mis-listas/${lista.id}`}
                  onClick={handleLinkClick}
                  className={`lists-sidebar-sublist-item ${isSelected ? 'active' : ''}`}
                  title={`${lista.nombreLista} (${itemCount} producto${itemCount === 1 ? '' : 's'})`}
                >
                  <div className="lists-sidebar-sublist-name-group">
                    <Star
                      size={13}
                      className="lists-sidebar-fav-star"
                      aria-hidden="true"
                    />
                    <span className="lists-sidebar-sublist-name">
                      {lista.nombreLista}
                    </span>
                  </div>
                  <span className="lists-sidebar-items-pill">
                    {itemCount}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </aside>
  );
};

