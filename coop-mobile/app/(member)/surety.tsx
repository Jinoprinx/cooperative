import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useDashboardData } from '../../hooks/useDashboardData';
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

export default function Surety() {
  const { suretyRequests, isLoading, refetch } = useDashboardData();
  const [selectedRequest, setSelectedRequest] = useState<SuretyRequest | null>(null);
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
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#3b82f6" />}
      >
        <View className="mb-8">
          <Text className="text-white/40 text-xs font-bold uppercase tracking-[0.3em] mb-2">
            Pending Requests
          </Text>
          <Text className="text-white text-base font-medium">
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
                <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">Requester</Text>
                <Text className="text-white font-black text-xl">
                  {request.user?.firstName} {request.user?.lastName}
                </Text>
              </View>
              <View className="w-12 h-12 bg-primary/10 rounded-2xl items-center justify-center border border-primary/20">
                <MaterialCommunityIcons name="shield-account" size={24} color="#3b82f6" />
              </View>
            </View>

            <View className="flex-row justify-between items-end mb-4">
              <View>
                <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Loan Amount</Text>
                <Text className="text-white font-bold text-lg">{formatCurrency(request.amount)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-1">Duration</Text>
                <Text className="text-white font-bold">{request.durationMonths} Months</Text>
              </View>
            </View>

            <View className="pt-4 border-t border-white/5">
              <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">Purpose</Text>
              <Text className="text-white/60 text-sm italic" numberOfLines={2}>"{request.purpose}"</Text>
            </View>
          </TouchableOpacity>
        ))}

        {(!suretyRequests || suretyRequests.length === 0) && (
          <View className="py-20 items-center">
            <View className="w-20 h-20 bg-white/5 rounded-[2.5rem] items-center justify-center mb-6">
              <MaterialCommunityIcons name="shield-check-outline" size={40} color="rgba(255,255,255,0.1)" />
            </View>
            <Text className="text-white font-black text-xl mb-2">All Clear!</Text>
            <Text className="text-white/30 text-center px-10">You don't have any pending surety requests at the moment.</Text>
          </View>
        )}
      </ScrollView>

      {/* Surety Action Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-surface rounded-t-[3rem] p-8 pb-12 border-t border-white/10">
            <View className="w-12 h-1.5 bg-white/10 rounded-full self-center mb-8" />
            
            <Text className="text-white font-black text-2xl mb-2">Surety Request</Text>
            <Text className="text-white/40 mb-8 font-medium">
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
