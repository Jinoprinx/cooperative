import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { TenantProvider } from '../context/TenantContext';
import * as SplashScreen from 'expo-splash-screen';
import { PanResponder, View, Alert } from 'react-native';
import "../global.css";

import { ThemeProvider, useTheme } from '../context/ThemeContext';

import Animated from 'react-native-reanimated';
import { AppState } from 'react-native';
import { LockScreen } from '../components/LockScreen';
import { NetworkBanner } from '../components/NetworkBanner';
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

// Sentry Initialization for Mobile
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    debug: false,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 1.0,
  });
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNav() {
  const { isAuthenticated, logout, isAppLocked, isBiometricEnabled, unlockApp } = useAuth();
  const { colorScheme, themeVars } = useTheme();
  const lastActivity = useRef(Date.now());
  const appState = useRef(AppState.currentState);

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);
  
  useEffect(() => {
    // Hide splash screen after initialization
    SplashScreen.hideAsync();
  }, []);

  // Memoize colors to avoid Reanimated warnings with inline ternaries
  const navColors = useMemo(() => ({
    background: colorScheme === 'dark' ? '#050505' : '#ffffff',
    text: colorScheme === 'dark' ? '#ffffff' : '#050505',
  }), [colorScheme]);

  // Inactivity Logout (20 minutes)
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity.current > 20 * 60 * 1000) {
        clearInterval(checkInterval);
        logout();
        Alert.alert('Session Expired', 'You have been logged out due to inactivity.');
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [isAuthenticated, logout]);

  // App State Listener (Re-lock on background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        if (isAuthenticated && isBiometricEnabled) {
          unlockApp(); // Show biometric prompt on return
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isBiometricEnabled, unlockApp]);

  if (isAuthenticated && isAppLocked) {
    return <LockScreen />;
  }

  // Adding a key to the Stack forces the entire navigation state to reset 
  // when the authentication state changes. This is the most reliable way 
  // to prevent "stuck" navigation or loops during sign-out.
  return (
    <View 
      className={colorScheme === 'dark' ? 'dark' : ''}
      style={[{ flex: 1 }, themeVars]} 
      onStartShouldSetResponderCapture={() => {
        resetTimer();
        return false; 
      }}
      onResponderMove={() => {
        resetTimer();
      }}
    >
      <Stack 
        key={isAuthenticated ? "authenticated" : "unauthenticated"}
        screenOptions={{
          headerStyle: {
            backgroundColor: navColors.background,
          },
          headerTintColor: navColors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: navColors.background,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(member)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'card' }} />
      </Stack>
    </View>
  );
}

export default Sentry.wrap(function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <ThemeProvider>
            <NetworkBanner />
            <RootNav />
            <ThemeStatusBar />
          </ThemeProvider>
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
});

function ThemeStatusBar() {
  const { colorScheme } = useTheme();
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}
