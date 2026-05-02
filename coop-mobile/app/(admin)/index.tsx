import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Image, Modal, ActivityIndicator, Linking } from 'react-native';
import * as ExpoLinking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../hooks/useUser';
import { useAuth } from '../../context/AuthContext';
import { useAdminData } from '../../hooks/useAdminData';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatCurrency } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/api';

export default function AdminDashboard() {
  const { user } = useUser();
  const { logout, isMainAdmin } = useAuth();
  const { stats, isLoading, refetch } = useAdminData();
  const { primaryColor, colorScheme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();

  React.useEffect(() => {
    if (params.payment === 'success') {
      Alert.alert('Payment Successful', 'Your cooperative subscription has been updated.');
      refetch();
      router.setParams({ payment: undefined });
    } else if (params.payment === 'failed' || params.payment === 'error') {
      Alert.alert('Payment Failed', 'There was an issue processing your payment. Please try again.');
      refetch();
      router.setParams({ payment: undefined });
    }
  }, [params.payment]);
  
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [showPinModal, setShowPinModal] = React.useState(false);
  const [pin, setPin] = React.useState('');
  const [pinError, setPinError] = React.useState('');
  const [verifyingPin, setVerifyingPin] = React.useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);

  const handlePayBills = async () => {
    try {
      setIsProcessingPayment(true);
      
      // Create a deep link to return to the mobile app's admin dashboard
      // Note: We wrap this in a backend proxy because Monnify requires a valid http/https URL
      const appLink = ExpoLinking.createURL('(admin)', {
        queryParams: { payment: 'success' }
      });
      const redirectUrl = `${api.defaults.baseURL}/billing/redirect?target=${encodeURIComponent(appLink)}`;

      const res = await api.post('/billing/initialize', { redirectUrl });
      if (res.data.checkoutUrl) {
        Linking.openURL(res.data.checkoutUrl);
      } else {
        Alert.alert('Error', 'Could not initialize payment. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment initialization failed:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start payment process.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of the admin console?",
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

  const onRefresh = React.useCallback(() => {
    refetch();
  }, []);

  const handleVerifyPin = async () => {
    if (pin.length !== 4) return;
    setVerifyingPin(true);
    setPinError('');
    try {
      const res = await api.post('/admin/verify-pin', { pin });
      if (res.data.unlocked) {
        setIsUnlocked(true);
        setShowPinModal(false);
        setPin('');
      } else {
        setPinError('Invalid PIN');
      }
    } catch (err: any) {
      setPinError(err.response?.data?.message || 'Failed to verify PIN');
    } finally {
      setVerifyingPin(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Welcome Header */}
        <View className="mb-8 flex-row justify-between items-center">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity 
              onPress={() => router.push('/(admin)/profile')}
              className="w-14 h-14 bg-surface border-2 border-primary/20 rounded-2xl items-center justify-center overflow-hidden mr-4"
            >
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} className="w-full h-full" />
              ) : (
                <MaterialCommunityIcons name="account" size={30} color={colorScheme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'} />
              )}
            </TouchableOpacity>
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <View className="bg-primary/20 px-2 py-0.5 rounded-full border border-primary/30 mr-2">
                  <Text className="text-primary text-[8px] font-black uppercase tracking-widest">
                    {isMainAdmin ? 'Main Admin' : 'Admin'}
                  </Text>
                </View>
                <Text className="text-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Executive Panel
                </Text>
              </View>
              <Text className="text-3xl font-black text-foreground tracking-tighter" numberOfLines={1}>
                Welcome, {user?.firstName}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            onPress={() => router.push('/(member)')}
            className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl items-center justify-center ml-2"
          >
            <MaterialCommunityIcons name="account-convert" size={24} color={primaryColor} />
          </TouchableOpacity>
        </View>

        {/* Society Total Balance */}
        <Card className="mb-8 bg-primary/10 border-primary/20 p-6 overflow-hidden">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-foreground/50 text-[10px] font-black uppercase tracking-widest">Total Society Assets</Text>
            {isMainAdmin && isUnlocked && (
              <TouchableOpacity onPress={() => setIsUnlocked(false)}>
                <MaterialCommunityIcons name="lock-open-outline" size={16} color="rgba(var(--foreground), 0.5)" />
              </TouchableOpacity>
            )}
          </View>

          {!isMainAdmin ? (
            <View className="items-center justify-center py-4">
              <MaterialCommunityIcons name="lock" size={32} color="rgba(var(--foreground), 0.35)" />
              <Text className="text-foreground/40 text-[10px] font-black uppercase tracking-widest mt-2">Restricted Access</Text>
            </View>
          ) : !isUnlocked ? (
            <TouchableOpacity 
              onPress={() => setShowPinModal(true)}
              className="items-center justify-center py-4"
            >
              <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-2">
                <MaterialCommunityIcons name="lock" size={32} color={primaryColor} />
              </View>
              <Text className="text-primary text-[10px] font-black uppercase tracking-widest">Unlock Liquidity</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit 
                className="text-5xl font-black text-foreground tracking-tighter mb-4"
              >
                {formatCurrency(stats?.totalBalance || 0)}
              </Text>
              
              <View className="flex-row border-t border-border/50 pt-4">
                <View className="flex-1">
                  <Text className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Inbound</Text>
                  <Text className="text-emerald-500 font-bold text-lg">{formatCurrency(stats?.totalInbound || 0)}</Text>
                </View>
                <View className="w-[1px] bg-border/50 mx-4" />
                <View className="flex-1">
                  <Text className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest mb-1">Total Outbound</Text>
                  <Text className="text-rose-500 font-bold text-lg">{formatCurrency(stats?.totalOutbound || 0)}</Text>
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Subscription Tier Info (Main Admin Only) */}
        {isMainAdmin && stats?.billing && (
          <Card className="mb-8 border-emerald-500/20 bg-emerald-500/5 p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-emerald-500/60 text-[8px] font-black uppercase tracking-widest mb-1">Cooperation Tier</Text>
                <Text className="text-foreground font-black text-xl tracking-tighter uppercase">{stats.billing.tier}</Text>
              </View>
              <View className="bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                <Text className="text-emerald-500 text-[10px] font-black uppercase">{stats.billing.subscriptionStatus}</Text>
              </View>
            </View>
            <View className="flex-row justify-between items-center border-t border-border/50 pt-4">
              <View>
                <Text className="text-foreground/40 text-[9px] font-bold uppercase">Year-End Rebate</Text>
                <Text className="text-emerald-500 font-bold">{formatCurrency(stats.billing.rebateReserve)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-foreground/40 text-[9px] font-bold uppercase">Platform Dues</Text>
                <Text className="text-foreground font-bold">{formatCurrency(stats.billing.platformDues ?? stats.billing.platformBalance)}</Text>
              </View>
            </View>

            {/* Pay Bills Button - Visible for any paid tier during testing */}
            {stats.billing.tier !== 'free' && (
              <TouchableOpacity 
                onPress={handlePayBills}
                disabled={isProcessingPayment}
                className="mt-6 bg-emerald-500 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                {isProcessingPayment ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="credit-card-outline" size={20} color="white" className="mr-2" />
                    <Text className="text-white font-black uppercase tracking-widest ml-2">Pay Platform Dues</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </Card>
        )}

        {/* Actionable Metrics */}
        <Text className="text-foreground font-bold text-lg mb-4 tracking-tight">Pending Actions</Text>
        <View className="flex-row space-x-4 mb-8">
          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/(admin)/loans', params: { initialTab: 'pending' } })}
            className="flex-1 bg-surface border border-border p-5 rounded-3xl"
          >
            <View className="w-12 h-12 bg-amber-500/10 rounded-2xl items-center justify-center mb-3">
              <MaterialCommunityIcons name="hand-pointing-up" size={24} color="#f59e0b" />
            </View>
            <Text className="text-3xl font-black text-foreground">{stats?.pendingLoans || 0}</Text>
            <Text className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest">Loan Requests</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/(admin)/members', params: { initialTab: 'pending' } })}
            className="flex-1 bg-surface border border-border p-5 rounded-3xl"
          >
            <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center mb-3">
              <MaterialCommunityIcons name="account-plus-outline" size={24} color={primaryColor} />
            </View>
            <Text className="text-3xl font-black text-foreground">{stats?.pendingRegistrations || 0}</Text>
            <Text className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest">Registrations</Text>
          </TouchableOpacity>
        </View>

        {/* General Statistics */}
        <Text className="text-foreground font-bold text-lg mb-4 tracking-tight">System Status</Text>
        <View className="space-y-3 mb-8">
          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/(admin)/members', params: { initialTab: 'active' } })}
            className="bg-surface border border-border p-5 rounded-3xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-foreground/5 rounded-xl items-center justify-center mr-4">
                <MaterialCommunityIcons name="account-group-outline" size={20} color="rgba(var(--foreground), 0.65)" />
              </View>
              <Text className="text-foreground font-bold">Total Members</Text>
            </View>
            <Text className="text-foreground font-black text-lg">{stats?.totalMembers || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/(admin)/loans', params: { initialTab: 'active' } })}
            className="bg-surface border border-border p-5 rounded-3xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-foreground/5 rounded-xl items-center justify-center mr-4">
                <MaterialCommunityIcons name="hand-coin-outline" size={20} color="rgba(var(--foreground), 0.65)" />
              </View>
              <Text className="text-foreground font-bold">Active Loans</Text>
            </View>
            <Text className="text-foreground font-black text-lg">{stats?.activeLoans || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push({ pathname: '/(admin)/payments', params: { initialTab: 'pending' } })}
            className="bg-surface border border-border p-5 rounded-3xl flex-row items-center justify-between"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-rose-500/10 rounded-xl items-center justify-center mr-4 border border-rose-500/20">
                <MaterialCommunityIcons name="cash-sync" size={20} color="#f43f5e" />
              </View>
              <Text className="text-foreground font-bold">Pending Payments</Text>
            </View>
            <View className="flex-row items-center">
              {(stats?.pendingPayments ?? 0) > 0 && (
                <View className="bg-rose-500 w-2 h-2 rounded-full mr-3" />
              )}
              <Text className="text-foreground font-black text-lg">{stats?.pendingPayments || 0}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {!isMainAdmin && (
          <View className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex-row items-center mb-8">
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#f43f5e" />
            <Text className="text-rose-500 text-xs font-bold ml-3 flex-1">
              Restricted Access: Some administrative functions are only available to the Main Admin.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-500/10 border border-red-500/20 py-5 rounded-3xl items-center mb-6"
        >
          <Text className="text-red-500 font-bold text-lg">Sign Out Admin</Text>
        </TouchableOpacity>

        <Text className="text-foreground/30 text-center text-xs font-bold uppercase tracking-[0.3em]">
          Admin Console v1.0.0
        </Text>
      </ScrollView>

      {/* PIN Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-surface rounded-t-[3rem] p-10 border-t border-border">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <View className="items-center mb-8">
              <View className="w-20 h-20 bg-primary/10 rounded-[2rem] items-center justify-center mb-6 border border-primary/20">
                <MaterialCommunityIcons name="lock" size={40} color={primaryColor} />
              </View>
              <Text className="text-foreground font-black text-3xl tracking-tighter mb-2">Authorize Access</Text>
              <Text className="text-foreground/50 text-center font-medium">Enter your 4-digit security PIN to view sensitive totals.</Text>
            </View>

            <Input
              placeholder="0000"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={pin}
              onChangeText={setPin}
              className="text-center text-4xl tracking-[1em] font-black"
              autoFocus
            />

            {pinError ? (
              <View className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl mb-6">
                <Text className="text-rose-500 text-center text-xs font-black uppercase tracking-widest">{pinError}</Text>
              </View>
            ) : null}

            <View className="flex-row space-x-4">
              <TouchableOpacity 
                onPress={() => setShowPinModal(false)}
                className="flex-1 py-5 rounded-3xl items-center border border-border"
              >
                <Text className="text-foreground font-bold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleVerifyPin}
                disabled={pin.length !== 4 || verifyingPin}
                className="flex-1 bg-primary py-5 rounded-3xl items-center disabled:opacity-50"
              >
                {verifyingPin ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-black uppercase tracking-widest">Unlock</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

