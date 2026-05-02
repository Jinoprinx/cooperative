import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Image, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { formatCurrency, formatDate } from '../../lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

type Tab = 'active' | 'pending';

export default function Members() {
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [search, setSearch] = useState('');
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [isEnrollModalVisible, setIsEnrollModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [initialDeposit, setInitialDeposit] = useState('0');
  const [initialLoan, setInitialLoan] = useState('0');
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isRecordPaymentModalVisible, setIsRecordPaymentModalVisible] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    purpose: 'deposit' as 'deposit' | 'loan_repayment',
    description: '',
    receiptImage: null as string | null
  });
  const { primaryColor } = useTheme();
  
  const [newMember, setNewMember] = useState({ 
    firstName: '', 
    lastName: '', 
    phoneNumber: '', 
    email: '', 
    joinDate: new Date().toISOString().split('T')[0], 
    accountBalance: '0' 
  });

  const { initialTab } = useLocalSearchParams<{ initialTab: Tab }>();
  const router = useRouter();
  const { isMainAdmin } = useAuth();

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

  const enrollMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/admin/members', {
        ...data,
        accountBalance: parseFloat(data.accountBalance) || 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setIsEnrollModalVisible(false);
      setNewMember({ 
        firstName: '', 
        lastName: '', 
        phoneNumber: '', 
        email: '', 
        joinDate: new Date().toISOString().split('T')[0], 
        accountBalance: '0' 
      });
      Alert.alert('Success', 'Manual member enrolled successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to enroll member');
    }
  });

  const handleToggleAdmin = async (member: User) => {
    if (!isMainAdmin) return;
    try {
      const newRole = member.role === 'admin' ? 'member' : 'admin';
      await api.put(`/admin/members/${member._id}`, { isAdmin: newRole === 'admin' });
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      Alert.alert('Success', `Role updated to ${newRole}`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteMember = async (member: User) => {
    if (!isMainAdmin) return;
    Alert.alert(
      'Delete Member',
      `Are you sure you want to permanently remove ${member.firstName} ${member.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/admin/members/${member._id}`);
              queryClient.invalidateQueries({ queryKey: ['admin-members'] });
              Alert.alert('Success', 'Member removed');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to delete member');
            }
          } 
        }
      ]
    );
  };

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: typeof paymentData) => {
      const formData = new FormData();
      formData.append('amount', data.amount);
      formData.append('purpose', data.purpose);
      formData.append('description', data.description);
      formData.append('targetUserId', selectedUser?._id || '');
      
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
      queryClient.invalidateQueries({ queryKey: ['admin-members'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-payments'] });
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
      Alert.alert('Permission Denied', 'Camera access is required to take a photo of the receipt.');
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

  const onRefresh = () => {
    if (activeTab === 'active') refetchMembers();
    else refetchPending();
  };

  const isLoading = isMembersLoading || isPendingLoading;
  const currentData = activeTab === 'active' ? membersData : pendingData;

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
        { 
          text: 'Reject', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.put(`/admin/registrations/${user._id}/reject`);
              queryClient.invalidateQueries({ queryKey: ['admin-pending-registrations'] });
              queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
              Alert.alert('Success', 'Registration rejected');
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.message || 'Failed to reject registration');
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <View className="px-6 pt-4 pb-2">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-foreground font-black text-2xl tracking-tighter">Directory</Text>
            <Text className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest">Cooperative Registry</Text>
          </View>
          {isMainAdmin && activeTab === 'active' && (
            <TouchableOpacity 
              onPress={() => setIsEnrollModalVisible(true)}
              className="bg-primary/20 border border-primary/30 px-4 py-2 rounded-xl flex-row items-center"
            >
              <MaterialCommunityIcons name="account-plus" size={16} color={primaryColor} />
              <Text className="text-primary font-bold ml-2 text-xs uppercase tracking-widest">Enroll</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row bg-surface p-1 rounded-2xl mb-6">
          <TouchableOpacity 
            onPress={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'active' ? 'bg-primary' : ''}`}
          >
            <Text className={`font-bold ${activeTab === 'active' ? 'text-white' : 'text-foreground/40'}`}>Active</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('pending')}
            className={`flex-1 py-3 rounded-xl items-center ${activeTab === 'pending' ? 'bg-primary' : ''}`}
          >
            <View className="flex-row items-center">
              <Text className={`font-bold ${activeTab === 'pending' ? 'text-white' : 'text-foreground/40'}`}>Pending</Text>
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
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={primaryColor} />}
      >
        {currentData?.map((user) => (
          <View key={user._id} className="bg-surface border border-border rounded-3xl p-5 mb-4">
            <TouchableOpacity 
              onPress={() => router.push({ pathname: '/(admin)/member-ledger', params: { userId: user._id } })}
              className="flex-row items-center mb-4"
            >
              <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center mr-4 border border-primary/20">
                {user.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} className="w-full h-full rounded-2xl" />
                ) : (
                  <MaterialCommunityIcons name="account" size={32} color={primaryColor} />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-foreground font-bold text-lg">{user.firstName} {user.lastName}</Text>
                  {user.isManual && (
                    <View className="ml-2 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Text className="text-amber-500 text-[8px] font-black uppercase">Manual</Text>
                    </View>
                  )}
                </View>
                <Text className="text-foreground/40 text-xs">{user.email || user.phoneNumber}</Text>
              </View>
              {user.role === 'admin' && (
                <View className="bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                  <Text className="text-purple-400 text-[10px] font-black uppercase">Admin</Text>
                </View>
              )}
            </TouchableOpacity>

            {activeTab === 'active' ? (
              <View className="flex-row justify-between items-center border-t border-border/50 pt-4">
                <View>
                  <Text className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest mb-1">Balance</Text>
                  <Text className="text-foreground font-black text-xl">{formatCurrency(user.accountBalance)}</Text>
                </View>
                <View className="flex-row space-x-2">
                  {isMainAdmin && (
                    <>
                      <TouchableOpacity 
                        onPress={() => handleToggleAdmin(user)}
                        className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20"
                      >
                        <MaterialCommunityIcons name="shield-account-variant" size={20} color="#c084fc" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => handleDeleteMember(user)}
                        className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/20"
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#fb7185" />
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity 
                    onPress={() => {
                      setSelectedUser(user);
                      setIsDetailModalVisible(true);
                    }}
                    className="bg-foreground/5 p-3 rounded-xl border border-border"
                  >
                    <MaterialCommunityIcons name="chevron-right" size={20} color="rgba(var(--foreground), 0.6)" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="flex-row space-x-3 border-t border-border/50 pt-4">
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
            <MaterialCommunityIcons name="account-search-outline" size={64} color="rgba(var(--foreground), 0.35)" />
            <Text className="text-foreground/40 mt-4 font-medium">No members found</Text>
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
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border max-h-[85%]">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="items-center mb-8">
                <View className="w-24 h-24 bg-primary/10 rounded-[2rem] items-center justify-center mb-4 border border-primary/20">
                  {selectedUser?.profileImageUrl ? (
                    <Image source={{ uri: selectedUser.profileImageUrl }} className="w-full h-full rounded-[2rem]" />
                  ) : (
                    <MaterialCommunityIcons name="account" size={56} color={primaryColor} />
                  )}
                </View>
                <Text className="text-foreground font-black text-3xl">{selectedUser?.firstName} {selectedUser?.lastName}</Text>
                <Text className="text-foreground/50 font-bold uppercase tracking-widest text-[10px] mt-1">ID: {selectedUser?.accountNumber || 'PENDING'}</Text>
              </View>

              <View className="bg-foreground/5 rounded-[2rem] p-6 mb-6">
                <View className="flex-row justify-between mb-6">
                  <View>
                    <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest mb-1">Savings Balance</Text>
                    <Text className="text-foreground font-black text-2xl">{formatCurrency(selectedUser?.accountBalance || 0)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground/45 text-[10px] font-bold uppercase tracking-widest mb-1">Join Date</Text>
                    <Text className="text-foreground font-bold">{selectedUser?.joinDate ? formatDate(selectedUser.joinDate) : 'N/A'}</Text>
                  </View>
                </View>

                <View className="h-[1px] bg-border mb-6" />

                <View className="space-y-4">
                  <View>
                    <Text className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest mb-1">Email Address</Text>
                    <Text className="text-foreground font-medium">{selectedUser?.email || 'N/A'}</Text>
                  </View>
                  <View>
                    <Text className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest mb-1">Phone Number</Text>
                    <Text className="text-foreground font-medium">{selectedUser?.phoneNumber || 'N/A'}</Text>
                  </View>
                </View>
              </View>

              {selectedUser?.isManual && (
                <View className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl mb-8 flex-row items-center">
                  <MaterialCommunityIcons name="account-cog" size={24} color="#f59e0b" />
                  <View className="ml-4">
                    <Text className="text-amber-500 font-bold">Manual Account</Text>
                    <Text className="text-amber-500/60 text-xs">This account is managed by the administration.</Text>
                  </View>
                </View>
              )}

              <Button 
                title="Record Payment" 
                className="mb-3"
                onPress={() => {
                  setIsDetailModalVisible(false);
                  setIsRecordPaymentModalVisible(true);
                }}
              />

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

      {/* Enroll Manual Member Modal */}
      <Modal
        visible={isEnrollModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsEnrollModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/80">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <Text className="text-foreground font-black text-2xl mb-2">Enroll Member</Text>
            <Text className="text-foreground/40 mb-8 font-medium">Create a manual record for a member without digital access.</Text>

            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[60%] mb-6">
              <View className="flex-row space-x-4">
                <Input 
                  label="First Name"
                  containerStyle="flex-1"
                  value={newMember.firstName}
                  onChangeText={(val) => setNewMember({...newMember, firstName: val})}
                />
                <Input 
                  label="Last Name"
                  containerStyle="flex-1"
                  value={newMember.lastName}
                  onChangeText={(val) => setNewMember({...newMember, lastName: val})}
                />
              </View>
              <Input 
                label="Phone Number"
                keyboardType="phone-pad"
                value={newMember.phoneNumber}
                onChangeText={(val) => setNewMember({...newMember, phoneNumber: val})}
              />
              <Input 
                label="Email (Optional)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={newMember.email}
                onChangeText={(val) => setNewMember({...newMember, email: val})}
              />
              <View className="flex-row space-x-4">
                <Input 
                  label="Join Date (YYYY-MM-DD)"
                  containerStyle="flex-1"
                  value={newMember.joinDate}
                  onChangeText={(val) => setNewMember({...newMember, joinDate: val})}
                />
                <Input 
                  label="Opening Balance (₦)"
                  containerStyle="flex-1"
                  keyboardType="numeric"
                  value={newMember.accountBalance}
                  onChangeText={(val) => setNewMember({...newMember, accountBalance: val})}
                />
              </View>
            </ScrollView>

            <View className="flex-row space-x-4">
              <Button 
                title="Cancel" 
                variant="outline"
                className="flex-1"
                onPress={() => setIsEnrollModalVisible(false)}
              />
              <Button 
                title="Enroll Member" 
                className="flex-1"
                isLoading={enrollMutation.isPending}
                onPress={() => enrollMutation.mutate(newMember)}
              />
            </View>
          </View>
        </View>
      </Modal>

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
                <Text className="text-foreground/40 font-bold uppercase tracking-widest text-[8px]">Member: {selectedUser?.firstName} {selectedUser?.lastName}</Text>
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
                title="Record & Upload" 
                className="flex-1"
                disabled={!paymentData.amount || !paymentData.receiptImage}
                isLoading={recordPaymentMutation.isPending}
                onPress={() => recordPaymentMutation.mutate(paymentData)}
              />
            </View>
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
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <Text className="text-foreground font-black text-2xl mb-2">Approve Registration</Text>
            <Text className="text-foreground/40 mb-8 font-medium">
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
