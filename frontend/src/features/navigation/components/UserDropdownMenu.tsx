import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  Users,
  Package,
  ListChecks,
  Shield,
  LogIn,
  UserPlus,
} from 'lucide-react';
import type { User } from '@/features/auth';

interface UserDropdownMenuProps {
  user: User | null;
  isAuthenticated: boolean;
  userIsAdmin: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onLogout: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const UserDropdownMenu: React.FC<UserDropdownMenuProps> = ({
  user,
  isAuthenticated,
  userIsAdmin,
  isOpen,
  onToggle,
  onClose,
  onLogout,
  onOpenAuth,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const initials = user?.nombre
    ? user.nombre.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : '?';

  return (
    <div className="user-dropdown-container" ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        className="user-avatar-trigger"
        aria-label="Menú de perfil"
        aria-expanded={isOpen}
      >
        {isAuthenticated ? (
          <span className="user-avatar-circle">{initials}</span>
        ) : (
          <span className="user-avatar-anonymous">
            <UserIcon size={20} />
          </span>
        )}
      </button>

      {isOpen && (
        <div className="user-dropdown-popover" role="menu">
          {isAuthenticated ? (
            <>
              <div className="user-dropdown-profile-header">
                <div className="user-profile-avatar-large">{initials}</div>
                <div className="user-profile-text">
                  <div className="user-profile-name-row">
                    <strong className="user-profile-name">
                      {user?.nombre || 'Usuario'}
                    </strong>
                    {userIsAdmin && (
                      <span className="user-admin-pill" title="Rol Administrador">
                        <Shield size={12} />
                        ADMIN
                      </span>
                    )}
                  </div>
                  <span className="user-profile-email">{user?.email}</span>
                </div>
              </div>

              <div className="user-dropdown-divider" />

              <div className="user-dropdown-section">
                <Link
                  to="/mis-listas"
                  onClick={onClose}
                  className="user-dropdown-item"
                  role="menuitem"
                >
                  <ListChecks size={18} className="user-dropdown-item-icon" />
                  <span>Mis Listas de Compra</span>
                </Link>
              </div>

              {userIsAdmin && (
                <>
                  <div className="user-dropdown-divider" />
                  <div className="user-dropdown-group-title">Panel de Control</div>
                  <div className="user-dropdown-section">
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className="user-dropdown-item"
                      role="menuitem"
                    >
                      <LayoutDashboard size={18} className="user-dropdown-item-icon text-sky-400" />
                      <span>Dashboard General</span>
                    </Link>
                    <Link
                      to="/admin/usuarios"
                      onClick={onClose}
                      className="user-dropdown-item"
                      role="menuitem"
                    >
                      <Users size={18} className="user-dropdown-item-icon text-sky-400" />
                      <span>Gestión de Usuarios</span>
                    </Link>
                    <Link
                      to="/admin/catalogo"
                      onClick={onClose}
                      className="user-dropdown-item"
                      role="menuitem"
                    >
                      <Package size={18} className="user-dropdown-item-icon text-sky-400" />
                      <span>Catálogo y Scrapers</span>
                    </Link>
                  </div>
                </>
              )}

              <div className="user-dropdown-divider" />

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="user-dropdown-item user-dropdown-logout-btn"
                role="menuitem"
              >
                <LogOut size={18} className="user-dropdown-item-icon" />
                <span>Cerrar Sesión</span>
              </button>
            </>
          ) : (
            <div className="user-dropdown-guest-box">
              <p className="user-guest-msg">
                Iniciá sesión para guardar tus listas y comparar precios personalizados.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('login');
                }}
                className="btn-guest-login"
              >
                <LogIn size={16} />
                <span>Iniciar sesión</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth('register');
                }}
                className="btn-guest-register"
              >
                <UserPlus size={16} />
                <span>Crear cuenta gratis</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDropdownMenu;
