import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const DEFAULT_PRIMARY = '#3b82f6';

const COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Violet', value: '#8b5cf6' },
];

export default function AdminSettings() {
  const { isMainAdmin, user, refreshUser } = useAuth();
  const { tenantDetails, refreshTenantDetails } = useTenant();
  const { colorScheme, toggleColorScheme, primaryColor: currentPrimary } = useTheme();
  const queryClient = useQueryClient();

  const [deductAtSource, setDeductAtSource] = useState(false);
  const [selectedColor, setSelectedColor] = useState(DEFAULT_PRIMARY);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    if (tenantDetails) {
      setDeductAtSource(!!tenantDetails.settings?.loanRules?.deductInterestAtSource);
      setSelectedColor(tenantDetails.branding?.primaryColor || DEFAULT_PRIMARY);
    }
  }, [tenantDetails]);

  const updateTenantMutation = useMutation({
    mutationFn: async (payload: { settings?: any; branding?: any }) => {
      return api.patch('/tenants', payload);
    },
    onSuccess: () => {
      refreshTenantDetails();
      Alert.alert('Success', 'Cooperative settings updated');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update settings');
    }
  });

  const handleToggleInterest = (value: boolean) => {
    setDeductAtSource(value);
    updateTenantMutation.mutate({
      settings: {
        loanRules: {
          ...tenantDetails?.settings?.loanRules,
          deductInterestAtSource: value
        }
      }
    });
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    updateTenantMutation.mutate({
      branding: {
        primaryColor: color
      }
    });
  };
  const updatePinMutation = useMutation({
    mutationFn: async (newPin: string) => {
      return api.post('/admin/setup-pin', { pin: newPin });
    },
    onSuccess: () => {
      refreshUser();
      setPin('');
      setConfirmPin('');
      Alert.alert('Success', 'Security PIN updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update PIN');
    }
  });

  const handleUpdatePin = () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }
    updatePinMutation.mutate(pin);
  };

  if (!isMainAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center p-10">
        <MaterialCommunityIcons name="shield-lock" size={80} color={colorScheme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'} />
        <Text className="text-foreground font-black text-2xl mt-6 text-center">Restricted Area</Text>
        <Text className="text-foreground/50 text-center mt-2 font-medium">Only the Main Admin can modify cooperative-wide settings.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <View className="mb-8">
          <Text className="text-foreground font-black text-3xl tracking-tighter">Settings</Text>
          <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest">Cooperative Configuration</Text>
        </View>

        {/* Appearance */}
        <Card title="Appearance" className="mb-8">
          <View className="flex-row justify-between items-center py-2 mb-6">
            <View className="flex-1 mr-4">
              <Text className="text-foreground font-bold text-base">Dark Mode</Text>
              <Text className="text-foreground/50 text-xs mt-1">
                Toggle between light and dark themes.
              </Text>
            </View>
            <Switch 
              value={colorScheme === 'dark'} 
              onValueChange={toggleColorScheme}
              trackColor={{ false: '#d1d5db', true: currentPrimary }}
              thumbColor="#fff"
            />
          </View>

          <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest mb-4">Brand Color</Text>
          <View className="flex-row flex-wrap gap-4">
            {COLORS.map((c) => (
              <TouchableOpacity 
                key={c.value}
                onPress={() => handleColorSelect(c.value)}
                style={{ backgroundColor: c.value }}
                className={`w-12 h-12 rounded-2xl items-center justify-center ${selectedColor === c.value ? 'border-4 border-foreground/40 shadow-lg' : ''}`}
              >
                {selectedColor === c.value && (
                  <MaterialCommunityIcons name="check" size={24} color="white" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Loan Rules */}
        <Card title="Loan Configuration" className="mb-8">
          <View className="flex-row justify-between items-center py-2">
            <View className="flex-1 mr-4">
              <Text className="text-foreground font-bold text-base">Deduct Interest At Source</Text>
              <Text className="text-foreground/50 text-xs mt-1">
                If enabled, total interest is deducted immediately upon disbursement.
              </Text>
            </View>
            <Switch 
              value={deductAtSource} 
              onValueChange={handleToggleInterest}
              trackColor={{ false: '#d1d5db', true: currentPrimary }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {/* Security PIN */}
        <Card title="Security PIN" className="mb-8">
          <Text className="text-foreground/50 text-xs mb-6">
            The security PIN is required to unlock financial totals on the dashboard.
          </Text>
          
          <View className="flex-row space-x-4">
            <Input 
              label="New 4-Digit PIN"
              placeholder="0000"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              containerStyle="flex-1"
              value={pin}
              onChangeText={setPin}
            />
            <Input 
              label="Confirm PIN"
              placeholder="0000"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              containerStyle="flex-1"
              value={confirmPin}
              onChangeText={setConfirmPin}
            />
          </View>
          
          <Button 
            title={user?.hasPin ? "Update Security PIN" : "Setup Security PIN"}
            onPress={handleUpdatePin}
            isLoading={updatePinMutation.isPending}
            className="mt-2"
          />
        </Card>

        {/* System Info */}
        <View className="bg-surface border border-border p-6 rounded-3xl mb-8">
          <View className="flex-row items-center mb-4">
            <MaterialCommunityIcons name="information-outline" size={20} color={currentPrimary} />
            <Text className="text-foreground font-bold ml-3">Technical Details</Text>
          </View>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-foreground/45 text-xs">Subdomain</Text>
              <Text className="text-foreground text-xs font-bold">{tenantDetails?.subdomain}.coopapp.com</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-foreground/45 text-xs">Organization ID</Text>
              <Text className="text-foreground text-xs font-bold">{tenantDetails?._id}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-foreground/45 text-xs">Version</Text>
              <Text className="text-foreground text-xs font-bold">1.2.5-premium</Text>
            </View>
          </View>
        </View>

        <Text className="text-foreground/30 text-center text-[10px] font-black uppercase tracking-[0.4em]">
          End-to-End Encrypted Configuration
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
