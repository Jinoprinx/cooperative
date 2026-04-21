import axios, { AxiosError } from 'axios';
import { storage } from './storage';
import { Config } from '../constants/config';

export const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach JWT + tenant subdomain header
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenant = await storage.getTenant();
    if (tenant?.subdomain) {
      config.headers['x-tenant-subdomain'] = tenant.subdomain;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 silently
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    if (error.response.status === 401) {
      await storage.clearAll();
      // Auth context will react to missing token on next render
    }
    if (error.response.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    return Promise.reject(error);
  }
);

export default api;
