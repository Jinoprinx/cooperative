import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { User, Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useTheme } from '../../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

export default function MemberLedger() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const { primaryColor, colorScheme } = useTheme();
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRecordPaymentModalVisible, setIsRecordPaymentModalVisible] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    purpose: 'deposit' as 'deposit' | 'loan_repayment',
    description: '',
    receiptImage: null as string | null
  });

  const { data: member, isLoading: isMemberLoading } = useQuery({
    queryKey: ['member-detail', userId],
    queryFn: async () => {
      const res = await api.get(`/admin/members/${userId}`);
      return res.data.member as User;
    },
  });

  const { data: ledgerData, isLoading: isLedgerLoading, refetch } = useQuery({
    queryKey: ['member-ledger', userId, startDate, endDate],
    queryFn: async () => {
      const params: any = { limit: 100 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get(`/admin/members/${userId}/payment-ledger`, { params });
      return res.data.paymentRecords as Transaction[];
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: typeof paymentData) => {
      const formData = new FormData();
      formData.append('amount', data.amount);
      formData.append('purpose', data.purpose);
      formData.append('description', data.description);
      formData.append('targetUserId', userId || '');
      
      if (data.receiptImage) {
        const uri = data.receiptImage;
        const filename = uri.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpg`;
        
        // @ts-ignore
        formData.append('receipt', { uri, name: filename, type });
      }

      return api.post('/transactions/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member-ledger', userId] });
      queryClient.invalidateQueries({ queryKey: ['member-detail', userId] });
      setIsRecordPaymentModalVisible(false);
      setPaymentData({ amount: '', purpose: 'deposit', description: '', receiptImage: null });
      Alert.alert('Success', 'Payment record uploaded and pending approval.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record payment');
    }
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPaymentData({ ...paymentData, receiptImage: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera access is required.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setPaymentData({ ...paymentData, receiptImage: result.assets[0].uri });
    }
  };

  const isLoading = isMemberLoading || isLedgerLoading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
      {/* Header */}
      <View className="px-6 pt-4 pb-2 border-b border-border bg-surface">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="flex-row items-center mb-4"
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={primaryColor} />
          <Text className="text-primary font-bold ml-1">Back to Directory</Text>
        </TouchableOpacity>
        
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <Text className="text-foreground font-black text-2xl tracking-tighter" numberOfLines={1}>
              {member?.firstName} {member?.lastName}
            </Text>
            <Text className="text-foreground/40 text-[10px] font-black uppercase tracking-widest">
              ID: {member?.accountNumber} • {member?.isManual ? 'MANUAL MEMBER' : 'SELF-MANAGED'}
            </Text>
          </View>
          <View className="bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
            <Text className="text-emerald-500 font-black text-lg">{formatCurrency(member?.accountBalance || 0)}</Text>
            <Text className="text-emerald-500/60 text-[8px] font-black uppercase text-center">Savings</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => setIsRecordPaymentModalVisible(true)}
          className="bg-primary py-4 rounded-2xl flex-row items-center justify-center mb-2 shadow-lg shadow-primary/20"
        >
          <MaterialCommunityIcons name="cloud-upload-outline" size={20} color="white" />
          <Text className="text-white font-black uppercase tracking-widest ml-2">Upload Client Receipt</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={primaryColor} />}
      >
        <Text className="text-foreground font-bold text-lg mb-4 tracking-tight">Transaction History</Text>
        
        {ledgerData?.map((record) => (
          <View key={record._id} className="bg-surface border border-border rounded-3xl p-5 mb-4 group">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-foreground font-bold text-base">{formatDate(record.date)}</Text>
                <Text className="text-foreground/45 text-[10px] font-black uppercase tracking-widest">{record.type.replace('_', ' ')}</Text>
              </View>
              <View className="items-end">
                <Text className="text-emerald-500 font-black text-xl">{formatCurrency(record.amount)}</Text>
                <View className={`px-2 py-0.5 rounded-full mt-1 ${
                  record.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20' : 
                  record.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20' : 
                  'bg-rose-500/10 border-rose-500/20'
                }`}>
                  <Text className={`text-[8px] font-black uppercase ${
                    record.status === 'completed' ? 'text-emerald-500' : 
                    record.status === 'pending' ? 'text-amber-500' : 
                    'text-rose-500'
                  }`}>{record.status}</Text>
                </View>
              </View>
            </View>
            <Text className="text-foreground/50 text-xs italic mb-2">"{record.description || 'No description'}"</Text>
          </View>
        ))}

        {ledgerData?.length === 0 && !isLoading && (
          <View className="py-20 items-center">
            <MaterialCommunityIcons name="book-open-variant" size={64} color="rgba(var(--foreground), 0.15)" />
            <Text className="text-foreground/30 mt-4 font-black uppercase tracking-[0.3em]">No records found</Text>
          </View>
        )}
      </ScrollView>

      {/* Record Payment Modal */}
      <Modal
        visible={isRecordPaymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsRecordPaymentModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center mr-4 border border-primary/20">
                <MaterialCommunityIcons name="cash-plus" size={24} color={primaryColor} />
              </View>
              <View>
                <Text className="text-foreground font-black text-2xl">Record Payment</Text>
                <Text className="text-foreground/40 font-bold uppercase tracking-widest text-[8px]">For: {member?.firstName} {member?.lastName}</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[60%] mb-6">
              <View className="flex-row bg-foreground/5 p-1 rounded-2xl mb-6">
                <TouchableOpacity 
                  onPress={() => setPaymentData({ ...paymentData, purpose: 'deposit' })}
                  className={`flex-1 py-3 rounded-xl items-center ${paymentData.purpose === 'deposit' ? 'bg-primary' : ''}`}
                >
                  <Text className={`font-bold text-xs uppercase tracking-widest ${paymentData.purpose === 'deposit' ? 'text-white' : 'text-foreground/40'}`}>Savings</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setPaymentData({ ...paymentData, purpose: 'loan_repayment' })}
                  className={`flex-1 py-3 rounded-xl items-center ${paymentData.purpose === 'loan_repayment' ? 'bg-primary' : ''}`}
                >
                  <Text className={`font-bold text-xs uppercase tracking-widest ${paymentData.purpose === 'loan_repayment' ? 'text-white' : 'text-foreground/40'}`}>Loan Payback</Text>
                </TouchableOpacity>
              </View>

              <Input 
                label="Amount (₦)"
                placeholder="0.00"
                keyboardType="numeric"
                value={paymentData.amount}
                onChangeText={(val) => setPaymentData({ ...paymentData, amount: val })}
              />

              <Input 
                label="Description / Note"
                placeholder="e.g. Cash received in office"
                value={paymentData.description}
                onChangeText={(val) => setPaymentData({ ...paymentData, description: val })}
              />

              <Text className="text-foreground/60 text-xs font-black uppercase tracking-widest mb-3">Proof of Payment</Text>
              
              {paymentData.receiptImage ? (
                <View className="relative w-full h-48 rounded-3xl overflow-hidden mb-6 border border-border">
                  <Image source={{ uri: paymentData.receiptImage }} className="w-full h-full" />
                  <TouchableOpacity 
                    onPress={() => setPaymentData({ ...paymentData, receiptImage: null })}
                    className="absolute top-4 right-4 bg-black/60 w-10 h-10 rounded-full items-center justify-center"
                  >
                    <MaterialCommunityIcons name="close" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="flex-row space-x-4 mb-6">
                  <TouchableOpacity 
                    onPress={takePhoto}
                    className="flex-1 bg-foreground/5 border border-dashed border-border p-6 rounded-3xl items-center justify-center"
                  >
                    <MaterialCommunityIcons name="camera-outline" size={32} color="rgba(var(--foreground), 0.35)" />
                    <Text className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest mt-2">Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={pickImage}
                    className="flex-1 bg-foreground/5 border border-dashed border-border p-6 rounded-3xl items-center justify-center"
                  >
                    <MaterialCommunityIcons name="image-outline" size={32} color="rgba(var(--foreground), 0.35)" />
                    <Text className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest mt-2">Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View className="flex-row space-x-4">
              <Button 
                title="Cancel" 
                variant="outline"
                className="flex-1"
                onPress={() => setIsRecordPaymentModalVisible(false)}
              />
              <Button 
                title="Authorize" 
                className="flex-1"
                disabled={!paymentData.amount || !paymentData.receiptImage}
                isLoading={recordPaymentMutation.isPending}
                onPress={() => recordPaymentMutation.mutate(paymentData)}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
