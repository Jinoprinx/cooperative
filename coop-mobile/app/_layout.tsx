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

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNav() {
  const { isAuthenticated, logout } = useAuth();
  const { colorScheme, themeVars } = useTheme();
  const lastActivity = useRef(Date.now());

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

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <ThemeProvider>
            <RootNav />
            <ThemeStatusBar />
          </ThemeProvider>
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}

function ThemeStatusBar() {
  const { colorScheme } = useTheme();
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}
