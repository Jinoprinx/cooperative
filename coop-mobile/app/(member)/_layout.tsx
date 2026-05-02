import React, { useMemo } from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';
import { useTenant } from '../../context/TenantContext';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { tenant, isLoading: isTenantLoading } = useTenant();
  const { colorScheme, primaryColor } = useTheme();

  const tabColors = useMemo(() => ({
    headerBg: colorScheme === 'dark' ? '#050505' : '#ffffff',
    headerText: colorScheme === 'dark' ? '#fff' : '#050505',
    tabBarBg: colorScheme === 'dark' ? '#0a0a0a' : '#f9f9f9',
    tabBarBorder: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    inactiveText: colorScheme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
  }), [colorScheme]);

  // ONLY show spinner if we are in the middle of a state transition (loading)
  if (isTenantLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: tabColors.headerBg,
          borderBottomWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: tabColors.headerText,
          fontWeight: 'bold',
          fontSize: 20,
        },
        tabBarStyle: {
          backgroundColor: tabColors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: tabColors.tabBarBorder,
          height: 90,
          paddingBottom: 30,
          paddingTop: 10,
        },
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: tabColors.inactiveText,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />
          ),
          headerTitle: 'Dashboard',
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="swap-vertical" size={size} color={color} />
          ),
          headerTitle: 'Recent Activity',
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
      <Tabs.Screen
        name="coming-soon"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
