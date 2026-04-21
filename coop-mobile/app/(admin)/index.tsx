import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../context/AuthContext';
import { useAdminData } from '../../hooks/useAdminData';
import { formatCurrency } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AdminDashboard() {
  const { user } = useUser();
  const { logout } = useAuth();
  const { stats, isLoading, refetch } = useAdminData();

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of the admin console?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          onPress: async () => {
            await logout();
          }, 
          style: "destructive" 
        }
      ]
    );
  };

  const onRefresh = React.useCallback(() => {
    refetch();
  }, []);

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Welcome Header */}
        <View className="mb-8 flex-row justify-between items-start">
          <View>
            <View className="flex-row items-center mb-2">
              <View className="bg-primary/20 px-3 py-1 rounded-full border border-primary/30 mr-3">
                <Text className="text-primary text-[10px] font-black uppercase tracking-widest">
                  {user?.role === 'super-admin' ? 'Main Admin' : 'Admin'}
                </Text>
              </View>
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">
                Executive Overview
              </Text>
            </View>
            <Text className="text-4xl font-black text-white tracking-tighter">
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={handleLogout}
            className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-2xl items-center justify-center"
          >
            <MaterialCommunityIcons name="logout-variant" size={24} color="#f43f5e" />
          </TouchableOpacity>
        </View>

        {/* Society Total Balance */}
        <Card className="mb-8 bg-primary/10 border-primary/20 p-6">
          <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">Total Society Assets</Text>
          <Text className="text-5xl font-black text-white tracking-tighter mb-4">
            {formatCurrency(stats?.totalBalance || 0)}
          </Text>
          
          <View className="flex-row border-t border-white/5 pt-4">
            <View className="flex-1">
              <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Total Inbound</Text>
              <Text className="text-emerald-500 font-bold text-lg">{formatCurrency(stats?.totalInbound || 0)}</Text>
            </View>
            <View className="w-[1px] bg-white/5 mx-4" />
            <View className="flex-1">
              <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Total Outbound</Text>
              <Text className="text-rose-500 font-bold text-lg">{formatCurrency(stats?.totalOutbound || 0)}</Text>
            </View>
          </View>
        </Card>

        {/* Actionable Metrics */}
        <Text className="text-white font-bold text-lg mb-4 tracking-tight">Pending Actions</Text>
        <View className="flex-row space-x-4 mb-8">
          <TouchableOpacity className="flex-1 bg-surface border border-border p-5 rounded-3xl">
            <View className="w-12 h-12 bg-amber-500/10 rounded-2xl items-center justify-center mb-3">
              <MaterialCommunityIcons name="hand-pointing-up" size={24} color="#f59e0b" />
            </View>
            <Text className="text-3xl font-black text-white">{stats?.pendingLoans || 0}</Text>
            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Loan Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 bg-surface border border-border p-5 rounded-3xl">
            <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center mb-3">
              <MaterialCommunityIcons name="account-plus-outline" size={24} color="#3b82f6" />
            </View>
            <Text className="text-3xl font-black text-white">{stats?.pendingRegistrations || 0}</Text>
            <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Registrations</Text>
          </TouchableOpacity>
        </View>

        {/* General Statistics */}
        <Text className="text-white font-bold text-lg mb-4 tracking-tight">System Status</Text>
        <View className="space-y-3 mb-8">
          <View className="bg-surface border border-border p-5 rounded-3xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center mr-4">
                <MaterialCommunityIcons name="account-group-outline" size={20} color="rgba(255,255,255,0.5)" />
              </View>
              <Text className="text-white font-bold">Total Members</Text>
            </View>
            <Text className="text-white font-black text-lg">{stats?.totalMembers || 0}</Text>
          </View>

          <View className="bg-surface border border-border p-5 rounded-3xl flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center mr-4">
                <MaterialCommunityIcons name="hand-coin-outline" size={20} color="rgba(255,255,255,0.5)" />
              </View>
              <Text className="text-white font-bold">Active Loans</Text>
            </View>
            <Text className="text-white font-black text-lg">{stats?.activeLoans || 0}</Text>
          </View>
        </View>

        {!isAdmin && (
          <View className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex-row items-center mb-8">
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#f43f5e" />
            <Text className="text-rose-500 text-xs font-bold ml-3 flex-1">
              Restricted Access: Some administrative functions are only available to the Main Admin.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/20 py-5 rounded-3xl items-center mb-6"
        >
          <Text className="text-red-500 font-bold text-lg">Sign Out Admin</Text>
        </TouchableOpacity>

        <Text className="text-white/10 text-center text-xs font-bold uppercase tracking-[0.3em]">
          Admin Console v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

