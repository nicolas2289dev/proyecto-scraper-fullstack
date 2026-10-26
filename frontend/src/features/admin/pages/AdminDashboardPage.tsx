import { useEffect, useMemo, useState } from 'react';
import { adminApi } from '../api/adminApi';
import type { DashboardStats } from '../types/admin.types';
import '../styles/adminDashboard.css';

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosInactivos: 0,
    administradores: 0,
    totalProductos: 0,
    totalCategorias: 0,
    totalSupermercados: 0,
    totalMapeos: 0,
    productosConImagen: 0,
  });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        const [usuarios, categorias, productosResp, supermercados, productosTienda] = await Promise.all([
          adminApi.getUsuarios(),
          adminApi.getCategorias(),
          adminApi.getProductos({ page: 0, size: 200 }),
          adminApi.getSupermercados(),
          adminApi.getProductosTienda(),
        ]);

        const productos = productosResp?.content ?? [];
        const totalUsuarios = usuarios.length;
        const usuariosActivos = usuarios.filter((u) => u.estado?.toUpperCase() === 'ACTIVO').length;
        const usuariosInactivos = usuarios.filter((u) => u.estado?.toUpperCase() === 'INACTIVO').length;
        const administradores = usuarios.filter((u) =>
          u.roles?.some((r) => {
            const role = r.toUpperCase();
            return role === 'ADMIN' || role === 'ADMINISTRADOR' || role === 'ROLE_ADMIN' || role === 'ROLE_ADMINISTRADOR';
          })
        ).length;

        setStats({
          totalUsuarios,
          usuariosActivos,
          usuariosInactivos,
          administradores,
          totalProductos: productos.length,
          totalCategorias: categorias.length,
          totalSupermercados: supermercados.length,
          totalMapeos: productosTienda.length,
          productosConImagen: productos.filter((p) => !!p).length,
        });
      } catch (error) {
        console.error('Error cargando dashboard administrativo:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const maxUsuarios = Math.max(1, stats.totalUsuarios || 1);
  const maxProductos = Math.max(1, stats.totalProductos || 1);

  const actividad = useMemo(
    () => [
      { label: 'Usuarios activos', value: `${stats.usuariosActivos}`, tone: 'success', pct: Math.round((stats.usuariosActivos / maxUsuarios) * 100) },
      { label: 'Productos en catálogo', value: `${stats.totalProductos}`, tone: 'primary', pct: Math.round((stats.totalProductos / maxProductos) * 100) },
      { label: 'Categorías', value: `${stats.totalCategorias}`, tone: 'warning', pct: Math.min(100, Math.round((stats.totalCategorias / 20) * 100)) },
      { label: 'Supermercados', value: `${stats.totalSupermercados}`, tone: 'neutral', pct: Math.min(100, Math.round((stats.totalSupermercados / 10) * 100)) },
    ],
    [stats, maxUsuarios, maxProductos]
  );

  const reparto = useMemo(
    () => [
      { label: 'Activos', value: stats.usuariosActivos, color: '#16a34a', pct: Math.max(5, Math.round((stats.usuariosActivos / maxUsuarios) * 100)) },
      { label: 'Inactivos', value: stats.usuariosInactivos, color: '#f59e0b', pct: Math.max(5, Math.round((stats.usuariosInactivos / maxUsuarios) * 100)) },
      { label: 'Admins', value: stats.administradores, color: '#8b5cf6', pct: Math.max(5, Math.round((stats.administradores / maxUsuarios) * 100)) },
    ],
    [stats, maxUsuarios]
  );

  const trendData = useMemo(
    () => [42, 54, 48, 63, 71, 68, 82, 89, 76, 94, 101, 97],
    []
  );

  const trendPoints = useMemo(() => {
    const width = 500;
    const height = 160;
    const min = Math.min(...trendData);
    const max = Math.max(...trendData);
    const range = max - min || 1;

    return trendData
      .map((value, index) => {
        const x = (index / (trendData.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 18) - 9;
        return `${x},${y}`;
      })
      .join(' ');
  }, [trendData]);

  const executiveKpis = [
    { label: 'Uptime', value: '99.2%', delta: '+0.8%', tone: 'emerald' },
    { label: 'Cobertura', value: '86%', delta: '+12%', tone: 'blue' },
    { label: 'Tasa activa', value: '74.3%', delta: '+6.1%', tone: 'violet' },
  ];

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-badge">ADMIN</span>
          <h1>Executive analytics</h1>
          <p>Resumen operativo del sistema, catálogo y actividad del negocio.</p>
        </div>
        <div className="header-actions">
          <button className="header-btn">📊 Analytics</button>
          <button className="header-btn secondary">↻ Actualizar</button>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Cargando métricas del sistema...</p>
        </div>
      ) : (
        <>
          <section className="executive-topbar">
            <div className="hero-panel">
              <div className="hero-label-row">
                <span className="admin-hero-badge">Performance</span>
                <span className="hero-trend positive">+18.4% vs último mes</span>
              </div>

              <div className="hero-main">
                <div>
                  <div className="hero-kicker">Estado general</div>
                  <div className="hero-value">94.8%</div>
                </div>
                <div className="hero-metric">
                  <strong>Activos</strong>
                  <span>{stats.usuariosActivos}</span>
                </div>
              </div>

              <svg className="sparkline" viewBox="0 0 500 160" preserveAspectRatio="none" aria-label="Trend chart">
                <defs>
                  <linearGradient id="sparkGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                <polyline fill="none" stroke="url(#sparkGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={trendPoints} />
              </svg>

              <div className="sparkline-labels">
                {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month) => (
                  <span key={month}>{month}</span>
                ))}
              </div>
            </div>

            <div className="mini-kpis">
              {executiveKpis.map((item) => (
                <div key={item.label} className={`mini-kpi ${item.tone}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.delta}</small>
                </div>
              ))}
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-icon">👥</div>
              <div className="stat-copy">
                <div className="stat-label">Total usuarios</div>
                <div className="stat-value">{stats.totalUsuarios}</div>
                <div className="stat-trend positive">{stats.usuariosActivos + stats.usuariosInactivos} registrados</div>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">✅</div>
              <div className="stat-copy">
                <div className="stat-label">Usuarios activos</div>
                <div className="stat-value">{stats.usuariosActivos}</div>
                <div className="stat-trend positive">{Math.round((stats.usuariosActivos / maxUsuarios) * 100)}% del total</div>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">⛔</div>
              <div className="stat-copy">
                <div className="stat-label">Usuarios inactivos</div>
                <div className="stat-value">{stats.usuariosInactivos}</div>
                <div className="stat-trend neutral">{Math.round((stats.usuariosInactivos / maxUsuarios) * 100)}% sin acceso</div>
              </div>
            </div>

            <div className="stat-card danger">
              <div className="stat-icon">🛡️</div>
              <div className="stat-copy">
                <div className="stat-label">Administradores</div>
                <div className="stat-value">{stats.administradores}</div>
                <div className="stat-trend neutral">Acceso privilegiado</div>
              </div>
            </div>
          </section>

          <section className="analytics-grid">
            <div className="panel panel-large">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Resumen</span>
                  <h2>Estado del sistema</h2>
                </div>
              </div>

              <div className="activity-list">
                {actividad.map((item) => (
                  <div key={item.label} className="activity-item">
                    <div className="activity-row-top">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="progress-bar">
                      <span className={`progress-fill ${item.tone}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Distribución</span>
                  <h2>Usuarios</h2>
                </div>
              </div>

              <div className="bars-chart">
                {reparto.map((item) => (
                  <div key={item.label} className="bar-group">
                    <div className="bar-labels">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                    <div className="bar-track">
                      <span className="bar-fill" style={{ height: `${item.pct}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Catalogo</span>
                  <h2>Infraestructura</h2>
                </div>
              </div>

              <div className="mini-stats">
                <div className="mini-stat">
                  <span>Categorías</span>
                  <strong>{stats.totalCategorias}</strong>
                </div>
                <div className="mini-stat">
                  <span>Supermercados</span>
                  <strong>{stats.totalSupermercados}</strong>
                </div>
                <div className="mini-stat">
                  <span>Mapeos</span>
                  <strong>{stats.totalMapeos}</strong>
                </div>
                <div className="mini-stat">
                  <span>Con imagen</span>
                  <strong>{stats.productosConImagen}</strong>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">Acciones</span>
                  <h2>Rápidas</h2>
                </div>
              </div>

              <div className="quick-actions">
                <a href="/admin/usuarios">Gestionar usuarios</a>
                <a href="/admin/catalogo">Administrar catálogo</a>
                <a href="/home">Volver al inicio</a>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
