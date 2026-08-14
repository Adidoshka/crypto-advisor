import axios from 'axios';

// In dev, '/api' resolves via Vite's proxy; in production VITE_API_BASE_URL must point at the deployed backend directly.
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear stored auth and reload into /login — but not for /auth/* itself, where a 401 is Login's own "wrong password" response, not a stale session.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthEndpoint = err.config?.url?.includes('/auth/');
    if (err.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('name');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export default api;
