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

// Response interceptor — handle 401 with silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    // If 401 and we haven't tried to refresh yet
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh-token endpoint
        const res = await axios.post(`${Config.API_BASE_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { token: newAccessToken, refreshToken: newRefreshToken } = res.data;

        // Save new tokens
        await Promise.all([
          storage.setToken(newAccessToken),
          storage.setRefreshToken(newRefreshToken)
        ]);

        // Update authorization header and retry
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Silent refresh failed:', refreshError);
        await storage.clearAll();
        // The app will react to the missing token in SecureStore
        return Promise.reject(error);
      }
    }

    if (error.response.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }
    return Promise.reject(error);
  }
);

export default api;
