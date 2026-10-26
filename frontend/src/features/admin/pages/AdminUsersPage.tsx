import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '../api/adminApi';
import type { UsuarioAdminDto, RolAdminDto } from '../types/admin.types';
import { useAuthStore } from '@/features/auth';
import { getErrorMessage } from '@/shared/lib/utils';
import '../styles/adminUsers.css';

export default function AdminUsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [usuarios, setUsuarios] = useState<UsuarioAdminDto[]>([]);
  const [roles, setRoles] = useState<RolAdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroRol, setFiltroRol] = useState<string>('TODOS');

  // Modal de creación de usuario
  const [modalCrearUsuario, setModalCrearUsuario] = useState(false);
  const [formNuevoUsuario, setFormNuevoUsuario] = useState({
    nombre: '',
    email: '',
    password: '',
    estado: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    rolId: '',
  });
  const [procesandoCreacion, setProcesandoCreacion] = useState(false);

  // Modal de confirmación de cambio de estado
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioAdminDto | null>(null);
  const [nuevoEstadoPendiente, setNuevoEstadoPendiente] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarUsuarios();
    cargarRoles();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsuarios();
      setUsuarios(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Error al cargar el listado de usuarios'));
    } finally {
      setLoading(false);
    }
  };

  const cargarRoles = async () => {
    try {
      const data = await adminApi.getRoles();
      setRoles(data);
    } catch (err: unknown) {
      console.error('Error cargando roles:', err);
    }
  };

  const abrirCrearUsuario = () => {
    setFormNuevoUsuario({
      nombre: '',
      email: '',
      password: '',
      estado: 'ACTIVO',
      rolId: roles[0]?.id?.toString() || '',
    });
    setModalCrearUsuario(true);
    setError(null);
  };

  const confirmarCreacionUsuario = async () => {
    const nombre = formNuevoUsuario.nombre.trim();
    const email = formNuevoUsuario.email.trim();
    const password = formNuevoUsuario.password.trim();

    if (!nombre || !email || !password) {
      setError('Nombre, email y contraseña son obligatorios.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('El email no tiene un formato válido.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setProcesandoCreacion(true);
    setError(null);

    try {
      const nuevoUsuario = await adminApi.createUsuario({
        nombre,
        email,
        password,
        estado: formNuevoUsuario.estado,
      });

      if (formNuevoUsuario.rolId) {
        await adminApi.asignarRol(nuevoUsuario.id, Number(formNuevoUsuario.rolId));
      }

      setSuccessMsg(`Usuario "${nombre}" creado correctamente.`);
      setModalCrearUsuario(false);
      await cargarUsuarios();
      setFormNuevoUsuario({
        nombre: '',
        email: '',
        password: '',
        estado: 'ACTIVO',
        rolId: roles[0]?.id?.toString() || '',
      });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo crear el usuario'));
    } finally {
      setProcesandoCreacion(false);
    }
  };

  const solicitarCambioEstado = (u: UsuarioAdminDto) => {
    const estadoObjetivo = u.estado?.toUpperCase() === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setUsuarioSeleccionado(u);
    setNuevoEstadoPendiente(estadoObjetivo);
    setModalConfirmacion(true);
  };

  const confirmarCambioEstado = async () => {
    if (!usuarioSeleccionado) return;
    setProcesando(true);
    setError(null);
    try {
      await adminApi.actualizarEstadoUsuario(usuarioSeleccionado.id, nuevoEstadoPendiente);
      setSuccessMsg(
        `Estado del usuario "${usuarioSeleccionado.nombre || usuarioSeleccionado.email}" actualizado a ${nuevoEstadoPendiente} con éxito.`
      );
      setModalConfirmacion(false);
      setUsuarioSeleccionado(null);
      await cargarUsuarios();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'No se pudo actualizar el estado del usuario'));
      setModalConfirmacion(false);
    } finally {
      setProcesando(false);
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const coincideBusqueda =
        !busqueda ||
        u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
        u.email?.toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstado =
        filtroEstado === 'TODOS' || u.estado?.toUpperCase() === filtroEstado;

      const coincideRol =
        filtroRol === 'TODOS' ||
        u.roles?.some((r) => r.toUpperCase().includes(filtroRol.toUpperCase()));

      return coincideBusqueda && coincideEstado && coincideRol;
    });
  }, [usuarios, busqueda, filtroEstado, filtroRol]);

  const metricas = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter((u) => u.estado?.toUpperCase() === 'ACTIVO').length;
    const inactivos = usuarios.filter((u) => u.estado?.toUpperCase() === 'INACTIVO').length;
    const admins = usuarios.filter((u) =>
      u.roles?.some((r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRADOR')
    ).length;
    return { total, activos, inactivos, admins };
  }, [usuarios]);

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div>
          <span className="admin-badge-cu">CU-09</span>
          <h1 className="admin-title">Gestión de Cuentas de Usuarios</h1>
          <p className="admin-subtitle">
            Control de estados operativos (Habilitar / Inhabilitar) y auditoría de accesos al sistema.
          </p>
        </div>
        <div className="header-actions">
          <button onClick={abrirCrearUsuario} className="btn-primary-action" title="Crear nuevo usuario">
            ➕ Nuevo usuario
          </button>
          <button onClick={cargarUsuarios} className="btn-refresh" title="Refrescar lista" disabled={loading}>
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-icon">👥</span>
          <div>
            <div className="metric-value">{metricas.total}</div>
            <div className="metric-label">Total Cuentas</div>
          </div>
        </div>
        <div className="metric-card metric-card-success">
          <span className="metric-icon">✅</span>
          <div>
            <div className="metric-value">{metricas.activos}</div>
            <div className="metric-label">Cuentas Activas</div>
          </div>
        </div>
        <div className="metric-card metric-card-danger">
          <span className="metric-icon">⛔</span>
          <div>
            <div className="metric-value">{metricas.inactivos}</div>
            <div className="metric-label">Cuentas Inhabilitadas</div>
          </div>
        </div>
        <div className="metric-card metric-card-warning">
          <span className="metric-icon">🛡️</span>
          <div>
            <div className="metric-value">{metricas.admins}</div>
            <div className="metric-label">Administradores</div>
          </div>
        </div>
      </div>

      {/* Banners de Notificación */}
      {successMsg && (
        <div className="alert-banner alert-success">
          <span>✅</span>
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="alert-banner alert-error">
          <span>⚠️</span>
          <span>{error}</span>
          <button onClick={() => setError(null)} className="alert-close">✕</button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="filters-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o correo electrónico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="btn-clear-search">✕</button>
          )}
        </div>

        <div className="filter-selects">
          <div className="filter-item">
            <label>Estado:</label>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="select-input">
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Activos (Habilitados)</option>
              <option value="INACTIVO">Inactivos (Inhabilitados)</option>
            </select>
          </div>

          <div className="filter-item">
            <label>Rol:</label>
            <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className="select-input">
              <option value="TODOS">Todos los roles</option>
              <option value="ADMIN">Administradores</option>
              <option value="USER">Usuarios estándar</option>
              <option value="SCRAPER">Scraper</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="table-wrapper">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando cuentas de usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👤</span>
            <p>No se encontraron cuentas con los criterios de búsqueda seleccionados.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Roles Asignados</th>
                <th>Estado Operativo</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.map((u) => {
                const esUsuarioActual = currentUser?.id === u.id || currentUser?.email === u.email;
                const estaActivo = u.estado?.toUpperCase() === 'ACTIVO';

                return (
                  <tr key={u.id} className={!estaActivo ? 'row-inactive' : ''}>
                    <td className="cell-id">#{u.id}</td>
                    <td>
                      <div className="user-cell">
                        <div className="table-avatar">
                          {u.nombre ? u.nombre.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-cell-info">
                          <span className="user-cell-name">{u.nombre || 'Sin nombre'}</span>
                          {esUsuarioActual && <span className="you-badge">(Tu cuenta)</span>}
                        </div>
                      </div>
                    </td>
                    <td className="cell-email">{u.email}</td>
                    <td>
                      <div className="roles-list">
                        {u.roles && u.roles.length > 0 ? (
                          u.roles.map((r, idx) => (
                            <span
                              key={idx}
                              className={`role-badge ${
                                r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'ADMINISTRADOR'
                                    ? 'role-admin'
                                    : 'role-user'
                              }`}
                            >
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="role-badge role-none">Sin rol</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${estaActivo ? 'status-active' : 'status-inactive'}`}>
                        <span className="status-dot"></span>
                        {estaActivo ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => solicitarCambioEstado(u)}
                        disabled={esUsuarioActual && estaActivo}
                        title={
                          esUsuarioActual && estaActivo
                            ? 'No podés inhabilitar tu propia cuenta de administrador en sesión'
                            : estaActivo
                            ? 'Inhabilitar acceso a esta cuenta'
                            : 'Habilitar acceso a esta cuenta'
                        }
                        className={`btn-action-status ${estaActivo ? 'btn-deactivate' : 'btn-activate'}`}
                      >
                        {estaActivo ? '⛔ Inhabilitar' : '✅ Habilitar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalCrearUsuario && (
        <div className="modal-overlay" onClick={() => !procesandoCreacion && setModalCrearUsuario(false)}>
          <div className="modal-card modal-crear-usuario" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">👤</span>
              <h3>Crear nuevo usuario</h3>
            </div>

            <div className="form-grid">
              <div className="form-group full-width">
                <label className="form-label">Nombre completo</label>
                <input
                  type="text"
                  value={formNuevoUsuario.nombre}
                  onChange={(e) => setFormNuevoUsuario((prev) => ({ ...prev, nombre: e.target.value }))}
                  className="form-input"
                  placeholder="Ej: Ana López"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Correo electrónico</label>
                <input
                  type="email"
                  value={formNuevoUsuario.email}
                  onChange={(e) => setFormNuevoUsuario((prev) => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                  placeholder="usuario@empresa.com"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  value={formNuevoUsuario.password}
                  onChange={(e) => setFormNuevoUsuario((prev) => ({ ...prev, password: e.target.value }))}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rol asignado</label>
                <select
                  value={formNuevoUsuario.rolId}
                  onChange={(e) => setFormNuevoUsuario((prev) => ({ ...prev, rolId: e.target.value }))}
                  className="form-input"
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id.toString()}>
                      {rol.nombreRol}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estado</label>
                <select
                  value={formNuevoUsuario.estado}
                  onChange={(e) =>
                    setFormNuevoUsuario((prev) => ({
                      ...prev,
                      estado: e.target.value as 'ACTIVO' | 'INACTIVO',
                    }))
                  }
                  className="form-input"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setModalCrearUsuario(false)} disabled={procesandoCreacion}>
                Cancelar
              </button>
              <button type="button" className="btn-modal-confirm btn-modal-success" onClick={confirmarCreacionUsuario} disabled={procesandoCreacion}>
                {procesandoCreacion ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cambio de Estado */}
      {modalConfirmacion && usuarioSeleccionado && (
        <div className="modal-overlay" onClick={() => !procesando && setModalConfirmacion(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-icon">
                {nuevoEstadoPendiente === 'INACTIVO' ? '⚠️' : '✨'}
              </span>
              <h3>Confirmar Modificación de Estado</h3>
            </div>

            <div className="modal-body">
              <p>
                ¿Estás seguro de que deseas cambiar el estado operativo del usuario{' '}
                <strong>{usuarioSeleccionado.nombre || usuarioSeleccionado.email}</strong>?
              </p>
              <div className="state-transition-card">
                <div className="transition-step">
                  <span className="step-label">Estado Actual:</span>
                  <span className={`status-pill ${usuarioSeleccionado.estado === 'ACTIVO' ? 'status-active' : 'status-inactive'}`}>
                    {usuarioSeleccionado.estado}
                  </span>
                </div>
                <span className="transition-arrow">➔</span>
                <div className="transition-step">
                  <span className="step-label">Nuevo Estado:</span>
                  <span className={`status-pill ${nuevoEstadoPendiente === 'ACTIVO' ? 'status-active' : 'status-inactive'}`}>
                    {nuevoEstadoPendiente}
                  </span>
                </div>
              </div>

              {nuevoEstadoPendiente === 'INACTIVO' && (
                <div className="warning-notice">
                  ℹ️ El usuario no podrá iniciar sesión en la plataforma mientras su cuenta permanezca inactiva.
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setModalConfirmacion(false)}
                className="btn-modal-cancel"
                disabled={procesando}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarCambioEstado}
                className={`btn-modal-confirm ${nuevoEstadoPendiente === 'INACTIVO' ? 'btn-modal-danger' : 'btn-modal-success'}`}
                disabled={procesando}
              >
                {procesando ? 'Procesando...' : `Sí, cambiar a ${nuevoEstadoPendiente}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
