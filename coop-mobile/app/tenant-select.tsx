import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Redirect } from 'expo-router';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Tenant } from '../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TenantSelect() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Tenant[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const { tenant, isLoading: isTenantLoading, setActiveTenant, searchTenants } = useTenant();
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  // Show loading indicator during state transitions
  if (isAuthLoading || isTenantLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // If already authenticated and has tenant, go to dashboard
  if (isAuthenticated && tenant && user) {
    const isAdmin = user.role === 'admin' || user.role === 'super-admin';
    return <Redirect href={isAdmin ? '/(admin)' : '/(member)'} />;
  }

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(false);
    setSearchError(null);
    try {
      const dbResults = await searchTenants(query);
      setResults(dbResults);
    } catch (err: any) {
      setResults([]);
      const msg = err?.message || '';
      if (msg.includes('Network error') || msg.includes('connect')) {
        setSearchError('Cannot connect to server. Please check your internet connection.');
      } else if (msg.includes('Server error')) {
        setSearchError('Server is temporarily unavailable. Please try again later.');
      } else {
        setSearchError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleSelect = async (tenant: Tenant) => {
    await setActiveTenant({ subdomain: tenant.subdomain, name: tenant.name });
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <TouchableOpacity 
          onPress={() => router.push('/')} 
          className="flex-row items-center mb-8 pt-2"
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#3b82f6" />
          <Text className="text-primary font-bold ml-1">Back to Home</Text>
        </TouchableOpacity>

        <View className="mb-12">
          <View className="w-16 h-16 bg-primary rounded-3xl items-center justify-center mb-6 shadow-xl shadow-primary/30">
            <MaterialCommunityIcons name="office-building" size={32} color="white" />
          </View>
          <Text className="text-4xl font-bold text-white tracking-tighter mb-4">
            Find your{"\n"}Cooperative
          </Text>
          <Text className="text-white/50 text-lg font-medium leading-relaxed">
            Enter your cooperative's unique name or ID to get started.
          </Text>
        </View>

        <Input
          label="Cooperative Name"
          placeholder="e.g. Ogba Citizens"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        <Button 
          title="Search" 
          onPress={handleSearch} 
          isLoading={isSearching}
          className="mb-8"
        />

        {results.length > 0 && (
          <View className="space-y-4">
            <Text className="text-white/30 text-xs font-bold uppercase tracking-widest mb-2">
              Search Results
            </Text>
            {results.map((tenant) => (
              <TouchableOpacity
                key={tenant.subdomain}
                onPress={() => handleSelect(tenant)}
                activeOpacity={0.7}
                className="bg-surface border border-border rounded-3xl p-6 flex-row items-center justify-between shadow-sm"
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center mr-4">
                    <Text className="text-primary font-black text-xl">
                      {tenant.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-white font-bold text-lg">{tenant.name}</Text>
                    <Text className="text-white/30 text-sm font-medium">
                      {tenant.subdomain}.cooperatives.io
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.2)" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {searchError && (
          <View className="items-center py-8">
            <MaterialCommunityIcons name="wifi-off" size={48} color="rgba(239,68,68,0.6)" />
            <Text className="text-red-400 text-base font-medium mt-4 text-center">
              {searchError}
            </Text>
          </View>
        )}

        {hasSearched && !searchError && results.length === 0 && (
          <View className="items-center py-8">
            <MaterialCommunityIcons name="magnify-close" size={48} color="rgba(255,255,255,0.15)" />
            <Text className="text-white/40 text-base font-medium mt-4">
              No cooperatives found for "{query}"
            </Text>
            <Text className="text-white/20 text-sm mt-1">
              Try a different name or check the spelling
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
