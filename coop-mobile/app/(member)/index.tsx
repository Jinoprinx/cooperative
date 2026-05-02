import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../hooks/useUser';
import { useDashboardData } from '../../hooks/useDashboardData';
import { formatCurrency, formatDate, getTransactionColor, getTransactionPrefix, getLoanProgress } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function Dashboard() {
  const { user, refetch: refetchUser } = useUser();
  const { transactions, activeLoan, isLoading, refetch: refetchDashboard } = useDashboardData();
  const { primaryColor } = useTheme();
  const [isPayModalVisible, setIsPayModalVisible] = useState(false);
  const [payType, setPayType] = useState<'deposit' | 'loan_repayment'>('deposit');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receipt, setReceipt] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const router = useRouter();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post('/transactions/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-history'] });
      setIsPayModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Receipt uploaded! Admin will verify and credit your account shortly.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to upload receipt');
    }
  });

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setReceipt(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0]);
    }
  };

  const handlePayment = () => {
    if (!amount || !receipt) {
      Alert.alert('Required', 'Please enter amount and upload a receipt.');
      return;
    }

    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('purpose', payType);
    formData.append('description', description);
    
    // Prepare image for upload
    const uriParts = receipt.uri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    formData.append('receipt', {
      uri: receipt.uri,
      name: `receipt.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    uploadMutation.mutate(formData);
  };

  const onRefresh = React.useCallback(async () => {
    await Promise.all([refetchUser(), refetchDashboard()]);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Welcome Header */}
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-foreground font-black text-3xl tracking-tighter">
              Welcome, {user?.firstName}
            </Text>
            <Text className="text-foreground/40 text-xs font-bold uppercase tracking-widest mt-1">
              Have a productive day!
            </Text>
          </View>
          <View className="flex-row items-center">
            {user?.role === 'admin' && (
              <TouchableOpacity 
                onPress={() => router.push('/(admin)')}
                className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl items-center justify-center mr-2"
              >
                <MaterialCommunityIcons name="shield-account-outline" size={24} color={primaryColor} />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => router.push('/(member)/profile')}
              className="w-14 h-14 bg-surface border-2 border-primary/20 rounded-2xl items-center justify-center overflow-hidden"
            >
              {user?.profileImage ? (
                <Image source={{ uri: user.profileImage }} className="w-full h-full" />
              ) : (
                <MaterialCommunityIcons name="account" size={30} color="rgba(var(--foreground), 0.35)" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Balance Header */}
        <View className="mb-8">
          <Text className="text-foreground/45 text-xs font-bold uppercase tracking-[0.3em] mb-2">
            Your Treasury
          </Text>
          <Text className="text-5xl font-black text-foreground tracking-tighter">
            {formatCurrency(user?.accountBalance || 0)}
          </Text>
          <View className="flex-row items-center mt-3">
            <View className="bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20 flex-row items-center">
              <MaterialCommunityIcons name="arrow-up" size={12} color="#10b981" />
              <Text className="text-secondary text-[10px] font-black ml-1">
                +12.5%
              </Text>
            </View>
            <Text className="text-foreground/45 text-[10px] font-black uppercase tracking-widest ml-3">
              Monthly Growth
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="flex-row justify-between mb-8">
          {[
            { icon: 'plus-circle', label: 'Deposit', color: primaryColor, onPress: () => { setPayType('deposit'); setIsPayModalVisible(true); } },
            { icon: 'hand-coin', label: 'Repay Loan', color: '#10b981', onPress: () => { setPayType('loan_repayment'); setIsPayModalVisible(true); } },
            { icon: 'history', label: 'Activity', color: '#6b7280', onPress: () => router.push('/(member)/transactions') },
            { icon: 'qrcode-scan', label: 'Scan Pay', color: '#f59e0b', onPress: () => router.push('/(member)/coming-soon') },
          ].map((action, i) => (
            <TouchableOpacity key={i} onPress={action.onPress} className="items-center">
              <View className="w-16 h-16 bg-surface border border-border rounded-3xl items-center justify-center mb-2 shadow-sm">
                <MaterialCommunityIcons name={action.icon as any} size={28} color={action.color} />
              </View>
              <Text className="text-foreground/60 text-[10px] font-bold uppercase tracking-widest">{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Active Loan Card */}
        {activeLoan && (
          <Card className="mb-8 bg-primary/5 border-primary/20">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-foreground/50 text-[10px] font-black uppercase tracking-widest mb-1">Active Loan</Text>
                <Text className="text-3xl font-black text-foreground">{formatCurrency(activeLoan.remainingAmount)}</Text>
              </View>
              <View className="w-12 h-12 bg-primary/20 rounded-2xl items-center justify-center border border-primary/30">
                <MaterialCommunityIcons name="bank" size={24} color={primaryColor} />
              </View>
            </View>
            
            <View className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden mb-3">
              <View 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${getLoanProgress(activeLoan.amountPaid, activeLoan.totalRepayment)}%` }}
              />
            </View>
            
            <View className="flex-row justify-between">
              <Text className="text-foreground/45 text-[10px] font-bold">
                {formatCurrency(activeLoan.amountPaid)} Paid
              </Text>
              <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest">
                Due: {formatDate(activeLoan.nextPaymentDate)}
              </Text>
            </View>
          </Card>
        )}

        {/* Recent Activity */}
        <View className="mb-6 flex-row justify-between items-end">
          <Text className="text-2xl font-black text-foreground tracking-tight">Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(member)/transactions')}>
            <Text className="text-primary font-bold text-xs">View All</Text>
          </TouchableOpacity>
        </View>

        <View className="space-y-4">
          {transactions.map((tx: any) => (
            <TouchableOpacity 
              key={tx._id}
              className="bg-surface border border-border rounded-3xl p-5 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-foreground/5 rounded-2xl items-center justify-center mr-4">
                  <MaterialCommunityIcons 
                    name={tx.type === 'deposit' ? 'arrow-down' : 'arrow-up'} 
                    size={20} 
                    color={getTransactionColor(tx.type)} 
                  />
                </View>
                <View>
                  <Text className="text-foreground font-bold text-base" numberOfLines={1}>{tx.description}</Text>
                  <Text className="text-foreground/45 text-xs font-medium">{formatDate(tx.date)}</Text>
                </View>
              </View>
              <View className="items-end">
                <Text 
                  className="font-black text-base"
                  style={{ color: getTransactionColor(tx.type) }}
                >
                  {getTransactionPrefix(tx.type)} {formatCurrency(tx.amount)}
                </Text>
                <Text 
                   className="text-[10px] font-bold uppercase tracking-widest"
                   style={{ color: tx.status === 'completed' ? '#10b981' : tx.status === 'rejected' ? '#ef4444' : '#f59e0b' }}
                >
                  {tx.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {transactions.length === 0 && (
            <View className="py-12 items-center">
              <MaterialCommunityIcons name="note-text-outline" size={48} color="rgba(var(--foreground), 0.35)" />
              <Text className="text-foreground/45 mt-4 font-medium">No recent transactions</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={isPayModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPayModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <Text className="text-foreground font-black text-2xl mb-2 capitalize">{payType.replace('_', ' ')}</Text>
            <Text className="text-foreground/50 mb-8 font-medium">Upload your proof of payment to credit your account.</Text>

            <Input 
              label="Amount Paid (₦)"
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Input 
              label="Description (Optional)"
              placeholder="e.g. Monthly Savings"
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity 
              onPress={pickImage}
              className="w-full h-40 bg-foreground/5 border-2 border-dashed border-foreground/10 rounded-3xl items-center justify-center mb-8 overflow-hidden"
            >
              {receipt ? (
                <Image source={{ uri: receipt.uri }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="items-center">
                  <MaterialCommunityIcons name="cloud-upload-outline" size={32} color="rgba(var(--foreground), 0.5)" />
                  <Text className="text-foreground/45 font-bold mt-2">Tap to Select Receipt</Text>
                </View>
              )}
            </TouchableOpacity>


            <View className="flex-row space-x-4">
              <Button 
                title="Cancel" 
                variant="ghost"
                className="flex-1"
                onPress={() => setIsPayModalVisible(false)}
              />
              <Button 
                title="Submit Proof" 
                className="flex-1"
                isLoading={uploadMutation.isPending}
                onPress={handlePayment}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
