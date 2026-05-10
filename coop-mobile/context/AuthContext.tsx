'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../lib/storage';
import { User } from '../types';
import api from '../lib/api';
import { useRouter, useSegments } from 'expo-router';
import { useTenant } from './TenantContext';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Sentry from '@sentry/react-native';

// Essential user fields to persist in SecureStore (2048 byte limit on Android)
const STORED_USER_FIELDS = [
  '_id', 'firstName', 'lastName', 'email', 'phoneNumber',
  'role', 'isVerified', 'accountNumber', 'accountBalance',
  'profileImageUrl', 'tenantId', 'isMainAdmin', 'hasPin',
  'subdomain', 'tenantName', 'status',
] as const;

function trimUserForStorage(user: any): any {
  if (!user) return null;
  const trimmed: any = {};
  for (const key of STORED_USER_FIELDS) {
    if (user[key] !== undefined) {
      trimmed[key] = user[key];
    }
  }
  return trimmed;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isBiometricEnabled: boolean;
  isAppLocked: boolean;
}

interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isMainAdmin: boolean;
  refreshUser: () => Promise<void>;
  setBiometrics: (enabled: boolean) => Promise<void>;
  unlockApp: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook to handle protected routes and redirection logic centrally
// Redirection from dashboard to landing on sign-out is handled by the Stack key-reset in app/_layout.tsx
function useProtectedRoute(authState: AuthState, isAuthenticated: boolean) {
  const segments = useSegments();
  const router = useRouter();
  const { tenant, isLoading: isTenantLoading } = useTenant();

  useEffect(() => {
    if (authState.isLoading || isTenantLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isLandingPage = !segments[0] || (segments[0] as any) === 'index';
    
    // Redirect Authenticated users away from public pages
    if (isAuthenticated && authState.user) {
      const isAdmin = authState.user.role === 'admin' || authState.user.role === 'super-admin';
      const targetDashboard = isAdmin ? '/(admin)' : '/(member)';

      // 1. Missing tenant -> force selection (unless already there or in auth group)
      if (!tenant && segments[0] !== 'tenant-select' && !inAuthGroup) {
        router.replace('/tenant-select');
      } 
      // 2. Logged in user at landing/auth/tenant-select -> send to dashboard
      else if (isLandingPage || inAuthGroup || (tenant && segments[0] === 'tenant-select')) {
        router.replace(targetDashboard as any);
      }
    }
    // Handle unauthenticated users (e.g. after logout)
    else if (!isAuthenticated && !authState.isLoading) {
      // If user has a tenant selected, redirect to the tenant's login page
      if (tenant && !inAuthGroup && segments[0] !== 'tenant-select') {
        router.replace('/(auth)/login' as any);
      }
      // If no tenant, send to tenant-select (unless already there or on landing)
      else if (!tenant && !isLandingPage && segments[0] !== 'tenant-select') {
        // However, allow them to access new society registration directly
        const isRegisterPage = segments[0] === '(auth)' && segments[1] === 'register';
        if (!isRegisterPage) {
          router.replace('/tenant-select');
        }
      }
    }
  }, [isAuthenticated, authState.user?.role, !!tenant, segments[0], segments[1], authState.isLoading, isTenantLoading]);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isBiometricEnabled: false,
    isAppLocked: false,
  });

  // Load persisted session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [storedToken, storedRefreshToken, storedUser, biometricEnabled] = await Promise.all([
          storage.getToken(),
          storage.getRefreshToken(),
          storage.getUser(),
          storage.getBiometricEnabled(),
        ]);
        if (storedToken && storedUser) {
          setAuthState({
            token: storedToken,
            user: storedUser,
            isBiometricEnabled: !!biometricEnabled,
            isAppLocked: !!biometricEnabled, // Lock app if biometrics are enabled
            isLoading: false,
          });
          Sentry.setUser({ id: storedUser._id, email: storedUser.email });
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (e) {
        console.error('Session load error', e);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };
    loadSession();
  }, []);

  const isAuthenticated = !!authState.token && !!authState.user && !authState.isLoading;
  useProtectedRoute(authState, isAuthenticated);

  const login = async (email: string, password: string, tenantId?: string) => {
    const payload: any = { credential: email, password };
    if (tenantId) payload.tenantId = tenantId;
    
    const res = await api.post('/auth/login', payload);
    const { token: newToken, refreshToken, user: rawUser } = res.data;
    
    // Normalize API field names to match the app's User type
    const newUser = {
      ...rawUser,
      _id: rawUser._id || rawUser.id,
      profileImageUrl: rawUser.profileImage || rawUser.profileImageUrl,
    };
    
    await Promise.all([
      storage.setToken(newToken),
      storage.setRefreshToken(refreshToken)
    ]);
    
    try {
      await storage.setUser(trimUserForStorage(newUser));
    } catch (e) {
      console.error('[login] Failed to persist user to SecureStore:', e);
    }
    
    setAuthState({
      token: newToken,
      user: newUser,
      isLoading: false,
    });
    Sentry.setUser({ id: newUser._id, email: newUser.email });
  };

  const logout = async () => {
    try {
      console.log('Logout starting...');
      await storage.clearAll();
      setAuthState({
        token: null,
        user: null,
        isLoading: false,
      });
      Sentry.setUser(null);
      console.log('Logout state cleared');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const refreshUser = async () => {
    if (!authState.token) return;
    try {
      const res = await api.get('/auth/profile');
      const profileData = res.data.user || res.data;
      
      // Normalize API field names to match the app's User type
      const updatedUser = {
        ...authState.user, // preserve existing fields (e.g. subdomain, tenantName)
        ...profileData,
        _id: profileData._id || profileData.id,
        phoneNumber: profileData.phoneNumber || authState.user?.phoneNumber,
        profileImageUrl: profileData.profileImage || profileData.profileImageUrl || authState.user?.profileImageUrl,
      };
      
      try {
        await storage.setUser(trimUserForStorage(updatedUser));
      } catch (e) {
        console.error('[refreshUser] Failed to persist user to SecureStore:', e);
      }
      setAuthState(prev => ({ ...prev, user: updatedUser }));
    } catch (e: any) {
      if (e?.response?.status !== 401) {
        console.error('Refresh user error', e);
      }
    }
  };

  const setBiometrics = async (enabled: boolean) => {
    await storage.setBiometricEnabled(enabled);
    setAuthState(prev => ({ ...prev, isBiometricEnabled: enabled }));
  };

  const unlockApp = async (): Promise<boolean> => {
    if (!authState.isBiometricEnabled) {
      setAuthState(prev => ({ ...prev, isAppLocked: false }));
      return true;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !isEnrolled) {
      setAuthState(prev => ({ ...prev, isAppLocked: false }));
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to access your Cooperative',
      fallbackLabel: 'Use Passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setAuthState(prev => ({ ...prev, isAppLocked: false }));
      return true;
    }
    return false;
  };

  const isAdmin = isAuthenticated && (authState.user?.role === 'admin' || authState.user?.role === 'super-admin');
  const isMainAdmin = isAdmin && !!authState.user?.isMainAdmin;

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        isAuthenticated,
        isAdmin,
        isMainAdmin,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
