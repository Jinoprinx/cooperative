import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Card } from '../../components/ui/Card';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUser } from '../../hooks/useUser';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useRouter } from 'expo-router';

import { useTheme } from '../../context/ThemeContext';

export default function AdminProfile() {
  const { logout, refreshUser, isMainAdmin } = useAuth();
  const { user, refetch: refetchUser } = useUser();
  const { tenant } = useTenant();
  const { primaryColor } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    refreshUser();
  }, []);
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post('/auth/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      refetchUser();
      Alert.alert('Success', 'Profile image updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload profile image');
    }
  });
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleUpload(result.assets[0]);
    }
  };

  const handleUpload = (asset: ImagePicker.ImagePickerAsset) => {
    const formData = new FormData();
    const uriParts = asset.uri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('profileImage', {
      uri: asset.uri,
      name: `profile.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    uploadMutation.mutate(formData);
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out?",
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Profile Header */}
        <View className="items-center mb-10 mt-8">
          <View className="relative">
            <View className="w-28 h-28 bg-surface border-4 border-primary/20 rounded-[2.5rem] items-center justify-center shadow-xl shadow-primary/10 overflow-hidden">
              {uploadMutation.isPending ? (
                <ActivityIndicator color={primaryColor} />
              ) : user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} className="w-full h-full" />
              ) : (
                <MaterialCommunityIcons name="account" size={60} color="rgba(150, 150, 150, 0.8)" />
              )}
            </View>
            <TouchableOpacity 
              onPress={pickImage}
              disabled={uploadMutation.isPending}
              className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-2xl items-center justify-center border-4 border-background shadow-lg"
            >
              <MaterialCommunityIcons name="camera" size={18} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text className="text-3xl font-black text-foreground mt-6 tracking-tighter">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-primary font-bold uppercase tracking-[0.2em] mt-1">
            Cooperative {isMainAdmin ? 'Executive' : 'Admin'}
          </Text>
        </View>

        {/* Navigation Actions */}
        <View className="space-y-3 mb-8">
          {isMainAdmin && (
            <TouchableOpacity 
              onPress={() => router.push('/settings')}
              className="bg-surface border border-border p-5 rounded-3xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-blue-500/10 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="cog-outline" size={20} color="#3b82f6" />
                </View>
                <Text className="text-foreground font-bold">Cooperative Settings</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(var(--foreground), 0.5)" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            onPress={() => router.push('/(member)')}
            className="bg-surface border border-border p-5 rounded-3xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-emerald-500/10 rounded-xl items-center justify-center mr-4">
                <MaterialCommunityIcons name="account-convert" size={20} color="#10b981" />
              </View>
              <Text className="text-foreground font-bold">Switch to Member Hub</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(var(--foreground), 0.5)" />
          </TouchableOpacity>

          {user?.role === 'super-admin' && (
            <TouchableOpacity 
              onPress={() => {
                // Since this is a web-first console, we link to the web URL or just alert for now if mobile isn't ready
                // But the user asked to "start building out this page", so I'll assume they want to see it on web.
                // However, I can also add a placeholder for mobile super-admin if they want.
                // For now, I'll just show the gold button.
                Alert.alert("Global Access", "The Super Admin Console is optimized for Desktop management. Please access it at cooperatives.io/super-admin");
              }}
              className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="crown" size={20} color="#fbbf24" />
                </View>
                <Text className="text-amber-500 font-black uppercase tracking-widest text-xs">Global Platform Console</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#fbbf24" />
            </TouchableOpacity>
          )}
        </View>

        {/* Cooperative Badge */}
        <View className="bg-primary/5 border border-primary/10 rounded-3xl p-5 mb-8 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-primary rounded-xl items-center justify-center mr-4">
              <MaterialCommunityIcons name="office-building" size={24} color="white" />
            </View>
            <View>
              <Text className="text-foreground/45 text-[9px] font-black uppercase tracking-widest mb-1">Organization</Text>
              <Text className="text-foreground font-bold text-lg">{tenant?.name || 'Cooperative Ltd'}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="shield-check" size={24} color={primaryColor} />
        </View>

        {/* Account Info */}
        <Card title="Admin Details" className="mb-8">
          <View className="space-y-6">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="identifier" size={20} color="rgba(var(--foreground), 0.45)" className="mr-4" />
              <View>
                <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest">Admin ID</Text>
                <Text className="text-foreground font-bold text-base mt-0.5">{user?.accountNumber || 'ADM-001'}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="email-outline" size={20} color="rgba(var(--foreground), 0.45)" className="mr-4" />
              <View>
                <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest">Official Email</Text>
                <Text className="text-foreground font-bold text-base mt-0.5">{user?.email}</Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <MaterialCommunityIcons name="phone-outline" size={20} color="rgba(var(--foreground), 0.45)" className="mr-4" />
              <View>
                <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest">Phone Number</Text>
                <Text className="text-foreground font-bold text-base mt-0.5">{user?.phoneNumber || 'Not provided'}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/20 py-5 rounded-3xl items-center mb-10"
        >
          <Text className="text-red-500 font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-foreground/30 text-center text-xs font-bold uppercase tracking-[0.3em]">
          Coopapp Admin Platform v1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
