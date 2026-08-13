import axios from 'axios';

// In dev, '/api' resolves via Vite's proxy (see vite.config.ts). In production
// the frontend and backend are separate deployed origins, so VITE_API_BASE_URL
// must point at the deployed backend directly.
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
