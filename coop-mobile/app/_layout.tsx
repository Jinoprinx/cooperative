import { useEffect, useRef, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { TenantProvider } from '../context/TenantContext';
import * as SplashScreen from 'expo-splash-screen';
import { PanResponder, View, Alert } from 'react-native';
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootNav() {
  const { isAuthenticated, logout } = useAuth();
  const lastActivity = useRef(Date.now());

  const resetTimer = useCallback(() => {
    lastActivity.current = Date.now();
  }, []);
  
  useEffect(() => {
    // Hide splash screen after initialization
    SplashScreen.hideAsync();
  }, []);

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
      style={{ flex: 1 }} 
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
            backgroundColor: '#050505',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#050505',
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(member)" options={{ headerShown: false }} />
        <Stack.Screen name="(admin)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <TenantProvider>
        <AuthProvider>
          <RootNav />
          <StatusBar style="light" />
        </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  );
}
