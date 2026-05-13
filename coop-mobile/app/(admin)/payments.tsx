import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Alert, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';

type Tab = 'pending' | 'history';

interface ExtendedTransaction extends Transaction {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    accountNumber: string;
  };
  receiptUrl?: string;
  rejectionReason?: string;
  isProxyPayment?: boolean;
  initiatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  approvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminPayments() {
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [selectedTx, setSelectedTx] = useState<ExtendedTransaction | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { primaryColor } = useTheme();
  const { isMainAdmin } = useAuth();

  const { initialTab } = useLocalSearchParams<{ initialTab: Tab }>();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const queryClient = useQueryClient();

  const { data: pendingPayments, isLoading: isPendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending-payments'],
    queryFn: async () => {
      const res = await api.get('/admin/pending-payments');
      return res.data.pendingPayments as ExtendedTransaction[];
    },
    enabled: activeTab === 'pending',
  });

  const { data: allTransactions, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['admin-all-transactions'],
    queryFn: async () => {
      const res = await api.get('/transactions');
      return res.data as ExtendedTransaction[];
    },
    enabled: activeTab === 'history',
  });

  const approveMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      return api.post(`/transactions/approve/${transactionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsModalVisible(false);
      setSelectedTx(null);
      Alert.alert('Success', 'Payment approved and balance updated');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to approve payment');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: string, reason: string }) => {
      return api.post(`/transactions/reject/${transactionId}`, { rejectionReason: reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-all-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsRejectModalVisible(false);
      setIsModalVisible(false);
      setSelectedTx(null);
      setRejectionReason('');
      Alert.alert('Success', 'Payment rejected');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject payment');
    }
  });

  const onRefresh = () => {
    if (activeTab === 'pending') refetchPending();
    else refetchHistory();
  };

  const handleTxPress = (tx: ExtendedTransaction) => {
    setSelectedTx(tx);
    setIsModalVisible(true);
  };

  const handleRejectPress = () => {
    setIsRejectModalVisible(true);
  };

  const submitRejection = () => {
    if (!selectedTx) return;
    if (!rejectionReason.trim()) {
      Alert.alert('Required', 'Please provide a reason for rejection');
      return;
    }
    rejectMutation.mutate({ 
      transactionId: selectedTx._id, 
      reason: rejectionReason 
    });
  };

  const isLoading = isPendingLoading || isHistoryLoading;
  const currentData = activeTab === 'pending' ? pendingPayments : allTransactions;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row bg-surface p-1 rounded-2xl mb-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('pending')}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'pending' ? 'bg-primary' : ''}`}
          >
            <View className="flex-row items-center">
              <Text className={`font-bold ${activeTab === 'pending' ? 'text-white' : 'text-foreground/40'}`}>Pending</Text>
              {pendingPayments && pendingPayments.length > 0 && (
                <View className="ml-2 bg-rose-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] font-black">{pendingPayments.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'history' ? 'bg-primary' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'history' ? 'text-white' : 'text-foreground/40'}`}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={primaryColor} />}
      >
        {currentData?.map((tx) => (
          <TouchableOpacity 
            key={tx._id} 
            onPress={() => handleTxPress(tx)}
            className="bg-surface border border-border rounded-3xl p-5 mb-4"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-foreground font-bold text-lg" numberOfLines={1}>
                  {tx.user?.firstName} {tx.user?.lastName}
                </Text>
                <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest">{tx.type.replace('_', ' ')}</Text>
              </View>
              <View className="items-end">
                <Text className="text-foreground/45 text-[10px] font-medium">{formatDate(tx.date)}</Text>
                {activeTab === 'history' && (
                  <Text 
                    className="text-[10px] font-black uppercase mt-1"
                    style={{ color: tx.status === 'completed' ? '#10b981' : tx.status === 'rejected' ? '#ef4444' : '#f59e0b' }}
                  >
                    {tx.status}
                  </Text>
                )}
              </View>
            </View>

            <View className="flex-row justify-between items-center">
              <Text className="text-foreground font-black text-2xl">{formatCurrency(tx.amount)}</Text>
              <View className="flex-row items-center">
                {tx.receiptUrl && (
                  <View className="bg-primary/10 px-3 py-1.5 rounded-xl flex-row items-center mr-2">
                    <MaterialCommunityIcons name="file-image-outline" size={14} color={primaryColor} />
                    <Text className="text-primary text-[10px] font-bold ml-1.5">Receipt</Text>
                  </View>
                )}
                {tx.isProxyPayment && (
                  <View className="bg-amber-500/10 px-3 py-1.5 rounded-xl flex-row items-center">
                    <MaterialCommunityIcons name="account-arrow-right" size={14} color="#f59e0b" />
                    <Text className="text-amber-500 text-[10px] font-bold ml-1.5">Proxy</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Audit: Initiated By (main admin only) */}
            {isMainAdmin && tx.initiatedBy && (
              <View className="mt-3 bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-xl flex-row items-center">
                <MaterialCommunityIcons name="account-edit" size={12} color="#a855f7" />
                <Text className="text-purple-400 text-[10px] font-bold ml-1.5">Initiated by: {tx.initiatedBy.firstName} {tx.initiatedBy.lastName}</Text>
              </View>
            )}
            {isMainAdmin && tx.approvedBy && tx.status !== 'pending' && (
              <View className="mt-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex-row items-center">
                <MaterialCommunityIcons name="check-decagram" size={12} color="#10b981" />
                <Text className="text-emerald-500 text-[10px] font-bold ml-1.5">{tx.status === 'rejected' ? 'Rejected' : 'Approved'} by: {tx.approvedBy.firstName} {tx.approvedBy.lastName}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {currentData?.length === 0 && (
          <View className="py-20 items-center">
            <MaterialCommunityIcons name="cash-off" size={64} color="rgba(var(--foreground), 0.35)" />
            <Text className="text-foreground/45 mt-4 font-medium">No payments found</Text>
          </View>
        )}
      </ScrollView>

      {/* Payment Details Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border max-h-[90%]">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-foreground/50 text-[10px] font-black uppercase tracking-widest mb-1">Transaction Proof</Text>
              <Text className="text-foreground font-black text-2xl mb-6">Payment Verification</Text>

              <Card className="mb-6 bg-foreground/5 p-6 rounded-[2rem]">
                <View className="mb-4">
                  <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest mb-1">Member</Text>
                  <Text className="text-foreground font-bold text-lg">{selectedTx?.user?.firstName} {selectedTx?.user?.lastName}</Text>
                  <Text className="text-foreground/50 text-xs">{selectedTx?.user?.email}</Text>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest mb-1">Amount</Text>
                    <Text className="text-foreground font-black text-2xl">{formatCurrency(selectedTx?.amount || 0)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest mb-1">Type</Text>
                    <Text className="text-foreground font-bold text-lg uppercase">{selectedTx?.type.replace('_', ' ')}</Text>
                  </View>
                </View>
              </Card>

              {selectedTx?.receiptUrl ? (
                <View className="mb-8">
                  <Text className="text-foreground/40 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Receipt Attachment</Text>
                  <TouchableOpacity 
                    onPress={() => Linking.openURL(selectedTx.receiptUrl!)}
                    className="w-full h-64 bg-black/40 rounded-[2rem] overflow-hidden border border-border items-center justify-center"
                  >
                    <Image 
                      source={{ uri: selectedTx.receiptUrl }} 
                      className="w-full h-full opacity-60"
                      resizeMode="cover"
                    />
                    <View className="absolute bg-black/60 px-4 py-2 rounded-full flex-row items-center">
                      <MaterialCommunityIcons name="fullscreen" size={20} color="white" />
                      <Text className="text-white font-bold ml-2">View Full Receipt</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="mb-8 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex-row items-center">
                   <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#f43f5e" />
                   <Text className="text-rose-500 font-bold ml-3">No receipt image provided for this transaction.</Text>
                </View>
              )}

              {selectedTx?.status === 'pending' && (
                <>
                  {/* Proxy payment: only main admin can approve/reject */}
                  {selectedTx?.isProxyPayment && !isMainAdmin ? (
                    <View className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex-row items-center">
                      <MaterialCommunityIcons name="lock-outline" size={24} color="#f59e0b" />
                      <View className="ml-4 flex-1">
                        <Text className="text-amber-500 font-bold">Requires Main Admin</Text>
                        <Text className="text-amber-500/60 text-xs">Only the main admin can approve or reject payments made on behalf of manual members.</Text>
                      </View>
                    </View>
                  ) : (
                    <View className="flex-row space-x-4">
                      <Button 
                        title="Reject" 
                        variant="outline"
                        className="flex-1 border-rose-500/30"
                        onPress={handleRejectPress}
                      />
                      <Button 
                        title="Approve & Credit" 
                        className="flex-1"
                        isLoading={approveMutation.isPending}
                        onPress={() => approveMutation.mutate(selectedTx!._id)}
                      />
                    </View>
                  )}
                </>
              )}

              {/* Audit info in modal (main admin only) */}
              {isMainAdmin && selectedTx?.initiatedBy && (
                <View className="mt-6 bg-purple-500/10 border border-purple-500/20 p-4 rounded-3xl flex-row items-center">
                  <MaterialCommunityIcons name="account-edit" size={20} color="#a855f7" />
                  <View className="ml-3">
                    <Text className="text-purple-400 text-[10px] font-bold uppercase tracking-widest">Initiated By</Text>
                    <Text className="text-purple-300 font-bold">{selectedTx.initiatedBy.firstName} {selectedTx.initiatedBy.lastName}</Text>
                  </View>
                </View>
              )}
              {isMainAdmin && selectedTx?.approvedBy && selectedTx?.status !== 'pending' && (
                <View className="mt-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex-row items-center">
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#10b981" />
                  <View className="ml-3">
                    <Text className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest">{selectedTx.status === 'rejected' ? 'Rejected By' : 'Approved By'}</Text>
                    <Text className="text-emerald-400 font-bold">{selectedTx.approvedBy.firstName} {selectedTx.approvedBy.lastName}</Text>
                  </View>
                </View>
              )}

              <Button 
                title="Close" 
                variant="ghost"
                className="mt-4"
                onPress={() => setIsModalVisible(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        visible={isRejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRejectModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/80 px-6">
          <View className="bg-surface w-full p-8 rounded-[3rem] border border-border">
            <View className="w-16 h-16 bg-rose-500/10 rounded-2xl items-center justify-center mb-6 self-center">
              <MaterialCommunityIcons name="alert-circle-outline" size={32} color="#f43f5e" />
            </View>
            
            <Text className="text-foreground font-black text-2xl mb-2 text-center">Reject Payment</Text>
            <Text className="text-foreground/40 mb-8 text-center">Enter the reason why this payment proof is being rejected.</Text>

            <Input 
              label="Rejection Reason"
              placeholder="e.g. Image not clear, wrong amount, etc."
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={3}
              className="bg-foreground/5 border-border text-foreground"
            />

            <View className="flex-row space-x-4 mt-8">
              <Button 
                title="Cancel" 
                variant="ghost"
                className="flex-1"
                onPress={() => setIsRejectModalVisible(false)}
              />
              <Button 
                title="Confirm Reject" 
                className="flex-1 bg-rose-600"
                isLoading={rejectMutation.isPending}
                onPress={submitRejection}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
