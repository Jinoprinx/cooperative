import { Platform } from 'react-native';

// Central app config — all environment-specific constants live here
export const Config = {
  // Production: 'https://coopbkend-acfb9cb075e5.herokuapp.com/api',
  API_BASE_URL: 'https://coopbkend-acfb9cb075e5.herokuapp.com/api',
  APP_NAME: 'Coopapp',
  VERSION: '1.0.0',
};

export const COLORS = {
  primary: '#3b82f6',
  primaryDark: '#1d4ed8',
  primaryLight: '#60a5fa',
  secondary: '#10b981',
  accent: '#f59e0b',
  background: '#050505',
  surface: '#111111',
  surfaceHover: '#1a1a1a',
  border: 'rgba(255,255,255,0.08)',
  text: '#ffffff',
  textMuted: 'rgba(255,255,255,0.5)',
  textFaint: 'rgba(255,255,255,0.25)',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
};
