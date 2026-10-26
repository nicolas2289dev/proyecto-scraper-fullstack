import apiClient from '@/shared/api';
import type { ApiResponse } from '@/shared/types';
import type { LoginForm, RegisterForm, User } from '../types/auth.types';

export interface LoginResponseData extends User {
  token: string;
}

export const authApi = {
  login: async (credentials: LoginForm): Promise<LoginResponseData> => {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', {
      email: credentials.email.trim(),
      password: credentials.password,
    });
    return response.data.data;
  },

  register: async (form: RegisterForm): Promise<void> => {
    const payload = {
      nombre: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    };
    await apiClient.post('/usuarios', payload);
  },
};
