import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import api from '../../lib/api';
import { useTenant } from '../../context/TenantContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    countryCode: '+234',
    coopName: '',
    subdomain: '',
    superAdminKey: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { tenant, tenantDetails } = useTenant();
  const router = useRouter();

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword, phone, coopName, subdomain, superAdminKey } = formData;
    
    // Base validation for both modes
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all required personal fields');
      return;
    }

    if (!phone || phone.trim().length < 7) {
      setError('A valid phone number is required');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Cooperative specific validation
    if (!tenant) {
      if (!coopName || !subdomain) {
        setError('Cooperative Name and Subdomain are required to create a new society.');
        return;
      }
      
      const subdomainRegex = /^[a-z0-9-]+$/;
      if (!subdomainRegex.test(subdomain)) {
        setError('Subdomain can only contain lowercase letters, numbers, and hyphens');
        return;
      }
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Differentiate endpoint and payload based on whether we are joining or creating
      const endpoint = tenant ? '/auth/register/member' : '/auth/register';
      const payload = {
        firstName,
        lastName,
        email,
        password,
        phoneNumber: `${formData.countryCode}${phone}`,
        // Include tenantId if joining an existing one
        ...(tenant && tenantDetails && { tenantId: (tenantDetails as any).id || (tenantDetails as any)._id }),
        // Include coop specific fields if registering a new one
        ...(!tenant && { coopName, subdomain, superAdminKey })
      };

      await api.post(endpoint, payload);
      
      router.replace({
        pathname: '/(auth)/verify-email',
        params: { email }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} bounces={false}>
          {/* Top Navigation Row */}
          {tenant ? (
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity className="flex-row items-center mb-8 pt-2">
                <MaterialCommunityIcons name="chevron-left" size={24} color="#3b82f6" />
                <Text className="text-primary font-bold ml-1">Back to Login</Text>
              </TouchableOpacity>
            </Link>
          ) : (
            <TouchableOpacity 
              onPress={() => router.push('/')} 
              className="flex-row items-center mb-8 pt-2"
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color="#3b82f6" />
              <Text className="text-primary font-bold ml-1">Back to Home</Text>
            </TouchableOpacity>
          )}

          <View className="mb-8">
            {tenant ? (
              <Text className="text-white/30 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                Join {tenant.name}
              </Text>
            ) : (
              <Text className="text-primary text-xs font-bold uppercase tracking-[0.3em] mb-4 text-glow">
                New Cooperative
              </Text>
            )}
            <Text className="text-4xl font-bold text-white tracking-tighter mb-4">
              {tenant ? 'Member Registration' : 'Register Society'}
            </Text>
            <Text className="text-white/50 text-sm font-medium leading-relaxed">
              {tenant 
                ? 'Create your account to start saving and borrowing with your cooperative.' 
                : 'Fill in these details to register your cooperative and become the super admin.'}
            </Text>
          </View>

          {/* Conditional Cooperative Details Section */}
          {!tenant && (
            <View className="bg-surface border border-border p-5 rounded-3xl mb-8 space-y-4">
              <View className="flex-row items-center mb-2">
                <MaterialCommunityIcons name="domain" size={20} color="#3b82f6" />
                <Text className="text-white font-bold ml-2">Cooperative Details</Text>
              </View>
              
              <Input
                label="Cooperative Name"
                placeholder="e.g. Coop Alpha"
                value={formData.coopName}
                onChangeText={(v) => updateForm('coopName', v)}
              />

              <Input
                label="Desired Subdomain"
                placeholder="coopa"
                value={formData.subdomain}
                onChangeText={(v) => updateForm('subdomain', v.toLowerCase())}
                autoCapitalize="none"
              />
              <Text className="text-[10px] text-white/40 ml-1 -mt-2">
                Your portal will be: {formData.subdomain || 'subdomain'}.coopapp.com
              </Text>

              <Input
                label="Super Admin Key (Optional)"
                placeholder="Enter key if applicable"
                value={formData.superAdminKey}
                onChangeText={(v) => updateForm('superAdminKey', v)}
                secureTextEntry
              />
            </View>
          )}

          {/* Personal Details Section */}
          <View className="space-y-4 mb-8">
            {!tenant && (
               <View className="flex-row items-center mb-2 pt-2">
                 <MaterialCommunityIcons name="account" size={20} color="#3b82f6" />
                 <Text className="text-white font-bold ml-2">Admin Details</Text>
               </View>
            )}
            
            <View className="flex-row space-x-4">
              <Input
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChangeText={(v) => updateForm('firstName', v)}
                containerClassName="flex-1"
              />
              <View className="w-4" />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChangeText={(v) => updateForm('lastName', v)}
                containerClassName="flex-1"
              />
            </View>

            <Input
              label="Email Address"
              placeholder="name@example.com"
              value={formData.email}
              onChangeText={(v) => updateForm('email', v)}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <View className="mb-4">
              <Text className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2 px-1">
                Phone Number
              </Text>
              <View className="flex-row">
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      "Select Country Code",
                      "Choose your country code",
                      [
                        { text: "🇳🇬 Nigeria (+234)", onPress: () => updateForm('countryCode', '+234') },
                        { text: "🇺🇸 USA (+1)", onPress: () => updateForm('countryCode', '+1') },
                        { text: "🇬🇧 UK (+44)", onPress: () => updateForm('countryCode', '+44') },
                        { text: "🇬🇭 Ghana (+233)", onPress: () => updateForm('countryCode', '+233') },
                        { text: "🇰🇪 Kenya (+254)", onPress: () => updateForm('countryCode', '+254') },
                        { text: "🇿🇦 South Africa (+27)", onPress: () => updateForm('countryCode', '+27') },
                        { text: "Cancel", style: "cancel" }
                      ]
                    );
                  }}
                  className="bg-surface border border-border rounded-2xl px-4 h-14 justify-center items-center mr-3 min-w-[80px]"
                >
                  <Text className="text-white text-base font-bold">{formData.countryCode}</Text>
                </TouchableOpacity>
                <Input
                  placeholder="803 123 4567"
                  value={formData.phone}
                  onChangeText={(v) => updateForm('phone', v)}
                  keyboardType="phone-pad"
                  containerClassName="flex-1 mb-0"
                />
              </View>
            </View>
            
            <Input
              label="Password"
              placeholder="••••••••"
              value={formData.password}
              onChangeText={(v) => updateForm('password', v)}
              secureTextEntry
            />

            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChangeText={(v) => updateForm('confirmPassword', v)}
              secureTextEntry
            />
            
            {error && (
              <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-2">
                <Text className="text-red-500 text-sm font-medium text-center">{error}</Text>
              </View>
            )}
          </View>

          <Button 
            title={tenant ? "Create Member Account" : "Register Cooperative"} 
            onPress={handleRegister} 
            isLoading={isLoading}
            className="mb-12"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
