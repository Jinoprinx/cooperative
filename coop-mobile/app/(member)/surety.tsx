import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

interface SuretyRequest {
  _id: string;
  amount: number;
  durationMonths: number;
  purpose: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

import { useTheme } from '../../context/ThemeContext';

export default function Surety() {
  const { suretyRequests, isLoading: isDashboardLoading, refetch: refetchDashboard } = useDashboardData();
  const { user: currentUser } = useAuth();
  
  const { data: suretyHistory, isLoading: isHistoryLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['surety-history'],
    queryFn: async () => {
      const res = await api.get('/loans/surety-history');
      return res.data;
    }
  });

  const isLoading = isDashboardLoading || isHistoryLoading;
  const refetch = () => {
    refetchDashboard();
    refetchHistory();
  };

  const { primaryColor } = useTheme();
  const [selectedRequest, setSelectedRequest] = useState<SuretyRequest | null>(null);
// ... logic ...
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const queryClient = useQueryClient();

  const responseMutation = useMutation({
    mutationFn: async ({ loanId, status, reason }: { loanId: string, status: 'approved' | 'rejected', reason?: string }) => {
      return api.put(`/loans/${loanId}/surety-response`, { status, rejectionReason: reason });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['surety-requests'] });
      setIsModalVisible(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setIsRejecting(false);
      Alert.alert('Success', `You have ${variables.status} the surety request.`);
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to respond to request');
    }
  });

  const handleAction = (request: SuretyRequest) => {
    setSelectedRequest(request);
    setIsModalVisible(true);
  };

  const onConfirm = (status: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    if (status === 'rejected' && !rejectionReason) {
      Alert.alert('Required', 'Please provide a reason for rejection.');
      return;
    }
    responseMutation.mutate({ 
      loanId: selectedRequest._id, 
      status, 
      reason: status === 'rejected' ? rejectionReason : undefined 
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right']}>
      <ScrollView 
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={primaryColor} />}
      >
        <View className="mb-8">
          <Text className="text-foreground/40 text-xs font-bold uppercase tracking-[0.3em] mb-2">
            Pending Requests
          </Text>
          <Text className="text-foreground text-base font-medium">
            You have {suretyRequests?.length || 0} active surety requests that require your attention.
          </Text>
        </View>

        {suretyRequests?.map((request: any) => (
          <TouchableOpacity 
            key={request._id} 
            onPress={() => handleAction(request)}
            className="bg-surface border border-border rounded-3xl p-6 mb-4"
          >
            <View className="flex-row justify-between items-start mb-4">
              <View className="flex-1">
                <Text className="text-foreground/40 text-[10px] font-black uppercase tracking-widest mb-1">Requester</Text>
                <Text className="text-foreground font-black text-xl">
                  {request.user?.firstName} {request.user?.lastName}
                </Text>
              </View>
              <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center border border-primary/20">
                <MaterialCommunityIcons name="shield-account" size={24} color={primaryColor} />
              </View>
            </View>

            <View className="flex-row justify-between items-end mb-4">
              <View>
                <Text className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest mb-1">Loan Amount</Text>
                <Text className="text-foreground font-bold text-lg">{formatCurrency(request.amount)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-foreground/30 text-[10px] font-bold uppercase tracking-widest mb-1">Duration</Text>
                <Text className="text-foreground font-bold">{request.durationMonths} Months</Text>
              </View>
            </View>

            <View className="pt-4 border-t border-border/50">
              <Text className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest mb-2">Purpose</Text>
              <Text className="text-foreground/60 text-sm italic" numberOfLines={2}>"{request.purpose}"</Text>
            </View>
          </TouchableOpacity>
        ))}

        {(!suretyRequests || suretyRequests.length === 0) && (
          <View className="py-20 items-center">
            <View className="w-20 h-20 bg-foreground/5 rounded-[2.5rem] items-center justify-center mb-6">
              <MaterialCommunityIcons name="shield-check-outline" size={40} color="rgba(var(--foreground), 0.1)" />
            </View>
            <Text className="text-foreground font-black text-xl mb-2">All Clear!</Text>
            <Text className="text-foreground/30 text-center px-10">You don't have any pending surety requests at the moment.</Text>
          </View>
        )}

        {/* Historical Archive */}
        <View className="mt-10 pt-8 border-t border-border/50">
          <View className="flex-row items-center mb-6">
            <MaterialCommunityIcons name="history" size={20} color={primaryColor} />
            <Text className="text-foreground font-black text-lg uppercase tracking-wider ml-2">
              Historical Archive
            </Text>
          </View>

          {suretyHistory && suretyHistory.length > 0 ? (
            suretyHistory.map((item: any) => {
              const isApplicant = item.user?._id === currentUser?._id || item.user === currentUser?._id;
              
              // Get status for this user if they are the surety
              const mySuretyObj = item.sureties?.find((s: any) => s.user?._id === currentUser?._id || s.user === currentUser?._id);
              const myStatus = mySuretyObj?.status || 'unknown';

              const approvedCount = item.sureties?.filter((s: any) => s.status === 'approved').length || 0;
              const totalCount = item.sureties?.length || 0;
              const hasRejected = item.sureties?.some((s: any) => s.status === 'rejected');

              const getStatusColor = (statusVal: string) => {
                if (statusVal === 'approved') return '#10b981';
                if (statusVal === 'rejected') return '#ef4444';
                return '#f59e0b';
              };

              return (
                <View key={item._id} className="bg-surface border border-border rounded-3xl p-5 mb-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row items-center">
                      <View className={`px-2 py-0.5 rounded border ${
                        isApplicant ? 'bg-blue-500/10 border-blue-500/20' : 'bg-purple-500/10 border-purple-500/20'
                      }`}>
                        <Text className={`text-[8px] font-black uppercase ${isApplicant ? 'text-blue-400' : 'text-purple-400'}`}>
                          {isApplicant ? 'Applicant' : 'Surety'}
                        </Text>
                      </View>
                      <Text className="text-foreground/40 text-[10px] font-bold ml-2">
                        {formatDate(item.createdAt)}
                      </Text>
                    </View>
                    <Text className="text-foreground font-black text-base">{formatCurrency(item.amount)}</Text>
                  </View>

                  <View className="mb-3">
                    {isApplicant ? (
                      <View>
                        <Text className="text-foreground/35 text-[9px] font-bold uppercase tracking-wider mb-0.5">Your Sureties</Text>
                        <Text className="text-foreground font-bold text-xs" numberOfLines={2}>
                          {item.sureties && item.sureties.length > 0
                            ? item.sureties.map((s: any) => {
                                const name = s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown member';
                                return `${name} (${s.status})`;
                              }).join(', ')
                            : 'No sureties assigned'}
                        </Text>
                      </View>
                    ) : (
                      <View>
                        <Text className="text-foreground/35 text-[9px] font-bold uppercase tracking-wider mb-0.5">Applicant</Text>
                        <Text className="text-foreground font-bold text-xs">
                          {item.user ? `${item.user.firstName} ${item.user.lastName}` : 'System Subject'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View className="flex-row justify-between items-center pt-3 border-t border-border/30">
                    <Text className="text-foreground/30 text-[8px] font-bold uppercase font-black">Verification Status</Text>
                    <View className="flex-row items-center font-bold">
                      {isApplicant ? (
                        <>
                          <MaterialCommunityIcons 
                            name={approvedCount === totalCount ? 'check-circle' : hasRejected ? 'close-circle' : 'clock-outline'} 
                            size={12} 
                            color={approvedCount === totalCount ? '#10b981' : hasRejected ? '#ef4444' : '#f59e0b'} 
                          />
                          <Text 
                            className="text-[9px] font-black uppercase ml-1"
                            style={{ color: approvedCount === totalCount ? '#10b981' : hasRejected ? '#ef4444' : '#f59e0b' }}
                          >
                            {approvedCount}/{totalCount} Approved
                          </Text>
                        </>
                      ) : (
                        <>
                          <MaterialCommunityIcons 
                            name={myStatus === 'approved' ? 'check-circle' : myStatus === 'rejected' ? 'close-circle' : 'clock-outline'} 
                            size={12} 
                            color={getStatusColor(myStatus)} 
                          />
                          <Text 
                            className="text-[9px] font-black uppercase ml-1"
                            style={{ color: getStatusColor(myStatus) }}
                          >
                            {myStatus}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="py-8 bg-surface-lighter rounded-3xl border border-dashed border-border items-center">
              <Text className="text-foreground/30 text-xs italic font-medium">No past endorsements in archive</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Surety Action Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-border">
            <View className="w-12 h-1.5 bg-foreground/10 rounded-full self-center mb-8" />
            
            <Text className="text-foreground font-black text-2xl mb-2">Surety Request</Text>
            <Text className="text-foreground/40 mb-8 font-medium">
              By approving, you agree to stand as a surety for {selectedRequest?.user?.firstName}'s loan of {formatCurrency(selectedRequest?.amount || 0)}.
            </Text>

            {isRejecting ? (
              <View className="mb-6">
                <Input 
                  label="Reason for Rejection"
                  placeholder="e.g. I cannot commit at this time"
                  value={rejectionReason}
                  onChangeText={setRejectionReason}
                  multiline
                  numberOfLines={3}
                  className="h-24 pt-4"
                />
                <View className="flex-row space-x-4">
                  <Button 
                    title="Back" 
                    variant="ghost"
                    className="flex-1"
                    onPress={() => setIsRejecting(false)}
                  />
                  <Button 
                    title="Confirm Reject" 
                    className="flex-1 bg-rose-500"
                    isLoading={responseMutation.isPending}
                    onPress={() => onConfirm('rejected')}
                  />
                </View>
              </View>
            ) : (
              <View className="flex-row space-x-4">
                <Button 
                  title="Reject" 
                  variant="outline"
                  className="flex-1 border-rose-500/30"
                  onPress={() => setIsRejecting(true)}
                />
                <Button 
                  title="Approve" 
                  className="flex-1"
                  isLoading={responseMutation.isPending}
                  onPress={() => onConfirm('approved')}
                />
              </View>
            )}

            {!isRejecting && (
              <Button 
                title="Maybe Later" 
                variant="ghost"
                className="mt-4"
                onPress={() => setIsModalVisible(false)}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
