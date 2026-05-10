import React from 'react';
import { View, Text, ActivityIndicator, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTheme } from '../context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Index() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { tenant, tenantDetails, isLoading: isTenantLoading, clearTenant } = useTenant();
  const { primaryColor } = useTheme();
  const router = useRouter();

  console.log('Index Render:', { isAuthLoading, isTenantLoading, isAuthenticated, hasTenant: !!tenant });

  const handleVisitMainSite = async () => {
    await clearTenant();
  };

  if (isAuthLoading || isTenantLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }

  // If a tenant is selected, show the Tenant Landing View
  if (tenant) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <View className="flex-1 px-6 pt-12 pb-8">
            <View className="items-center mb-12 mt-8">
              <View className="w-24 h-24 bg-primary/20 rounded-[2rem] items-center justify-center mb-8 border border-primary/30">
                <Text className="text-primary font-black text-4xl">
                  {tenant.name.charAt(0).toUpperCase()}
                </Text>
              </View>

              <Text className="text-5xl font-black text-foreground tracking-tighter text-center mb-4 leading-none">
                {tenant.name}
              </Text>
              <Text className="text-foreground/40 font-bold uppercase tracking-[0.2em] text-center text-xs">
                Official Cooperative Portal
              </Text>
            </View>

            <View className="bg-surface border border-border p-8 rounded-[2.5rem] mb-12">
              <Text className="text-foreground/60 text-center leading-relaxed font-medium text-lg mb-8">
                Access your contributions, loans, and membership records in one secure place.
              </Text>

              <View className="space-y-4">
                {isAuthenticated ? (
                  <TouchableOpacity
                    onPress={() => router.push(user?.role === 'admin' ? '/(admin)' : '/(member)')}
                    className="bg-primary py-5 rounded-2xl items-center flex-row justify-center shadow-lg shadow-primary/30"
                  >
                    <Text className="text-white font-black text-lg mr-2">Go to Dashboard</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={() => router.push('/(auth)/login')}
                      className="bg-primary py-5 rounded-2xl items-center flex-row justify-center shadow-lg shadow-primary/30"
                    >
                      <Text className="text-white font-black text-lg mr-2">Member Login</Text>
                      <MaterialCommunityIcons name="login" size={20} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push('/(auth)/register')}
                      className="bg-surface border border-border py-5 rounded-2xl items-center"
                    >
                      <Text className="text-foreground font-bold text-lg">Join Cooperative</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>

            <View className="mt-auto pt-10 border-t border-border/50">
              <TouchableOpacity
                onPress={handleVisitMainSite}
                className="py-4 items-center flex-row justify-center"
              >
                <View className="w-8 h-[1px] bg-foreground/10 mr-4" />
                <Text className="text-foreground/30 font-black tracking-[0.3em] uppercase text-[10px]">
                  Switch Cooperative
                </Text>
                <View className="w-8 h-[1px] bg-foreground/10 ml-4" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
        <View className="flex-1 px-6 pt-12 pb-8">

          {/* Debug Marker */}
          <View style={{ height: 2, backgroundColor: primaryColor, width: '100%', marginBottom: 10 }} />

          {/* Hero Section */}
          <View className="mb-12 mt-8">
            <View className="bg-primary/10 self-start px-3 py-1.5 rounded-full border border-primary/20 mb-6 flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-primary mr-2 shadow-sm shadow-primary" />
              <Text className="text-primary text-[10px] font-black tracking-widest uppercase text-glow">
                READY TO START
              </Text>
            </View>

            <Text className="text-6xl font-black text-foreground tracking-tighter leading-[1.1] mb-2">
              Future of
            </Text>
            <Text className="text-6xl font-black text-primary tracking-tighter leading-[1.1] mb-6">
              Cooperative Management
            </Text>

            <Text className="text-foreground/50 text-base font-medium leading-relaxed mb-10 max-w-[90%]">
              Streamline your society with our intelligent, secure, and fully automated financial ecosystem.
            </Text>

            <View className="space-y-4">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  // User wants to join an existing cooperative or login
                  router.push('/tenant-select');
                }}
                className="bg-primary py-4 rounded-2xl items-center flex-row justify-center shadow-lg shadow-primary/30"
              >
                <Text className="text-white font-bold text-base mr-2">Member Login</Text>
                <MaterialCommunityIcons name="login" size={20} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  // Admin wants to create a new cooperative (tenant == null)
                  router.push('/(auth)/register');
                }}
                className="bg-surface border border-border py-4 rounded-2xl items-center"
              >
                <Text className="text-foreground font-bold text-base">Register Cooperative</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Features Section */}
          <View className="flex-1 mt-6">
            <Text className="text-foreground font-bold text-xl mb-6 tracking-tight">Why Choose CoopApp?</Text>

            <View className="space-y-4">
              <View className="bg-surface border border-border p-5 rounded-3xl flex-row items-center">
                <View className="w-12 h-12 bg-blue-500/20 rounded-2xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#60a5fa" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base mb-1">Digital Identity</Text>
                  <Text className="text-foreground/40 text-xs leading-relaxed">Secure, paperless profiles and automated KYC verification.</Text>
                </View>
              </View>

              <View className="bg-surface border border-border p-5 rounded-3xl flex-row items-center">
                <View className="w-12 h-12 bg-emerald-500/20 rounded-2xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="book-open-outline" size={24} color="#34d399" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base mb-1">Automated Ledger</Text>
                  <Text className="text-foreground/40 text-xs leading-relaxed">Eliminate manual bookkeeping with real-time digital tracking.</Text>
                </View>
              </View>

              <View className="bg-surface border border-border p-5 rounded-3xl flex-row items-center">
                <View className="w-12 h-12 bg-amber-500/20 rounded-2xl items-center justify-center mr-4">
                  <MaterialCommunityIcons name="handshake-outline" size={24} color="#fbbf24" />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-base mb-1">Paperless Lending</Text>
                  <Text className="text-foreground/40 text-xs leading-relaxed">Accelerate approvals with document-free loan applications.</Text>
                </View>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
