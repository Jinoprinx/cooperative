import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Transaction, Loan, DashboardSummary } from '../types';
import { useAuth } from '../context/AuthContext';

export function useDashboardData() {
  const { isAuthenticated } = useAuth();

  const { data: activeLoans, isLoading: isLoansLoading, error: loansError, refetch: refetchLoans } = useQuery({
    queryKey: ['active-loans'],
    queryFn: async () => {
      const res = await api.get('/loans/active');
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const { data: historyData, isLoading: isHistoryLoading, error: historyError, refetch: refetchHistory } = useQuery({
    queryKey: ['transaction-history'],
    queryFn: async () => {
      const res = await api.get('/transactions/history', { params: { limit: 5 } });
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const { data: suretyRequests, isLoading: isSuretyLoading, error: suretyError, refetch: refetchSurety } = useQuery({
    queryKey: ['surety-requests'],
    queryFn: async () => {
      const res = await api.get('/loans/surety-requests');
      return res.data;
    },
    enabled: isAuthenticated,
  });

  const activeLoan = activeLoans && activeLoans.length > 0 ? activeLoans[0] : null;
  const transactions = historyData?.transactions || [];
  const summary: DashboardSummary = {
    totalDeposits: historyData?.summary?.totalDeposits || 0,
    totalWithdrawals: historyData?.summary?.totalWithdrawals || 0,
    lastDepositAmount: historyData?.lastDepositAmount || 0,
  };

  const isLoading = isLoansLoading || isHistoryLoading || isSuretyLoading;
  const error = (loansError || historyError || suretyError) ? 'Failed to load dashboard data' : null;

  const refetch = () => {
    refetchLoans();
    refetchHistory();
    refetchSurety();
  };

  return { transactions, activeLoan, suretyRequests, summary, isLoading, error, refetch };
}
