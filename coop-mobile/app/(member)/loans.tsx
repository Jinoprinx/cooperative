import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate, getLoanProgress } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SuretyEntry {
  phone: string;
  name: string;
  found: boolean;
  searching: boolean;
  error?: string;
}

import { useTheme } from '../../context/ThemeContext';

export default function Loans() {
  const { activeLoan, isLoading: isDashLoading, refetch } = useDashboardData();
  const { user: currentUser } = useAuth();
  const { primaryColor } = useTheme();
  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
// ... existing state ...
  const [amount, setAmount] = useState('');
  const [duration, setDuration] = useState('12');
  const [purpose, setPurpose] = useState('');
  const [sureties, setSureties] = useState<SuretyEntry[]>([
    { phone: '', name: '', found: false, searching: false }
  ]);

  const queryClient = useQueryClient();

  const { data: historyData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['loan-history'],
    queryFn: async () => {
      const res = await api.get('/loans/history');
      return res.data;
    },
    enabled: isHistoryModalVisible,
  });

  const applyMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/loans/apply', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-loans'] });
      setIsApplyModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Your loan application has been submitted and is pending surety approval.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit application');
    }
  });

  const resetForm = () => {
    setAmount('');
    setDuration('12');
    setPurpose('');
    setSureties([{ phone: '', name: '', found: false, searching: false }]);
  };

  const addSurety = () => {
    if (sureties.length < 5) {
      setSureties([...sureties, { phone: '', name: '', found: false, searching: false }]);
    }
  };

  const removeSurety = (index: number) => {
    if (sureties.length <= 1) return; // Keep at least one
    setSureties(sureties.filter((_, i) => i !== index));
  };

  const handleSuretyChange = async (index: number, phone: string) => {
    const newSureties = [...sureties];
    newSureties[index] = { phone, name: '', found: false, searching: false, error: undefined };
    setSureties(newSureties);

    // Auto-lookup when phone number reaches 11+ digits
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 11) {
      // Check if user entered their own phone number
      if (currentUser?.phoneNumber === phone || currentUser?.phoneNumber === `+234${cleanPhone}`) {
        newSureties[index].error = 'You cannot be your own surety.';
        setSureties([...newSureties]);
        return;
      }

      // Check for duplicate surety
      const isDuplicate = sureties.some((s, i) => i !== index && s.phone === phone);
      if (isDuplicate) {
        newSureties[index].error = 'This surety has already been added.';
        setSureties([...newSureties]);
        return;
      }

    // Search for the member
    setSureties(prev => {
      const updated = [...prev];
      if (updated[index]) {
        updated[index] = { ...updated[index], searching: true, error: undefined, found: false, name: '' };
      }
      return updated;
    });

    try {
      const response = await api.get(`/users/search?phone=${phone}`);
      const foundRole = response.data?.role;
      const foundName = response.data?.name;

      setSureties(prev => {
        const updated = [...prev];
        // Ensure we're still looking for the SAME phone number in this slot
        if (updated[index] && updated[index].phone === phone) {
          if (foundRole === 'admin' || foundRole === 'super-admin') {
            updated[index] = {
              ...updated[index],
              name: '',
              found: false,
              searching: false,
              error: 'Admins cannot be used as sureties.',
            };
          } else {
            updated[index] = {
              ...updated[index],
              name: foundName || 'Member Found',
              found: true,
              searching: false,
            };
          }
        }
        return updated;
      });
    } catch (err: any) {
      setSureties(prev => {
        const updated = [...prev];
        if (updated[index] && updated[index].phone === phone) {
          updated[index] = {
            ...updated[index],
            name: '',
            found: false,
            searching: false,
            error: 'Member not found with this number.',
          };
        }
        return updated;
      });
    }
    }
  };

  const handleApply = () => {
    if (!amount || !purpose) {
      Alert.alert('Required', 'Please fill in all fields.');
      return;
    }
    const allSuretiesValid = sureties.every(s => s.found && s.phone);
    if (!allSuretiesValid) {
      Alert.alert('Invalid Sureties', 'All sureties must be valid, verified cooperative members.');
      return;
    }
    applyMutation.mutate({
      amount: parseFloat(amount),
      durationMonths: parseInt(duration),
      purpose,
      sureties: sureties.map(s => s.phone),
    });
  };

  const isLoading = isDashLoading;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={primaryColor} />
        }
      >
        <View className="mb-8 flex-row justify-between items-end">
          <View>
            <Text className="text-foreground/40 text-[10px] font-black uppercase tracking-[0.3em] mb-1">
              Credit & Lending
            </Text>
            <Text className="text-4xl font-black text-foreground tracking-tighter">My Loans</Text>
          </View>
          <TouchableOpacity 
            onPress={() => setIsHistoryModalVisible(true)}
            className="bg-foreground/5 p-3 rounded-2xl border border-foreground/5"
          >
            <MaterialCommunityIcons name="history" size={24} color="rgba(var(--foreground), 0.6)" />
          </TouchableOpacity>
        </View>

        {activeLoan ? (
          <View className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 p-8">
              <View className="flex-row justify-between items-start mb-8">
                <View>
                  <Text className="text-foreground/30 text-[10px] font-black uppercase tracking-widest mb-2">Total Outstanding</Text>
                  <Text className="text-5xl font-black text-foreground tracking-tighter">{formatCurrency(activeLoan.remainingAmount)}</Text>
                </View>
                <View className="w-14 h-14 bg-primary/20 rounded-2xl items-center justify-center border border-primary/30">
                  <MaterialCommunityIcons name="bank" size={28} color={primaryColor} />
                </View>
              </View>

              <View className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden mb-4">
                <View 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${getLoanProgress(activeLoan.amountPaid, activeLoan.totalRepayment)}%` }}
                />
              </View>

              <View className="flex-row justify-between mb-8">
                <Text className="text-foreground/40 text-[10px] font-black uppercase">Progress</Text>
                <Text className="text-foreground/40 text-[10px] font-black uppercase">
                  {getLoanProgress(activeLoan.amountPaid, activeLoan.totalRepayment).toFixed(0)}%
                </Text>
              </View>

              <View className="space-y-4">
                <View className="flex-row justify-between items-center bg-foreground/5 p-5 rounded-3xl">
                  <View>
                    <Text className="text-foreground/20 text-[10px] font-black uppercase tracking-widest mb-1">Monthly Installment</Text>
                    <Text className="text-foreground font-bold text-lg">{formatCurrency(activeLoan.monthlyPayment)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground/20 text-[10px] font-black uppercase tracking-widest mb-1">Next Due Date</Text>
                    <Text className="text-primary font-black text-lg">{formatDate(activeLoan.nextPaymentDate)}</Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center bg-foreground/5 p-5 rounded-3xl">
                  <View>
                    <Text className="text-foreground/20 text-[10px] font-black uppercase tracking-widest mb-1">Principal Amount</Text>
                    <Text className="text-foreground/60 font-bold">{formatCurrency(activeLoan.amount)}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-foreground/20 text-[10px] font-black uppercase tracking-widest mb-1">Amount Paid</Text>
                    <Text className="text-emerald-500 font-bold">{formatCurrency(activeLoan.amountPaid)}</Text>
                  </View>
                </View>
              </View>
            </Card>

            <View className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl flex-row items-center">
              <MaterialCommunityIcons name="information-outline" size={24} color="#f59e0b" />
              <Text className="text-amber-500 text-xs font-bold ml-4 flex-1">
                You currently have an active loan. You can apply for a new one once this is fully repaid.
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <Card className="items-center py-16 mb-8 bg-surface border-border">
              <View className="w-24 h-24 bg-primary/10 rounded-[2.5rem] items-center justify-center mb-8 border border-primary/20">
                <MaterialCommunityIcons name="rocket-launch-outline" size={48} color={primaryColor} />
              </View>
              <Text className="text-3xl font-black text-foreground text-center mb-4 tracking-tight">Need a Boost?</Text>
              <Text className="text-foreground/40 text-center px-10 leading-relaxed mb-10 text-base">
                Get instant access to credit with transparent terms and no hidden fees.
              </Text>
              <Button 
                title="Start Application" 
                onPress={() => setIsApplyModalVisible(true)}
                className="w-full"
              />
            </Card>

            <Text className="text-foreground/30 text-[10px] font-black uppercase tracking-[0.3em] mb-6 ml-2">Why use Coop Loans?</Text>
            {[
              { icon: 'flash', title: 'Swift Disbursement', desc: 'Funds land in your account shortly after approval.' },
              { icon: 'shield-check', title: 'Fair Rates', desc: 'We offer the most competitive interest rates in the market.' },
              { icon: 'account-group', title: 'Community Built', desc: 'Our loans are powered by our collective strength.' },
            ].map((item, i) => (
              <View key={i} className="flex-row items-center bg-surface border border-border p-6 rounded-[2rem] mb-4">
                <View className="w-12 h-12 bg-foreground/5 rounded-2xl items-center justify-center mr-5">
                  <MaterialCommunityIcons name={item.icon as any} size={24} color={primaryColor} />
                </View>
                <View className="flex-1">
                  <Text className="text-foreground font-bold text-lg">{item.title}</Text>
                  <Text className="text-foreground/40 text-sm mt-0.5 leading-relaxed">{item.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Loan Application Modal */}
      <Modal
        visible={isApplyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsApplyModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border max-h-[90%]">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-foreground font-black text-3xl mb-2 tracking-tight">Apply for Loan</Text>
              <Text className="text-foreground/40 mb-8 font-medium">Please fill in the details below to submit your request.</Text>

              <Input 
                label="Amount (₦)"
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Input 
                label="Duration (Months)"
                placeholder="e.g. 12"
                keyboardType="numeric"
                value={duration}
                onChangeText={setDuration}
              />

              <Input 
                label="Purpose"
                placeholder="e.g. Business Expansion"
                value={purpose}
                onChangeText={setPurpose}
              />

              {/* Sureties Section */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-foreground/60 text-xs font-bold uppercase tracking-widest">Sureties (Phone Numbers)</Text>
                  {sureties.length < 5 && (
                    <TouchableOpacity onPress={addSurety} className="bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20">
                      <Text className="text-primary text-[10px] font-black uppercase">+ Add More</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
                {sureties.map((surety, idx) => (
                  <View key={idx} className="mb-4">
                    <View className="flex-row items-center">
                      <View className="flex-1">
                        <Input 
                          placeholder="Enter phone number"
                          keyboardType="phone-pad"
                          value={surety.phone}
                          onChangeText={(val) => handleSuretyChange(idx, val)}
                          containerClassName="mb-0"
                        />
                      </View>
                      {/* Remove button — always visible if more than 1 surety */}
                      {sureties.length > 1 && (
                        <TouchableOpacity 
                          onPress={() => removeSurety(idx)}
                          className="ml-3 w-12 h-12 bg-red-500/10 rounded-2xl items-center justify-center border border-red-500/20"
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Loading indicator */}
                    {surety.searching && (
                      <View className="flex-row items-center mt-2 ml-1">
                        <ActivityIndicator size="small" color={primaryColor} />
                        <Text className="text-foreground/40 text-xs ml-2 font-medium">Searching member...</Text>
                      </View>
                    )}

                    {/* Found member name */}
                    {surety.found && surety.name && (
                      <View className="flex-row items-center bg-emerald-500/10 border border-emerald-500/20 mt-2 px-4 py-2.5 rounded-2xl">
                        <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
                        <Text className="text-emerald-400 text-sm font-bold ml-2">{surety.name}</Text>
                      </View>
                    )}

                    {/* Error message */}
                    {surety.error && (
                      <View className="flex-row items-center bg-red-500/10 border border-red-500/20 mt-2 px-4 py-2.5 rounded-2xl">
                        <MaterialCommunityIcons name="close-circle" size={16} color="#ef4444" />
                        <Text className="text-red-400 text-xs font-bold ml-2 flex-1">{surety.error}</Text>
                      </View>
                    )}
                  </View>
                ))}
                <Text className="text-[10px] text-foreground/30 mt-1 italic">Note: Each surety will receive a request to approve your loan.</Text>
              </View>

              <View className="flex-row space-x-4 mt-4">
                <Button 
                  title="Cancel" 
                  variant="ghost"
                  className="flex-1"
                  onPress={() => setIsApplyModalVisible(false)}
                />
                <Button 
                  title="Submit Request" 
                  className="flex-1"
                  isLoading={applyMutation.isPending}
                  onPress={handleApply}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Loan History Modal */}
      <Modal
        visible={isHistoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsHistoryModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border h-[80%]">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-foreground font-black text-2xl tracking-tight">Loan History</Text>
              <TouchableOpacity onPress={() => setIsHistoryModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={primaryColor} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {historyData?.history?.map((item: any, idx: number) => (
                <View key={idx} className="bg-foreground/5 p-5 rounded-3xl mb-4 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <View>
                      <Text className="text-foreground font-bold text-lg">
                        {item.type ? item.description : `₦${item.amount.toLocaleString()} Loan`}
                      </Text>
                      <Text className="text-foreground/30 text-xs font-medium">{formatDate(item.date || item.createdAt)}</Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${item.status === 'completed' ? 'bg-emerald-500/10' : 'bg-primary/10'}`}>
                      <Text className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'completed' ? 'text-emerald-500' : 'text-primary'}`}>
                        {item.status || 'Transaction'}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-foreground font-black text-xl">
                    {item.type === 'loan_repayment' ? '-' : '+'} {formatCurrency(item.amount)}
                  </Text>
                </View>
              ))}

              {(!historyData?.history || historyData.history.length === 0) && (
                <View className="py-20 items-center">
                  <MaterialCommunityIcons name="history" size={48} color="rgba(var(--foreground), 0.1)" />
                  <Text className="text-foreground/30 mt-4 font-medium">No history recorded yet.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
