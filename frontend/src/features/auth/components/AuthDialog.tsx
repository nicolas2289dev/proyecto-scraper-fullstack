import React, { useState, useEffect } from 'react';
import { X, User, UserPlus, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import '../styles/authDialog.css';

export function AuthDialog() {
  const { authModalOpen, authModalMode, openAuthModal, closeAuthModal, setAuth } = useAuthStore();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});

  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [registerErrors, setRegisterErrors] = useState<{ name?: string; email?: string; password?: string; confirm?: string }>({});

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setApiError(null);
    setLoginErrors({});
    setRegisterErrors({});
  }, [authModalMode]);

  const handleHide = () => {
    closeAuthModal();
    setApiError(null);
    setSuccessMsg(null);
    setLoginErrors({});
    setRegisterErrors({});
    setLoginForm({ email: '', password: '' });
    setRegisterForm({ name: '', email: '', password: '', confirm: '' });
    setShowPassword(false);
  };

  const validateLogin = () => {
    const errs: { email?: string; password?: string } = {};
    if (!loginForm.email.trim()) errs.email = 'Ingresá tu email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginForm.email.trim())) errs.email = 'Email inválido';
    if (!loginForm.password) errs.password = 'Ingresá tu contraseña';
    else if (loginForm.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    setLoginErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = () => {
    const errs: { name?: string; email?: string; password?: string; confirm?: string } = {};
    if (!registerForm.name.trim()) errs.name = 'Ingresá tu nombre';
    if (!registerForm.email.trim()) errs.email = 'Ingresá tu email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registerForm.email.trim())) errs.email = 'Email inválido';
    if (!registerForm.password) errs.password = 'Ingresá una contraseña';
    else if (registerForm.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (!registerForm.confirm) errs.confirm = 'Repetí la contraseña';
    else if (registerForm.confirm !== registerForm.password) errs.confirm = 'Las contraseñas no coinciden';
    setRegisterErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLogin()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const data = await authApi.login(loginForm);
      setAuth(
        { id: data.id, email: data.email, nombre: data.nombre, roles: data.roles },
        data.token
      );
      handleHide();
    } catch (error) {
      if (error instanceof AxiosError) {
        setApiError(error.response?.data?.message || 'Error al iniciar sesión. Verificá tus credenciales.');
      } else {
        setApiError('Ocurrió un error inesperado al conectar con el servidor.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRegister()) return;
    setSubmitting(true);
    setApiError(null);
    try {
      await authApi.register(registerForm);
      setSuccessMsg('¡Cuenta creada con éxito! Ahora podés iniciar sesión con tus credenciales.');
      setLoginForm((prev) => ({ ...prev, email: registerForm.email.trim(), password: '' }));
      openAuthModal('login');
    } catch (error) {
      if (error instanceof AxiosError) {
        setApiError(error.response?.data?.message || 'Error al registrarse. El correo podría ya estar registrado.');
      } else {
        setApiError('Ocurrió un error inesperado al conectar con el servidor.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isLogin = authModalMode === 'login';

  if (!authModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleHide();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="p-dialog-dark-wrapper w-full max-w-[440px] rounded-2xl overflow-hidden p-6">
        {/* Encabezado con Título y Botón Cerrar */}
        <div className="p-dialog-dark-header">
          <h2 className="p-dialog-dark-title">
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <button
            type="button"
            className="p-dialog-dark-close"
            onClick={handleHide}
            aria-label="Cerrar diálogo"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sección de Contexto con Avatar */}
        <div className="p-dialog-dark-profile">
          <div className="p-dialog-dark-avatar">
            {isLogin ? <User className="w-5 h-5 text-white" /> : <UserPlus className="w-5 h-5 text-white" />}
          </div>
          <div className="p-dialog-dark-profile-info">
            <span className="p-dialog-dark-profile-name">
              {isLogin ? 'Acceso al Catálogo' : 'Nuevo Usuario'}
            </span>
            <span className="p-dialog-dark-profile-desc">
              {isLogin
                ? 'Compará precios y administrá tus listas de compras'
                : 'Registrate para empezar a ahorrar en tus compras'}
            </span>
          </div>
        </div>

        {/* Mensaje de Éxito */}
        {successMsg && isLogin && (
          <div className="p-dialog-dark-alert success">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mensaje de Error */}
        {apiError && (
          <div className="p-dialog-dark-alert error">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{apiError}</span>
          </div>
        )}

        {/* Formulario de Login */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} noValidate>
            <div className="p-dialog-dark-field">
              <label className="p-dialog-dark-label" htmlFor="dark-login-email">
                Email
              </label>
              <input
                id="dark-login-email"
                type="email"
                className={`p-dialog-dark-input ${loginErrors.email ? 'error' : ''}`}
                placeholder="usuario@correo.com"
                value={loginForm.email}
                onChange={(e) => {
                  setLoginForm((prev) => ({ ...prev, email: e.target.value }));
                  if (loginErrors.email) setLoginErrors((prev) => ({ ...prev, email: undefined }));
                  setApiError(null);
                }}
                autoComplete="email"
                autoFocus
              />
              {loginErrors.email && (
                <span className="p-dialog-dark-error-msg">{loginErrors.email}</span>
              )}
            </div>

            <div className="p-dialog-dark-field">
              <div className="p-dialog-dark-label-row">
                <label className="p-dialog-dark-label" htmlFor="dark-login-password">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="p-dialog-dark-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <input
                id="dark-login-password"
                type={showPassword ? 'text' : 'password'}
                className={`p-dialog-dark-input ${loginErrors.password ? 'error' : ''}`}
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => {
                  setLoginForm((prev) => ({ ...prev, password: e.target.value }));
                  if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: undefined }));
                  setApiError(null);
                }}
                autoComplete="current-password"
              />
              {loginErrors.password && (
                <span className="p-dialog-dark-error-msg">{loginErrors.password}</span>
              )}
            </div>

            <div className="p-dialog-dark-footer">
              <button
                type="button"
                className="p-dialog-dark-btn-cancel"
                onClick={handleHide}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="p-dialog-dark-btn-save"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Ingresando...
                  </>
                ) : (
                  'Ingresar'
                )}
              </button>
            </div>

            <div className="p-dialog-dark-switch-text">
              ¿No tenés cuenta?{' '}
              <button
                type="button"
                className="p-dialog-dark-switch-link"
                onClick={() => {
                  setSuccessMsg(null);
                  openAuthModal('register');
                }}
              >
                Registrate gratis
              </button>
            </div>
          </form>
        ) : (
          /* Formulario de Registro */
          <form onSubmit={handleRegisterSubmit} noValidate>
            <div className="p-dialog-dark-field">
              <label className="p-dialog-dark-label" htmlFor="dark-reg-name">
                Nombre
              </label>
              <input
                id="dark-reg-name"
                type="text"
                className={`p-dialog-dark-input ${registerErrors.name ? 'error' : ''}`}
                placeholder="Tu nombre completo"
                value={registerForm.name}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, name: e.target.value }));
                  if (registerErrors.name) setRegisterErrors((prev) => ({ ...prev, name: undefined }));
                  setApiError(null);
                }}
                autoComplete="name"
                autoFocus
              />
              {registerErrors.name && (
                <span className="p-dialog-dark-error-msg">{registerErrors.name}</span>
              )}
            </div>

            <div className="p-dialog-dark-field">
              <label className="p-dialog-dark-label" htmlFor="dark-reg-email">
                Email
              </label>
              <input
                id="dark-reg-email"
                type="email"
                className={`p-dialog-dark-input ${registerErrors.email ? 'error' : ''}`}
                placeholder="usuario@correo.com"
                value={registerForm.email}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, email: e.target.value }));
                  if (registerErrors.email) setRegisterErrors((prev) => ({ ...prev, email: undefined }));
                  setApiError(null);
                }}
                autoComplete="email"
              />
              {registerErrors.email && (
                <span className="p-dialog-dark-error-msg">{registerErrors.email}</span>
              )}
            </div>

            <div className="p-dialog-dark-field">
              <div className="p-dialog-dark-label-row">
                <label className="p-dialog-dark-label" htmlFor="dark-reg-pass">
                  Contraseña
                </label>
                <button
                  type="button"
                  className="p-dialog-dark-eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <input
                id="dark-reg-pass"
                type={showPassword ? 'text' : 'password'}
                className={`p-dialog-dark-input ${registerErrors.password ? 'error' : ''}`}
                placeholder="Mínimo 6 caracteres"
                value={registerForm.password}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, password: e.target.value }));
                  if (registerErrors.password) setRegisterErrors((prev) => ({ ...prev, password: undefined }));
                  setApiError(null);
                }}
                autoComplete="new-password"
              />
              {registerErrors.password && (
                <span className="p-dialog-dark-error-msg">{registerErrors.password}</span>
              )}
            </div>

            <div className="p-dialog-dark-field">
              <label className="p-dialog-dark-label" htmlFor="dark-reg-confirm">
                Repetir contraseña
              </label>
              <input
                id="dark-reg-confirm"
                type={showPassword ? 'text' : 'password'}
                className={`p-dialog-dark-input ${registerErrors.confirm ? 'error' : ''}`}
                placeholder="Repetí la contraseña"
                value={registerForm.confirm}
                onChange={(e) => {
                  setRegisterForm((prev) => ({ ...prev, confirm: e.target.value }));
                  if (registerErrors.confirm) setRegisterErrors((prev) => ({ ...prev, confirm: undefined }));
                  setApiError(null);
                }}
                autoComplete="new-password"
              />
              {registerErrors.confirm && (
                <span className="p-dialog-dark-error-msg">{registerErrors.confirm}</span>
              )}
            </div>

            <div className="p-dialog-dark-footer">
              <button
                type="button"
                className="p-dialog-dark-btn-cancel"
                onClick={handleHide}
                disabled={submitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="p-dialog-dark-btn-save"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> Creando...
                  </>
                ) : (
                  'Registrarse'
                )}
              </button>
            </div>

            <div className="p-dialog-dark-switch-text">
              ¿Ya tenés cuenta?{' '}
              <button
                type="button"
                className="p-dialog-dark-switch-link"
                onClick={() => {
                  setSuccessMsg(null);
                  openAuthModal('login');
                }}
              >
                Iniciá sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default AuthDialog;
