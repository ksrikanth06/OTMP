import axios from 'axios';

const TOKEN_KEY = 'overtime-portal.token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => { localStorage.setItem(TOKEN_KEY, token); };
export const clearToken = (): void => { localStorage.removeItem(TOKEN_KEY); };

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'https://api.etihadrail.ae/ot/v1',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url === '/auth/login';
    if (err.response?.status === 401 && !isLoginRequest) {
      clearToken();
      localStorage.removeItem('overtime-portal.auth');
      window.location.href = '/';
    }
    return Promise.reject(err);
  },
);

export default apiClient;
