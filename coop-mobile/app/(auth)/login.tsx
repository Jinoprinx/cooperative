import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link, Redirect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const { tenant, tenantDetails, clearTenant } = useTenant();
  const router = useRouter();

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
            <MaterialCommunityIcons name="chevron-left" size={24} color="#3b82f6" />
            <Text className="text-primary font-bold ml-1">Change Cooperative</Text>
          </TouchableOpacity>

          <View className="mb-12">
            <Text className="text-white/30 text-xs font-bold uppercase tracking-[0.3em] mb-4">
              {tenant?.name || 'Cooperative'}
            </Text>
            <Text className="text-5xl font-bold text-white tracking-tighter mb-4">
              Welcome{"\n"}Back
            </Text>
            <Text className="text-white/50 text-lg font-medium leading-relaxed">
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
            
            {error && (
              <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-2">
                <Text className="text-red-500 text-sm font-medium text-center">{error}</Text>
              </View>
            )}
          </View>

          <Button 
            title="Sign In" 
            onPress={handleLogin} 
            isLoading={isLoading}
            className="mb-8"
          />

          <View className="flex-row justify-center items-center mt-auto pb-4">
            <Text className="text-white/40 font-medium">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold shadow-sm shadow-primary/20 text-glow">Join now</Text>
              </TouchableOpacity>
            </Link>
          </View>

          <Link href="/" asChild>
             <TouchableOpacity className="pb-12 pt-4 flex-row justify-center items-center">
               <Text className="text-white/40 font-bold uppercase tracking-widest text-xs">Skip to Homepage</Text>
               <MaterialCommunityIcons name="arrow-right" size={14} color="rgba(255,255,255,0.4)" style={{ marginLeft: 4 }} />
             </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
