'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'user' | 'admin';
  accountNumber: string;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credential: string, password: string, tenantId?: string) => Promise<void>;
  register: (firstName: string, lastName: string, email: string, password: string, phoneNumber: string, tenantId?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check for token on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    // Check for token and user in URL (for cross-subdomain redirection)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlUser = urlParams.get('user');

    if (urlToken && urlUser) {
      const decodedUser = JSON.parse(decodeURIComponent(urlUser));
      setToken(urlToken);
      setUser(decodedUser);
      localStorage.setItem('token', urlToken);
      localStorage.setItem('user', JSON.stringify(decodedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${urlToken}`;

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setLoading(false);
  }, []);

  const login = async (credential: string, password: string, tenantId?: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        credential,
        password,
        tenantId,
      });
      const { token, user } = response.data;

      // Subdomain redirection logic
      const currentHost = window.location.hostname; // e.g., 'localhost' or 'coopa.localhost'

      let mainDomain = 'localhost';
      const parts = currentHost.split('.');

      if (currentHost.endsWith('localhost')) {
        mainDomain = 'localhost';
      } else if (currentHost.endsWith('.vercel.app')) {
        // Vercel apps are always project.vercel.app, so we want the last 3 parts
        // e.g. cooperative-kappa.vercel.app OR tenant.cooperative-kappa.vercel.app
        mainDomain = parts.slice(-3).join('.');
      } else {
        // Assume standard domain (example.com), take last 2 parts
        // e.g. example.com OR tenant.example.com
        mainDomain = parts.slice(-2).join('.');
      }
      const targetSubdomain = user.subdomain; // e.g., 'coopa' or null (for super-admin)

      if (targetSubdomain && !currentHost.startsWith(`${targetSubdomain}.`)) {
        // Redirect to subdomain with token and user data
        const protocol = window.location.protocol;
        const port = window.location.port ? `:${window.location.port}` : '';
        const encodedUser = encodeURIComponent(JSON.stringify(user));
        const redirectUrl = `${protocol}//${targetSubdomain}.${mainDomain}${port}/admin/dashboard?token=${token}&user=${encodedUser}`;

        window.location.href = redirectUrl;
        return; // Stop execution here as we are redirecting
      }

      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
      router.push(redirectPath);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Login failed');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  };

  const register = async (firstName: string, lastName: string, email: string, password: string, phoneNumber: string, tenantId?: string) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        tenantId,
      });
      const { token, user } = response.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`; // Set default header for axios
      router.push(user.role === 'admin' ? '/admin/dashboard' : '/dashboard'); // Redirect based on role
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Registration failed');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization']; // Remove default header
    router.push('/auth/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const isAuthenticated = !!token && !!user;
  const isAdmin = isAuthenticated && user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated, isAdmin, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};