import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { tenant, isLoading: isTenantLoading } = useTenant();

  // ONLY show spinner if we are in the middle of a state transition (loading)
  // If we are NOT authenticated, we return null so the screen is empty while Guard redirects
  if (isAuthLoading || isTenantLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#050505',
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 20,
        },
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
          headerTitle: 'Coopapp',
        }}
      />
      <Tabs.Screen
        name="surety"
        options={{
          title: 'Surety',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-account" size={size} color={color} />
          ),
          headerTitle: 'Surety Requests',
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="hand-coin" size={size} color={color} />
          ),
          headerTitle: 'My Loans',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tabs>
  );
}
