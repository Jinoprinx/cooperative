import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmail() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [timer, setTimer] = useState(60);
  
  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/register');
    }
  }, [email]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    // Only accept numbers
    if (text.length > 0 && isNaN(Number(text))) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.post('/auth/verify-email', {
        email,
        code: otp
      });

      setSuccess(response.data?.message || 'Verification successful!');
      
      // Navigate to login after a brief pause so they can see success
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed. The code may be invalid or expired.');
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;

    setIsResending(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await api.post('/auth/resend-code', { email });
      setSuccess(response.data?.message || 'A new verification code has been sent!');
      setTimer(60);
      // Clear code
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again later.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }} bounces={false}>
          
          <TouchableOpacity 
            onPress={() => router.replace('/(auth)/register')} 
            className="flex-row items-center mb-8 pt-2"
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color="#3b82f6" />
            <Text className="text-primary font-bold ml-1">Back to Registration</Text>
          </TouchableOpacity>

          <View className="mb-10 items-center">
            <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-6 border border-primary/30">
              <MaterialCommunityIcons name="email-check" size={32} color="#3b82f6" />
            </View>
            
            <Text className="text-4xl font-bold text-white tracking-tighter mb-4 text-center">
              Verify Email
            </Text>
            
            <Text className="text-white/50 text-base font-medium leading-relaxed text-center">
              We've sent a 6-digit verification code to
            </Text>
            <Text className="text-white font-bold text-base mt-1 text-center">
              {email}
            </Text>
          </View>

          <View className="flex-row justify-between mb-8 px-2">
            {code.map((digit, index) => (
              <TextInput
                key={`digit-${index}`}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                className="w-12 h-14 bg-surface border border-border rounded-xl text-center text-2xl font-black text-white"
                style={{ textAlign: 'center' }}
                selectTextOnFocus
              />
            ))}
          </View>

          {error && (
            <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6">
              <Text className="text-red-500 text-sm font-medium text-center">{error}</Text>
            </View>
          )}

          {success && (
            <View className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-6">
              <Text className="text-emerald-500 text-sm font-medium text-center">{success}</Text>
            </View>
          )}

          <Button 
            title="Verify Email" 
            onPress={handleVerify} 
            isLoading={isLoading}
            disabled={code.some(d => !d) || isLoading}
            className="mb-8"
          />

          <View className="items-center mt-auto pb-12">
            <Text className="text-white/40 font-medium mb-3">Didn't receive the code?</Text>
            
            <TouchableOpacity 
              onPress={handleResend}
              disabled={timer > 0 || isResending}
              className={`py-2 px-6 rounded-full border border-primary/20 ${timer > 0 ? 'bg-surface opacity-50' : 'bg-primary/10'}`}
            >
               <Text className={`font-bold ${timer > 0 ? 'text-white/50' : 'text-primary'}`}>
                 {isResending ? 'Resending...' : timer > 0 ? `Resend Code in ${timer}s` : 'Resend Code Now'}
               </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
