import axios from 'axios';

const PUBLIC_ENDPOINTS = [
  '/auth/',
];

const isPublicEndpoint = (url = '') =>
  PUBLIC_ENDPOINTS.some(prefix => url.startsWith(prefix) || url.startsWith(prefix.replace(/\/$/, '')));

export const apiClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

let tokenGetter: (() => string | null) = () => {
  return localStorage.getItem('token');
};

let logoutHandler: ((reason?: string) => void) = (reason = 'expired') => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = `/login?${reason}=true`;
  }
};

export const setApiAuthHandlers = (
  getToken: () => string | null,
  onLogout: (reason?: string) => void
) => {
  tokenGetter = getToken;
  logoutHandler = onLogout;
};

apiClient.interceptors.request.use((config) => {
  if (isPublicEndpoint(config.url)) {
    return config;
  }
  const token = tokenGetter();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    if ((status === 401 || status === 403) && !isPublicEndpoint(url)) {
      logoutHandler('expired');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
