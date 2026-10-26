import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/authApi';
import type { LoginForm } from '../types/auth.types';
import '../styles/authPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('expired') === 'true' || searchParams.get('unauthorized') === 'true') {
      setApiError('Sesión expirada o permisos insuficientes.');
    }
  }, [searchParams]);

  const validate = (data: LoginForm) => {
    const next: Partial<LoginForm> = {};
    if (!data.email) next.email = 'Ingresá tu email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) next.email = 'Email inválido';
    if (!data.password) next.password = 'Ingresá tu contraseña';
    else if (data.password.length < 6) next.password = 'Mínimo 6 caracteres';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setApiError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate(form)) return;
    setSubmitting(true);
    setApiError(null);
    try {
      const data = await authApi.login(form);
      setAuth(
        { id: data.id, email: data.email, nombre: data.nombre, roles: data.roles },
        data.token
      );
      navigate('/home');
    } catch (error) {
      if (error instanceof AxiosError) {
        setApiError(error.response?.data?.message || 'Error al iniciar sesión. Verificá tus credenciales.');
      } else {
        setApiError('Ocurrió un error inesperado');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page-container container">
      <h1 className="title">Iniciar sesión</h1>
      <p className="subtitle">Accedé para comparar precios y gestionar tus listas</p>

      {apiError && <div className="auth-error-banner">{apiError}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            placeholder="usuario@correo.com"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
        <div className="field">
          <label className="label" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={form.password}
            onChange={onChange}
            autoComplete="current-password"
          />
          {errors.password && <span className="error">{errors.password}</span>}
        </div>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
      <div className="switch">
        ¿No tenés cuenta? <Link className="link" to="/registro">Registrate</Link>
      </div>
    </div>
  );
}

export default LoginPage;
