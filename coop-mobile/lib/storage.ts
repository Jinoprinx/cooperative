import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'coopapp_token';
const REFRESH_TOKEN_KEY = 'coopapp_refresh_token';
const USER_KEY = 'coopapp_user';
const TENANT_KEY = 'coopapp_tenant';
const BIOMETRIC_KEY = 'coopapp_biometric_enabled';

const setItem = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error('Local storage set error:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItem = async (key: string): Promise<string | null> => {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.error('Local storage get error:', e);
    }
    return null;
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const removeItem = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.error('Local storage remove error:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export const storage = {
  // Token
  async getToken(): Promise<string | null> {
    return getItem(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await setItem(TOKEN_KEY, token);
  },
  async removeToken(): Promise<void> {
    await removeItem(TOKEN_KEY);
  },

  // Refresh Token
  async getRefreshToken(): Promise<string | null> {
    return getItem(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    await setItem(REFRESH_TOKEN_KEY, token);
  },
  async removeRefreshToken(): Promise<void> {
    await removeItem(REFRESH_TOKEN_KEY);
  },

  // User
  async getUser(): Promise<any | null> {
    const raw = await getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setUser(user: any): Promise<void> {
    await setItem(USER_KEY, JSON.stringify(user));
  },
  async removeUser(): Promise<void> {
    await removeItem(USER_KEY);
  },

  // Tenant
  async getTenant(): Promise<{ subdomain: string; name: string } | null> {
    const raw = await getItem(TENANT_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  async setTenant(tenant: { subdomain: string; name: string }): Promise<void> {
    await setItem(TENANT_KEY, JSON.stringify(tenant));
  },
  async removeTenant(): Promise<void> {
    await removeItem(TENANT_KEY);
  },

  // Biometrics
  async getBiometricEnabled(): Promise<boolean> {
    const val = await getItem(BIOMETRIC_KEY);
    return val === 'true';
  },
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    await setItem(BIOMETRIC_KEY, enabled ? 'true' : 'false');
  },

  // Clear all auth session data
  async clearAll(): Promise<void> {
    await Promise.all([
      removeItem(TOKEN_KEY),
      removeItem(REFRESH_TOKEN_KEY),
      removeItem(USER_KEY),
      // We keep TENANT_KEY so the user stays in their cooperative's context after logout
    ]);
  },
};
