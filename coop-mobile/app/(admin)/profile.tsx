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

export default function AdminProfile() {
  const { logout, refreshUser } = useAuth();
  const { user, refetch: refetchUser } = useUser();
  const { tenant } = useTenant();
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
                <ActivityIndicator color="#3b82f6" />
              ) : user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} className="w-full h-full" />
              ) : (
                <MaterialCommunityIcons name="account" size={60} color="rgba(255,255,255,0.1)" />
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
          
          <Text className="text-3xl font-black text-white mt-6 tracking-tighter">
            {user?.firstName} {user?.lastName}
          </Text>
          <Text className="text-primary font-bold uppercase tracking-[0.2em] mt-1">
            Cooperative Admin
          </Text>
        </View>

        {/* Cooperative Badge */}
        <View className="bg-primary/5 border border-primary/10 rounded-3xl p-5 mb-8 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-primary rounded-xl items-center justify-center mr-4">
              <MaterialCommunityIcons name="office-building" size={24} color="white" />
            </View>
            <View>
              <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Organization</Text>
              <Text className="text-white font-bold text-lg">{tenant?.name || 'Cooperative Ltd'}</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="shield-check" size={24} color="#3b82f6" />
        </View>

        {/* Account Info */}
        <Card title="Admin Details" className="mb-8">
          <View className="space-y-6">
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="identifier" size={20} color="rgba(255,255,255,0.2)" className="mr-4" />
              <View>
                <Text className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Admin ID</Text>
                <Text className="text-white font-bold text-base mt-0.5">{user?.accountNumber || 'ADM-001'}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="email-outline" size={20} color="rgba(255,255,255,0.2)" className="mr-4" />
              <View>
                <Text className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Official Email</Text>
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

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/20 py-5 rounded-3xl items-center mb-10"
        >
          <Text className="text-red-500 font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-white/10 text-center text-xs font-bold uppercase tracking-[0.3em]">
          Coopapp Admin Platform v1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
