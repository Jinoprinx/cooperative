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
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text">Loading transaction history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-20 text-primary-text w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 md:gap-6 w-full min-w-0">
        <div className="min-w-0">
          <span className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-1 sm:mb-1.5 block">Personal Ledger</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary-text tracking-tighter truncate">
            Transaction <span className="text-tertiary-text">Hub</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto shrink-0">
           <Link href="/payment-ledger" className="flex-1 sm:flex-initial">
             <button className="w-full sm:w-auto btn-secondary px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3 text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider sm:tracking-widest rounded-xl sm:rounded-2xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all bg-emerald-500/10">
               View Ledger
             </button>
           </Link>
           <div className="p-1 bg-surface rounded-xl sm:rounded-2xl border border-border flex-1 sm:flex-initial min-w-0">
              <PayNowButton />
           </div>
        </div>
      </div>

      {/* 2 Cards Container: Stacked on small devices, side-by-side on large devices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 md:gap-8 items-start w-full min-w-0 max-w-full">
        {/* Card 1: Filter Section */}
        <div className="lg:col-span-4 w-full min-w-0 max-w-full">
          <div className="glass-card p-4 sm:p-6 md:p-7 rounded-xl sm:rounded-2xl md:rounded-3xl border border-border space-y-4 sm:space-y-5 bg-surface w-full min-w-0 max-w-full">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <FaSearch className="text-primary h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <h2 className="text-xs sm:text-sm md:text-base font-black text-primary-text tracking-tight uppercase">
                  Filter Records
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 w-full min-w-0">
              <div className="space-y-1 sm:space-y-1.5 min-w-0">
                <label className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest ml-1 sm:ml-2">
                  Start Period
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg sm:rounded-xl md:rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-primary-text text-[11px] sm:text-xs outline-none focus:border-primary transition-all font-black uppercase tracking-wider"
                />
              </div>
              <div className="space-y-1 sm:space-y-1.5 min-w-0">
                <label className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest ml-1 sm:ml-2">
                  End Period
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-surface border border-border rounded-lg sm:rounded-xl md:rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-primary-text text-[11px] sm:text-xs outline-none focus:border-primary transition-all font-black uppercase tracking-wider"
                />
              </div>
            </div>

            <button
              onClick={handleFilter}
              className="w-full bg-primary/20 hover:bg-primary text-primary hover:text-white px-4 py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl md:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-none border-none"
            >
              <FaSearch className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Apply Filter
            </button>

            {/* Quick Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/40">
              <span className="text-[8px] sm:text-[9px] font-black text-tertiary-text uppercase tracking-wider">
                Quick Filters:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => handleQuickFilter(5)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-surface-lighter border border-border rounded-lg text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider hover:border-primary transition-all text-tertiary-text hover:text-primary-text"
                >
                  Recent 5
                </button>
                <button
                  onClick={() => handleQuickFilter(10)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-surface-lighter border border-border rounded-lg text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider hover:border-primary transition-all text-tertiary-text hover:text-primary-text"
                >
                  Recent 10
                </button>
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    fetchTransactions();
                  }}
                  className="px-2 py-1 text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-wider text-primary/70 hover:text-primary transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Transactions Table Card */}
        <div className="lg:col-span-8 w-full min-w-0 max-w-full">
          <div className="card-premium p-0 overflow-hidden relative bg-surface border border-border w-full max-w-full min-w-0">
            <div className="p-3.5 sm:p-5 md:p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-black text-primary-text tracking-tighter">
                  Transaction History
                </h2>
                <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider mt-0.5">
                  {filteredTransactions.length} Record{filteredTransactions.length === 1 ? '' : 's'} Found
                </p>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px] w-full max-w-full">
              <table className="w-full text-left border-collapse min-w-[480px] sm:min-w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-lighter/50">
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">
                      Event Date
                    </th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">
                      Classification
                    </th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider text-right">
                      Value (NGN)
                    </th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider text-right">
                      Receipt
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((transaction) => {
                    const isCredit = ['deposit', 'loan_disbursement'].includes(transaction.type);
                    const isRejected = transaction.status === 'rejected';

                    return (
                      <tr
                        key={transaction._id}
                        className={`group hover:bg-surface-lighter transition-colors ${
                          isRejected ? 'opacity-40' : ''
                        }`}
                      >
                        <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 whitespace-nowrap">
                          <span className="text-[11px] sm:text-xs font-bold text-tertiary-text">
                            {formatDate(transaction.date)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5">
                          <div className="flex flex-col max-w-[140px] sm:max-w-xs min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-primary-text group-hover:text-primary transition-colors truncate">
                              {transaction.description}
                            </span>
                            <span
                              className={`text-[7px] sm:text-[8px] font-black uppercase tracking-wider mt-0.5 w-fit px-1.5 py-0.5 rounded border ${
                                transaction.type === 'deposit'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                  : transaction.type === 'withdrawal'
                                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                  : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                              }`}
                            >
                              {transaction.type.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-wider border w-fit ${
                                transaction.status === 'approved'
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                  : isRejected
                                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                              }`}
                            >
                              <div
                                className={`w-1 h-1 rounded-full ${
                                  transaction.status === 'approved'
                                    ? 'bg-emerald-500'
                                    : isRejected
                                    ? 'bg-red-500'
                                    : 'bg-amber-500 animate-pulse'
                                }`}
                              />
                              {transaction.status}
                            </span>
                            {isRejected && transaction.rejectionReason && (
                              <span className="text-[8px] text-red-500/80 font-bold italic max-w-[120px] truncate">
                                ! {transaction.rejectionReason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 text-right whitespace-nowrap">
                          <span
                            className={`text-xs sm:text-sm md:text-base lg:text-lg font-black tracking-tight ${
                              isRejected
                                ? 'line-through decoration-red-500/50'
                                : isCredit
                                ? 'text-emerald-500 shadow-glow-sm'
                                : 'text-primary-text'
                            }`}
                          >
                            {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 text-right whitespace-nowrap">
                          {transaction.receiptUrl && (
                            <button
                              onClick={() => handleViewReceipt(transaction._id)}
                              className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-primary hover:text-white uppercase tracking-wider px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 bg-primary/10 hover:bg-primary border border-primary/20 rounded-lg transition-all"
                            >
                              Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center bg-surface">
                        <p className="text-tertiary-text text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic">
                          No transaction records found in ledger
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}