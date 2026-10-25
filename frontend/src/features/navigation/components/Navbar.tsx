import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, isAdmin } from '@/features/auth';
import '../styles/navbar.css';

export function Navbar() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const openAuthModal = useAuthStore((state) => state.openAuthModal);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => !!state.token);
  const userIsAdmin = isAdmin(user);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
  });
  const cartRef = useRef<HTMLDivElement>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/home">
          <img src="/Image/Logo.png" alt="AhorraYa Logo" className="navbar-logo" />
          <span>AhorraYa</span>
        </Link>
      </div>
      <ul className="navbar-links">
        {isAuthenticated && (
          <li>
            <Link to="/mis-listas">Mis Listas</Link>
          </li>
        )}
        {userIsAdmin && (
          <>
            <li>
              <Link to="/admin" className="admin-link">
                📊 Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin/usuarios" className="admin-link">
                👥 Usuarios
              </Link>
            </li>
            <li>
              <Link to="/admin/catalogo" className="admin-link">
                📦 Catálogo
              </Link>
            </li>
          </>
        )}
      </ul>

      <div className="navbar-actions">
        <button className="btn-theme-toggle" onClick={toggleTheme} title="Cambiar Tema">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        {isAuthenticated && (
          <div className="cart-icon-container" ref={cartRef}>
            <button className="btn-cart-toggle" onClick={() => setIsCartOpen(!isCartOpen)}>
              <span className="cart-icon">🛒</span>
            </button>
          </div>
        )}

        {isAuthenticated ? (
          <>
            <div className="user-info" title={user?.email || ''}>
              <span className="user-avatar">
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : '?'}
              </span>
              <span className="user-name">{user?.nombre || user?.email || 'Usuario'}</span>
              {userIsAdmin && <span className="admin-badge">ADMIN</span>}
            </div>

            <button onClick={handleLogout} className="btn-logout">
              Salir
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="btn-login"
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="btn-register"
            >
              Registrarse
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
