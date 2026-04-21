import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Loan, User } from '../../types';
import { formatCurrency, formatDate, getLoanProgress } from '../../lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

type Tab = 'active' | 'pending';

interface ExtendedLoan extends Loan {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    accountNumber: string;
  };
  sureties: Array<{
    user: {
      _id: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
    };
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason?: string;
  }>;
}

export default function AdminLoans() {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [selectedLoan, setSelectedLoan] = useState<ExtendedLoan | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  const queryClient = useQueryClient();

  const { data: allLoans, isLoading: isLoansLoading, refetch: refetchLoans } = useQuery({
    queryKey: ['admin-loans'],
    queryFn: async () => {
      const res = await api.get('/loans');
      return res.data as ExtendedLoan[];
    },
    enabled: activeTab === 'active',
  });

  const { data: pendingLoans, isLoading: isPendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending-loans'],
    queryFn: async () => {
      const res = await api.get('/loans/pending');
      return res.data as ExtendedLoan[];
    },
    enabled: activeTab === 'pending',
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ loanId, status }: { loanId: string, status: 'approved' | 'rejected' }) => {
      return api.put(`/loans/${loanId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-loans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-loans'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsDetailsVisible(false);
      setSelectedLoan(null);
      Alert.alert('Success', 'Loan status updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update loan status');
    }
  });

  const onRefresh = () => {
    if (activeTab === 'active') refetchLoans();
    else refetchPending();
  };

  const handleLoanPress = (loan: ExtendedLoan) => {
    setSelectedLoan(loan);
    setIsDetailsVisible(true);
  };

  const isLoading = isLoansLoading || isPendingLoading;
  const currentData = activeTab === 'active' 
    ? allLoans?.filter(l => ['active', 'approved', 'completed'].includes(l.status)) 
    : pendingLoans;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'approved': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row bg-surface p-1 rounded-2xl mb-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'active' ? 'bg-primary' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'active' ? 'text-white' : 'text-white/40'}`}>Registry</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('pending')}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'pending' ? 'bg-primary' : ''}`}
          >
            <View className="flex-row items-center">
              <Text className={`font-bold ${activeTab === 'pending' ? 'text-white' : 'text-white/40'}`}>Requests</Text>
              {pendingLoans && pendingLoans.length > 0 && (
                <View className="ml-2 bg-amber-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] font-black">{pendingLoans.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {currentData?.map((loan) => (
          <TouchableOpacity 
            key={loan._id} 
            onPress={() => handleLoanPress(loan)}
            className="bg-surface border border-border rounded-3xl p-5 mb-4"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-white font-bold text-lg" numberOfLines={1}>
                  {loan.user?.firstName} {loan.user?.lastName}
                </Text>
                <Text className="text-white/30 text-xs font-medium">Applied: {formatDate(loan.createdAt)}</Text>
              </View>
              <View 
                className="px-3 py-1 rounded-full border"
                style={{ backgroundColor: `${getStatusColor(loan.status)}10`, borderColor: `${getStatusColor(loan.status)}20` }}
              >
                <Text 
                  className="text-[10px] font-black uppercase tracking-widest"
                  style={{ color: getStatusColor(loan.status) }}
                >
                  {loan.status}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-end">
              <View>
                <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">
                  {loan.status === 'pending' ? 'Requested Amount' : 'Remaining Balance'}
                </Text>
                <Text className="text-white font-black text-2xl">
                  {formatCurrency(loan.status === 'pending' ? loan.amount : loan.remainingAmount)}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Duration</Text>
                <Text className="text-white font-bold">{loan.durationMonths} Months</Text>
              </View>
            </View>

            {['active', 'approved'].includes(loan.status) && (
              <View className="mt-4 pt-4 border-t border-white/5">
                <View className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                  <View 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${getLoanProgress(loan.amountPaid, loan.totalRepayment)}%` }}
                  />
                </View>
                <Text className="text-white/20 text-[10px] font-bold text-right uppercase">
                  {Math.round(getLoanProgress(loan.amountPaid, loan.totalRepayment))}% Paid
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {currentData?.length === 0 && (
          <View className="py-20 items-center">
            <MaterialCommunityIcons name="bank-off-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text className="text-white/30 mt-4 font-medium">No loans found</Text>
          </View>
        )}
      </ScrollView>

      {/* Loan Details Modal */}
      <Modal
        visible={isDetailsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailsVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-white/10 max-h-[90%]">
            <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-8" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Loan Details</Text>
                  <Text className="text-white font-black text-2xl">{selectedLoan?.user?.firstName} {selectedLoan?.user?.lastName}</Text>
                </View>
                <View 
                  className="px-3 py-1 rounded-full border"
                  style={{ backgroundColor: `${getStatusColor(selectedLoan?.status || '')}10`, borderColor: `${getStatusColor(selectedLoan?.status || '')}20` }}
                >
                  <Text 
                    className="text-[10px] font-black uppercase tracking-widest"
                    style={{ color: getStatusColor(selectedLoan?.status || '') }}
                  >
                    {selectedLoan?.status}
                  </Text>
                </View>
              </View>

              <Card className="mb-6 bg-white/5 p-6 rounded-[2rem]">
                <View className="flex-row justify-between mb-4">
                  <View>
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Principal</Text>
                    <Text className="text-white font-bold text-lg">{formatCurrency(selectedLoan?.amount || 0)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Interest Rate</Text>
                    <Text className="text-white font-bold text-lg">{selectedLoan?.interestRate || 0}%</Text>
                  </View>
                </View>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Total Repayment</Text>
                    <Text className="text-white font-bold text-lg">{formatCurrency(selectedLoan?.totalRepayment || 0)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Monthly Pay</Text>
                    <Text className="text-white font-bold text-lg">{formatCurrency(selectedLoan?.monthlyPayment || 0)}</Text>
                  </View>
                </View>
              </Card>

              <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Loan Purpose</Text>
              <View className="bg-white/5 p-5 rounded-3xl mb-6">
                <Text className="text-white font-medium italic">"{selectedLoan?.purpose}"</Text>
              </View>

              <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Sureties Status</Text>
              <View className="space-y-3 mb-8">
                {selectedLoan?.sureties.map((surety, idx) => (
                  <View key={idx} className="bg-white/5 p-4 rounded-2xl flex-row items-center justify-between">
                    <View>
                      <Text className="text-white font-bold">{surety.user.firstName} {surety.user.lastName}</Text>
                      <Text className="text-white/30 text-[10px]">{surety.user.phoneNumber}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialCommunityIcons 
                        name={surety.status === 'approved' ? 'check-circle' : surety.status === 'rejected' ? 'close-circle' : 'clock-outline'} 
                        size={16} 
                        color={surety.status === 'approved' ? '#10b981' : surety.status === 'rejected' ? '#ef4444' : '#f59e0b'} 
                      />
                      <Text 
                        className="text-[10px] font-black uppercase ml-1.5"
                        style={{ color: surety.status === 'approved' ? '#10b981' : surety.status === 'rejected' ? '#ef4444' : '#f59e0b' }}
                      >
                        {surety.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {selectedLoan?.status === 'pending' && (
                <View className="flex-row space-x-4">
                  <Button 
                    title="Reject" 
                    variant="outline"
                    className="flex-1 border-rose-500/30"
                    onPress={() => updateStatusMutation.mutate({ loanId: selectedLoan._id, status: 'rejected' })}
                  />
                  <Button 
                    title="Approve Loan" 
                    className="flex-1"
                    isLoading={updateStatusMutation.isPending}
                    onPress={() => updateStatusMutation.mutate({ loanId: selectedLoan._id, status: 'approved' })}
                  />
                </View>
              )}

              <Button 
                title="Close" 
                variant="ghost"
                className="mt-4"
                onPress={() => setIsDetailsVisible(false)}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
