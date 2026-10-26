import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore, isAdmin } from '@/features/auth';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin(user)) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}

export default AdminRoute;
