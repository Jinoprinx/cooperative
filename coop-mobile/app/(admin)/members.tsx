import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { User } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

type Tab = 'active' | 'pending';

export default function Members() {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [initialDeposit, setInitialDeposit] = useState('0');
  const [initialLoan, setInitialLoan] = useState('0');
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  const { initialTab } = useLocalSearchParams<{ initialTab: Tab }>();

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const queryClient = useQueryClient();

  const { data: membersData, isLoading: isMembersLoading, refetch: refetchMembers } = useQuery({
    queryKey: ['admin-members', search],
    queryFn: async () => {
      const res = await api.get('/admin/members', { params: { search, limit: 100 } });
      return res.data.members as User[];
    },
    enabled: activeTab === 'active',
  });

  const { data: pendingData, isLoading: isPendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending-registrations'],
    queryFn: async () => {
      const res = await api.get('/admin/registrations/pending');
      return res.data as User[];
    },
    enabled: activeTab === 'pending',
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, initialDepositAmount, initialLoanBalance }: { userId: string, initialDepositAmount: number, initialLoanBalance: number }) => {
      return api.put(`/admin/registrations/${userId}/approve`, { initialDepositAmount, initialLoanBalance });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsApprovalModalVisible(false);
      setSelectedUser(null);
      setInitialDeposit('0');
      setInitialLoan('0');
      Alert.alert('Success', 'Member approved successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to approve member');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      return api.put(`/admin/registrations/${userId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      Alert.alert('Success', 'Registration rejected');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject registration');
    }
  });

  const onRefresh = () => {
    if (activeTab === 'active') refetchMembers();
    else refetchPending();
  };

  const handleApprovePress = (user: User) => {
    setSelectedUser(user);
    setIsApprovalModalVisible(true);
  };

  const confirmApproval = () => {
    if (!selectedUser) return;
    approveMutation.mutate({
      userId: selectedUser._id,
      initialDepositAmount: parseFloat(initialDeposit) || 0,
      initialLoanBalance: parseFloat(initialLoan) || 0,
    });
  };

  const handleRejectPress = (user: User) => {
    Alert.alert(
      'Reject Registration',
      `Are you sure you want to reject ${user.firstName} ${user.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reject', style: 'destructive', onPress: () => rejectMutation.mutate(user._id) }
      ]
    );
  };

  const isLoading = isMembersLoading || isPendingLoading;
  const currentData = activeTab === 'active' ? membersData : pendingData;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row bg-surface p-1 rounded-2xl mb-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'active' ? 'bg-primary' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'active' ? 'text-white' : 'text-white/40'}`}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('pending')}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'pending' ? 'bg-primary' : ''}`}
          >
            <View className="flex-row items-center">
              <Text className={`font-bold ${activeTab === 'pending' ? 'text-white' : 'text-white/40'}`}>Pending</Text>
              {pendingData && pendingData.length > 0 && (
                <View className="ml-2 bg-rose-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-[10px] font-black">{pendingData.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {activeTab === 'active' && (
          <Input 
            placeholder="Search members..."
            value={search}
            onChangeText={setSearch}
            className="mb-0"
            autoCapitalize="none"
          />
        )}
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#3b82f6" />}
      >
        {currentData?.map((user) => (
          <View key={user._id} className="bg-surface border border-border rounded-3xl p-5 mb-4">
            <View className="flex-row items-center mb-4">
              <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center mr-4 border border-primary/20">
                {user.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} className="w-full h-full rounded-2xl" />
                ) : (
                  <MaterialCommunityIcons name="account" size={32} color="#3b82f6" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-lg">{user.firstName} {user.lastName}</Text>
                <Text className="text-white/40 text-xs">{user.email}</Text>
              </View>
              {activeTab === 'active' && (
                <View className="bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <Text className="text-emerald-500 text-[10px] font-black uppercase">Active</Text>
                </View>
              )}
            </View>

            {activeTab === 'active' ? (
              <View className="flex-row justify-between items-end border-t border-white/5 pt-4">
                <View>
                  <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Balance</Text>
                  <Text className="text-white font-black text-xl">{formatCurrency(user.accountBalance)}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedUser(user);
                    setIsDetailModalVisible(true);
                  }}
                  className="bg-white/5 p-3 rounded-xl"
                >
                  <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row space-x-3 border-t border-white/5 pt-4">
                <TouchableOpacity 
                  onPress={() => handleApprovePress(user)}
                  className="flex-1 bg-primary/10 border border-primary/20 py-3 rounded-xl items-center"
                >
                  <Text className="text-primary font-bold">Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleRejectPress(user)}
                  className="flex-1 bg-rose-500/10 border border-rose-500/20 py-3 rounded-xl items-center"
                >
                  <Text className="text-rose-500 font-bold">Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {currentData?.length === 0 && (
          <View className="py-20 items-center">
            <MaterialCommunityIcons name="account-search-outline" size={64} color="rgba(255,255,255,0.1)" />
            <Text className="text-white/30 mt-4 font-medium">No members found</Text>
          </View>
        )}
      </ScrollView>

      {/* Member Detail Modal */}
      <Modal
        visible={isDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-white/10 max-h-[85%]">
            <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-8" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="items-center mb-8">
                <View className="w-24 h-24 bg-primary/10 rounded-[2rem] items-center justify-center mb-4 border border-primary/20">
                  {selectedUser?.profileImageUrl ? (
                    <Image source={{ uri: selectedUser.profileImageUrl }} className="w-full h-full rounded-[2rem]" />
                  ) : (
                    <MaterialCommunityIcons name="account" size={56} color="#3b82f6" />
                  )}
                </View>
                <Text className="text-white font-black text-3xl">{selectedUser?.firstName} {selectedUser?.lastName}</Text>
                <Text className="text-white/40 font-bold uppercase tracking-widest text-[10px] mt-1">ID: {selectedUser?.accountNumber || 'PENDING'}</Text>
              </View>

              <View className="bg-white/5 rounded-[2rem] p-6 mb-6">
                <View className="flex-row justify-between mb-6">
                  <View>
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Savings Balance</Text>
                    <Text className="text-white font-black text-2xl">{formatCurrency(selectedUser?.accountBalance || 0)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Join Date</Text>
                    <Text className="text-white font-bold">{selectedUser?.joinDate ? formatDate(selectedUser.joinDate) : 'N/A'}</Text>
                  </View>
                </View>

                <View className="h-[1px] bg-white/5 mb-6" />

                <View className="space-y-4">
                  <View>
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Email Address</Text>
                    <Text className="text-white font-medium">{selectedUser?.email}</Text>
                  </View>
                  <View>
                    <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Phone Number</Text>
                    <Text className="text-white font-medium">{selectedUser?.phoneNumber}</Text>
                  </View>
                </View>
              </View>

              <View className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl mb-8 flex-row items-center">
                <MaterialCommunityIcons name="shield-account" size={24} color="#f59e0b" />
                <View className="ml-4">
                  <Text className="text-amber-500 font-bold">Membership Status</Text>
                  <Text className="text-amber-500/60 text-xs">This user is an active participant.</Text>
                </View>
              </View>

              <Button 
                title="Close Profile" 
                variant="outline"
                onPress={() => {
                  setIsDetailModalVisible(false);
                  setSelectedUser(null);
                }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Approval Modal */}
      <Modal
        visible={isApprovalModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsApprovalModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-white/10">
            <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-8" />
            
            <Text className="text-white font-black text-2xl mb-2">Approve Registration</Text>
            <Text className="text-white/40 mb-8 font-medium">
              Set initial balances for {selectedUser?.firstName}. These fields are usually for migration purposes.
            </Text>

            <Input 
              label="Initial Savings Balance (₦)"
              keyboardType="numeric"
              value={initialDeposit}
              onChangeText={setInitialDeposit}
            />

            <Input 
              label="Initial Loan Balance (₦)"
              keyboardType="numeric"
              value={initialLoan}
              onChangeText={setInitialLoan}
            />

            <View className="flex-row space-x-4 mt-4">
              <Button 
                title="Cancel" 
                variant="outline"
                className="flex-1"
                onPress={() => setIsApprovalModalVisible(false)}
              />
              <Button 
                title="Approve" 
                className="flex-1"
                isLoading={approveMutation.isPending}
                onPress={confirmApproval}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
