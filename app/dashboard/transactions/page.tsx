'use client';

import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import Link from 'next/link';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Transaction } from '@/app/types';
import dynamic from 'next/dynamic';

const PayNowButton = dynamic(() => import('@/app/components/PayNowButton'), { ssr: false });

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTransactions = async (params = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          ...params
        }
      });

      setTransactions(response.data.transactions);
      setFilteredTransactions(response.data.transactions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError('Failed to load transactions. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleFilter = () => {
    fetchTransactions({ startDate, endDate });
  };

  const handleQuickFilter = (limit: number) => {
    fetchTransactions({ limit });
  };

  const handleViewReceipt = (transactionId: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/receipt?token=${token}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          < p className="text-black">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Transactions</h1>
      <div className="mb-4 flex space-x-4">
        <PayNowButton />
        <Link href="/payment-ledger">
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            View Payment Ledger
          </button>
        </Link>
      </div>
      {/* Filter Section */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input input-bordered w-full md:w-auto"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input input-bordered w-full md:w-auto"
          />
          <button onClick={handleFilter} className="btn btn-primary">
            <FaSearch className="mr-2" /> Search
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">Quick Filters:</span>
            <button onClick={() => handleQuickFilter(5)} className="btn btn-outline btn-xs btn-primary">Last 5</button>
            <button onClick={() => handleQuickFilter(10)} className="btn btn-outline btn-xs btn-primary">Last 10</button>
            <button onClick={() => fetchTransactions()} className="btn btn-outline btn-xs text-gray-400">Clear</button>
          </div>
        </div>
      </div>
      {/* Transactions Table */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction._id} className={`${transaction.status === 'rejected' ? 'line-through text-gray-400' : ''}`}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">{formatDate(transaction.date)}</td>
                  <td className="px-6 py-4 text-sm">{transaction.description}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${transaction.type === 'deposit'
                        ? 'bg-green-100 text-green-800'
                        : transaction.type === 'withdrawal'
                          ? 'bg-red-100 text-red-800'
                          : transaction.type === 'loan_repayment'
                            ? 'bg-blue-100 text-blue-800'
                            : transaction.type === 'loan_disbursement'
                              ? 'bg-purple-100 text-purple-800'
                              : transaction.type === 'interest_payment'
                                ? 'bg-yellow-100 text-yellow-800'
                                : transaction.type === 'fee'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-gray-100 text-gray-800'
                        }`}
                    >
                      {transaction.type === 'deposit'
                        ? 'Deposit'
                        : transaction.type === 'withdrawal'
                          ? 'Withdrawal'
                          : transaction.type === 'loan_repayment'
                            ? 'Loan Repayment'
                            : transaction.type === 'loan_disbursement'
                              ? 'Loan Disbursement'
                              : transaction.type === 'interest_payment'
                                ? 'Interest Payment'
                                : transaction.type === 'fee'
                                  ? 'Fee'
                                  : transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-col">
                      <span className={`inline-flex w-fit rounded-full px-2 text-xs font-semibold leading-5 ${transaction.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {transaction.status}
                      </span>
                      {transaction.status === 'rejected' && transaction.rejectionReason && (
                        <span className="text-[10px] text-red-500 mt-1 italic max-w-[150px] truncate">
                          Reason: {transaction.rejectionReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td
                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${transaction.status === 'rejected' ? 'text-gray-400 opacity-50' : ['deposit', 'loan_disbursement'].includes(transaction.type) ? 'text-green-600' : 'text-red-600'
                      }`}
                  >
                    <span className={transaction.status === 'rejected' ? 'line-through decoration-red-500' : ''}>
                      {['deposit', 'loan_disbursement'].includes(transaction.type) ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    {transaction.receiptUrl && (
                      <button
                        onClick={() => handleViewReceipt(transaction._id)}
                        className="text-primary hover:underline font-medium"
                      >
                        View Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}