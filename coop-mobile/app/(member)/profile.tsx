import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Card } from '../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Profile() {
  const { user, logout, refreshUser } = useAuth();
  const { tenant } = useTenant();

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of your account?",
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

  const menuItems = [
    { icon: 'shield-check-outline', label: 'Security & Password', color: '#6b7280' },
    { icon: 'bell-outline', label: 'Notifications', color: '#6b7280' },
    { icon: 'help-circle-outline', label: 'Support Center', color: '#6b7280' },
    { icon: 'information-outline', label: 'App Information', color: '#6b7280' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Profile Header */}
        <View className="items-center mb-10 mt-8">
          <View className="relative">
            <View className="w-28 h-28 bg-surface border-4 border-primary/20 rounded-[2.5rem] items-center justify-center shadow-xl shadow-primary/10 overflow-hidden">
              {user?.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} className="w-full h-full" />
              ) : (
                <MaterialCommunityIcons name="account" size={60} color="rgba(255,255,255,0.1)" />
              )}
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-2xl items-center justify-center border-4 border-background shadow-lg">
              <MaterialCommunityIcons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-3xl font-black text-white mt-6 tracking-tighter">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-white/40 font-bold uppercase tracking-[0.2em] mt-1">
            Active Member
          </Text>
        </View>

        {/* Cooperative Badge */}
        <View className="bg-primary/5 border border-primary/10 rounded-3xl p-5 mb-8 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-primary rounded-xl items-center justify-center mr-4">
              <MaterialCommunityIcons name="office-building" size={24} color="white" />
            </View>
            <View>
              <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Your Cooperative</Text>
              <Text className="text-white font-bold text-lg">{tenant?.name || 'Cooperative'}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="check-decagram" size={24} color="#3b82f6" />
        </View>

        {/* Account Info */}
        <Card title="Account Details" className="mb-8">
          <View className="space-y-6">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="identifier" size={20} color="rgba(255,255,255,0.2)" className="mr-4" />
              <View>
                <Text className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Account Number</Text>
                <Text className="text-white font-bold text-base mt-0.5">{user?.accountNumber || 'Pending Verification'}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="email-outline" size={20} color="rgba(255,255,255,0.2)" className="mr-4" />
              <View>
                <Text className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Email Address</Text>
                <Text className="text-white font-bold text-base mt-0.5">{user?.email}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <MaterialCommunityIcons name="phone-outline" size={20} color="rgba(255,255,255,0.2)" className="mr-4" />
              <View>
                <Text className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Phone Number</Text>
                <Text className="text-white font-bold text-base mt-0.5">{user?.phoneNumber || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Menu Items */}
        <View className="space-y-3 mb-10">
          {menuItems.map((item, i) => (
            <TouchableOpacity 
              key={i}
              className="bg-surface border border-border p-5 rounded-3xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white/5 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text className="text-white font-bold">{item.label}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.1)" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/20 py-5 rounded-3xl items-center mb-10"
        >
          <Text className="text-red-500 font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-white/10 text-center text-xs font-bold uppercase tracking-[0.3em]">
          Coopapp Mobile v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
