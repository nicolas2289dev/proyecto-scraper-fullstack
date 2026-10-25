import { create } from 'zustand';
import type { User, AuthState } from '../types/auth.types';
import { setApiAuthHandlers } from '@/shared/api';

export const isAdmin = (user: User | null | undefined): boolean => {
  if (!user || !user.roles) return false;
  return user.roles.some((r) => {
    const roleUpper = r.toUpperCase();
    return (
      roleUpper === 'ADMIN' ||
      roleUpper === 'ADMINISTRADOR' ||
      roleUpper === 'ROLE_ADMIN' ||
      roleUpper === 'ROLE_ADMINISTRADOR'
    );
  });
};

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  authModalOpen: false,
  authModalMode: 'login',
  openAuthModal: (mode = 'login') => set({ authModalOpen: true, authModalMode: mode }),
  closeAuthModal: () => set({ authModalOpen: false }),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token, authModalOpen: false });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));

// Vincular los handlers del interceptor HTTP para evitar acoplamiento circular
setApiAuthHandlers(
  () => useAuthStore.getState().token,
  () => useAuthStore.getState().logout()
);
