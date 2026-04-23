import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import api from '../../lib/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const handleResetRequest = async () => {
    if (!email) {
      Alert.alert('Required', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send reset email');
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
            onPress={() => router.back()}
            className="flex-row items-center mb-12 pt-2"
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#3b82f6" />
            <Text className="text-primary font-bold ml-1">Back to Login</Text>
          </TouchableOpacity>

          {!isSubmitted ? (
            <>
              <View className="mb-12">
                <Text className="text-white/30 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                  Password Recovery
                </Text>
                <Text className="text-5xl font-bold text-white tracking-tighter mb-4">
                  Forgot{"\n"}Password?
                </Text>
                <Text className="text-white/50 text-lg font-medium leading-relaxed">
                  Enter your email address and we'll send you a link to reset your password.
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
              </View>

              <Button 
                title="Send Reset Link" 
                onPress={handleResetRequest} 
                isLoading={isLoading}
                className="mb-8"
              />
            </>
          ) : (
            <View className="flex-1 justify-center items-center py-12">
              <View className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] items-center justify-center mb-8 border border-emerald-500/20">
                <MaterialCommunityIcons name="email-check-outline" size={48} color="#10b981" />
              </View>
              <Text className="text-white font-black text-3xl mb-4 text-center">Check Your Email</Text>
              <Text className="text-white/40 text-center px-6 leading-relaxed mb-10 text-base font-medium">
                We've sent a password reset link to <Text className="text-primary font-bold">{email}</Text>. Please follow the instructions in the email.
              </Text>
              <Button 
                title="Back to Login" 
                variant="outline"
                onPress={() => router.replace('/(auth)/login')}
                className="w-full"
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
