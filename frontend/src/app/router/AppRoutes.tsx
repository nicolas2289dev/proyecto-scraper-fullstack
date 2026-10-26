import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage, RegisterPage } from '@/features/auth';
import { MainLayout } from '@/app/layouts/MainLayout';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { AdminRoute } from '@/app/components/AdminRoute';
import { MyListsPage, ListDetailPage } from '@/features/lists';
import { HomePage } from '@/features/products';
import { AdminDashboardPage, AdminUsersPage, AdminCatalogPage } from '@/features/admin';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegisterPage />} />

      <Route
        path="/home"
        element={
          <MainLayout>
            <HomePage />
          </MainLayout>
        }
      />

      <Route
        path="/mis-listas"
        element={
          <ProtectedRoute>
            <MainLayout>
              <MyListsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/mis-listas/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ListDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Rutas de Administración (CU-09 y CU-10) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <MainLayout>
              <AdminDashboardPage />
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/usuarios"
        element={
          <AdminRoute>
            <MainLayout>
              <AdminUsersPage />
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route
        path="/admin/catalogo"
        element={
          <AdminRoute>
            <MainLayout>
              <AdminCatalogPage />
            </MainLayout>
          </AdminRoute>
        }
      />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default AppRoutes;
