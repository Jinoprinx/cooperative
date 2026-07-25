import { Platform } from 'react-native';

// Central app config — all environment-specific constants live here
export const Config = {
  // Production: 'https://coopbkend-acfb9cb075e5.herokuapp.com/api',
  API_BASE_URL: 'https://coopbkend-acfb9cb075e5.herokuapp.com/api',
  APP_NAME: 'Coopapp',
  VERSION: '1.0.0',
};

export const COLORS = {
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryLight: '#FBBF24',
  secondary: '#FBBF24',
  accent: '#8B5CF6',
  background: '#0F172A',
  surface: '#272F42',
  surfaceHover: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#64748B',
  error: '#EF4444',
  success: '#10B981',
  warning: '#FBBF24',
};
