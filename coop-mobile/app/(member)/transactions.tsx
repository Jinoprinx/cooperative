import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDashboardData } from '../../hooks/useDashboardData';
import { formatCurrency, formatDate, getTransactionColor, getTransactionPrefix, getTransactionLabel } from '../../lib/utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTheme } from '../../context/ThemeContext';
import { usePrivacy } from '../../hooks/usePrivacy';

export default function Transactions() {
  usePrivacy();
  const { transactions, isLoading, refetch } = useDashboardData();
  const { primaryColor } = useTheme();
  const [filter, setFilter] = useState<'all' | 'deposit' | 'withdrawal' | 'loan_repayment'>('all');

  const filteredTransactions = filter === 'all' 
    ? transactions 
    : transactions.filter((t: any) => t.type === filter);

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdrawal', label: 'Withdrawals' },
    { id: 'loan_repayment', label: 'Repayments' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-5 pt-4 pb-6">
        <Text className="text-foreground/40 text-xs font-bold uppercase tracking-[0.3em] mb-4">
          Financial Ledger
        </Text>
        <Text className="text-4xl font-black text-foreground tracking-tighter mb-6">Activity</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {filters.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => setFilter(f.id as any)}
              className={`mr-3 px-6 py-3 rounded-2xl border ${
                filter === f.id ? 'bg-primary border-primary' : 'bg-surface border-border'
              }`}
            >
              <Text className={`font-bold text-sm ${filter === f.id ? 'text-white' : 'text-foreground/40'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={primaryColor} />
        }
        ListEmptyComponent={
          <View className="py-20 items-center">
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="rgba(var(--foreground), 0.05)" />
            <Text className="text-foreground/20 mt-4 font-bold text-lg">No transactions found</Text>
          </View>
        }
        renderItem={({ item: tx }) => (
          <TouchableOpacity 
            className="bg-surface border border-border rounded-[2rem] p-6 mb-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-14 h-14 bg-foreground/5 rounded-2xl items-center justify-center mr-4">
                <MaterialCommunityIcons 
                  name={tx.type === 'deposit' ? 'arrow-down-bold-circle' : 'arrow-up-bold-circle'} 
                  size={28} 
                  color={getTransactionColor(tx.type)} 
                />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-bold text-lg" numberOfLines={1}>{tx.description}</Text>
                <Text className="text-foreground/30 text-xs font-medium uppercase tracking-widest mt-1">
                  {getTransactionLabel(tx.type)} • {formatDate(tx.date)}
                </Text>
              </View>
            </View>
            <View className="items-end ml-4">
              <Text 
                className="font-black text-xl"
                style={{ color: getTransactionColor(tx.type) }}
              >
                {getTransactionPrefix(tx.type)}{formatCurrency(tx.amount)}
              </Text>
              <View className="bg-foreground/5 px-2 py-0.5 rounded-md mt-1">
                <Text className="text-foreground/20 text-[9px] font-black uppercase tracking-widest">Completed</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
