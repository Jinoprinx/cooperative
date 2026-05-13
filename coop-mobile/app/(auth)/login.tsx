import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import api from '../../lib/api';

WebBrowser.maybeCompleteAuthSession();

import { useTheme } from '../../context/ThemeContext';

export default function Login() {
  const { primaryColor } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, handleGoogleAuthSuccess } = useAuth();
  const { tenant, tenantDetails, clearTenant } = useTenant();
  const router = useRouter();

  const [showPicker, setShowPicker] = useState(false);
  const [availableTenants, setAvailableTenants] = useState<any[]>([]);
  const [googleIdToken, setGoogleIdToken] = useState('');

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleLoginResponse(id_token);
    }
  }, [response]);

  const handleGoogleLoginResponse = async (idToken: string) => {
    setGoogleIdToken(idToken);
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/google/login', { idToken });
      
      if (res.data.needsSelection) {
        setAvailableTenants(res.data.tenants);
        setShowPicker(true);
      } else {
        await handleGoogleAuthSuccess(res.data.token, res.data.refreshToken, res.data.user);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Google Sign In failed');
    } finally {
      setIsLoading(false);
    }
  };

  const selectTenant = async (selectedTenantId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/google/select-tenant', {
        idToken: googleIdToken,
        tenantId: selectedTenantId,
      });
      await handleGoogleAuthSuccess(res.data.token, res.data.refreshToken, res.data.user);
      setShowPicker(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tenant selection failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to tenant-select if no tenant is chosen
  // Uses declarative <Redirect> to avoid navigating before Root Layout mounts
  if (!tenant) {
    return <Redirect href="/tenant-select" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const tenantId = tenantDetails ? (tenantDetails as any).id || (tenantDetails as any)._id : undefined;
      await login(email, password, tenantId);
      // AuthContext handles the redirect
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
          <TouchableOpacity 
            onPress={() => {
              clearTenant();
              router.replace('/tenant-select');
            }}
            className="flex-row items-center mb-12 pt-2"
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={primaryColor} />
            <Text className="text-primary font-bold ml-1">Change Cooperative</Text>
          </TouchableOpacity>

          <View className="mb-12">
            <Text className="text-foreground/30 text-xs font-bold uppercase tracking-[0.3em] mb-4">
              {tenant?.name || 'Cooperative'}
            </Text>
            <Text className="text-5xl font-bold text-foreground tracking-tighter mb-4">
              Welcome{"\n"}Back
            </Text>
            <Text className="text-foreground/50 text-lg font-medium leading-relaxed">
              Login to access your cooperative account.
            </Text>
          </View>

          <View className="space-y-4 mb-8">
            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <Input
              label="Password"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity className="self-end pt-1">
                <Text className="text-primary font-bold text-xs">Forgot Password?</Text>
              </TouchableOpacity>
            </Link>
            
            {error && (
              <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-2">
                <Text className="text-red-500 text-sm font-medium text-center">{error}</Text>
              </View>
            )}
          </View>

          <Button 
            title="Sign In" 
            onPress={handleLogin} 
            isLoading={isLoading && !showPicker}
            className="mb-6"
          />

          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-border" />
            <Text className="mx-4 text-[10px] font-bold text-foreground/40 uppercase tracking-widest">OR</Text>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          <Button 
            title="Sign In with Google" 
            onPress={() => promptAsync()} 
            disabled={!request}
            className="mb-8 bg-surface border-border"
            textClassName="text-foreground"
          />

          <View className="flex-row justify-center items-center mt-auto pb-4">
            <Text className="text-foreground/40 font-medium">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold shadow-sm shadow-primary/20 text-glow">Join now</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Link href="/" asChild>
             <TouchableOpacity className="pb-12 pt-4 flex-row justify-center items-center">
               <Text className="text-foreground/40 font-bold uppercase tracking-widest text-xs">Skip to Homepage</Text>
               <MaterialCommunityIcons name="arrow-right" size={14} color="rgba(var(--foreground), 0.4)" style={{ marginLeft: 4 }} />
             </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>

      {showPicker && (
        <View className="absolute inset-0 bg-background/90 justify-center px-6 z-50">
          <View className="bg-surface border border-border p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <Text className="text-2xl font-bold text-foreground mb-2">Select Cooperative</Text>
            <Text className="text-sm text-foreground/60 mb-6">You are a member of multiple cooperatives. Please choose one to enter.</Text>
            
            <View className="space-y-3 mb-6">
              {availableTenants.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => selectTenant(t.id)}
                  disabled={isLoading}
                  className="w-full p-4 rounded-2xl border border-border bg-background flex-row items-center"
                >
                  <View className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-4">
                    <Text className="text-primary font-bold text-lg">{t.name[0]}</Text>
                  </View>
                  <View>
                    <Text className="text-sm font-bold text-foreground">{t.name}</Text>
                    <Text className="text-[10px] text-foreground/50 uppercase tracking-widest">{t.subdomain}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              onPress={() => setShowPicker(false)}
              className="py-4 border border-border rounded-2xl items-center"
            >
              <Text className="text-[11px] font-bold uppercase tracking-widest text-foreground/60">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
