import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

export default function AdminLayout() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { tenant, isLoading: isTenantLoading } = useTenant();

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
          title: 'Overview',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
          headerTitle: 'Admin Console',
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group" size={size} color={color} />
          ),
          headerTitle: 'Manage Members',
        }}
      />
      <Tabs.Screen
        name="loans"
        options={{
          title: 'Loans',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="hand-coin" size={size} color={color} />
          ),
          headerTitle: 'Loan Administration',
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-register" size={size} color={color} />
          ),
          headerTitle: 'Payment Verification',
        }}
      />
    </Tabs>
  );
}
