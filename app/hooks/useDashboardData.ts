
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Transaction, ActiveLoan, TransactionSummary } from '@/app/types';

export function useDashboardData() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeLoan, setActiveLoan] = useState<ActiveLoan | null>(null);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalDeposits: 0,
    totalWithdrawals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const [loansResponse, transactionsResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/active`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions/history`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 5 },
        }),
      ]);

      const activeLoans = loansResponse.data;

      if (activeLoans.length > 0) {
        const loan = activeLoans[0];
        loan.remainingAmount = typeof loan.remainingAmount === 'number' ? loan.remainingAmount : 0;
        setActiveLoan(loan);
      } else {
        setActiveLoan(null);
      }
      setTransactions(transactionsResponse.data.transactions);
      setSummary({
        totalDeposits: transactionsResponse.data.summary?.totalDeposits || 0,
        totalWithdrawals: transactionsResponse.data.summary?.totalWithdrawals || 0,
        lastDepositAmount: transactionsResponse.data.lastDepositAmount || 0,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleTransactionSuccess = () => {
      fetchData();
    };

    window.addEventListener('transaction-success', handleTransactionSuccess);

    return () => {
      window.removeEventListener('transaction-success', handleTransactionSuccess);
    };
  }, [fetchData]);

  return { transactions, activeLoan, summary, loading, error, refetch: fetchData };
}
