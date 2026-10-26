import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;
