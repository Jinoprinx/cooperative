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
    <div className="space-y-10 pb-20 text-primary-text">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Personal Ledger</span>
          <h1 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
            Transaction <span className="text-tertiary-text">Hub</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           <Link href="/payment-ledger">
             <button className="btn-secondary px-8 py-3.5 text-[10px] font-black uppercase tracking-widest rounded-2xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all bg-emerald-500/10">
               Deep Ledger
             </button>
           </Link>
           <div className="p-1 bg-surface rounded-2xl border border-border">
              <PayNowButton />
           </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="glass-card p-8 rounded-[2.5rem] border border-border space-y-8 bg-surface">
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2">
             <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Start Period</label>
             <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-surface border border-border rounded-2xl py-4 px-6 text-primary-text text-sm outline-none focus:border-primary transition-all font-black uppercase tracking-widest block"
            />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">End Period</label>
             <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-surface border border-border rounded-2xl py-4 px-6 text-primary-text text-sm outline-none focus:border-primary transition-all font-black uppercase tracking-widest block"
            />
          </div>
          <button onClick={handleFilter} className="bg-primary/20 hover:bg-primary text-primary hover:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center gap-3">
            <FaSearch /> Sync Ledger
          </button>
          
          <div className="flex-1 flex justify-end gap-3 pb-1">
            <button onClick={() => handleQuickFilter(5)} className="px-4 py-2 bg-surface border border-border rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-primary transition-all text-tertiary-text hover:text-primary-text">Recent 5</button>
            <button onClick={() => handleQuickFilter(10)} className="px-4 py-2 bg-surface border border-border rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-primary transition-all text-tertiary-text hover:text-primary-text">Recent 10</button>
            <button onClick={() => fetchTransactions()} className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-primary/60 hover:text-primary">Clear</button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card-premium p-0 overflow-hidden relative bg-surface">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Protocol Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Classification</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Integrity</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Value (NGN)</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Documentation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((transaction) => {
                const isCredit = ['deposit', 'loan_disbursement'].includes(transaction.type);
                const isRejected = transaction.status === 'rejected';

                return (
                  <tr key={transaction._id} className={`group hover:bg-surface-lighter transition-colors ${isRejected ? 'opacity-40' : ''}`}>
                    <td className="px-8 py-6 whitespace-nowrap">
                       <span className="text-xs font-bold text-tertiary-text">{formatDate(transaction.date)}</span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-primary-text group-hover:text-primary transition-colors">{transaction.description}</span>
                         <span className={`text-[8px] font-black uppercase tracking-widest mt-1 w-fit px-1.5 py-0.5 rounded-md border ${
                           transaction.type === 'deposit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                           transaction.type === 'withdrawal' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                           'bg-blue-500/10 border-blue-500/20 text-blue-500'
                         }`}>
                           {transaction.type.replace('_', ' ')}
                         </span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          transaction.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                          isRejected ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                          'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        }`}>
                           <div className={`w-1 h-1 rounded-full ${
                             transaction.status === 'approved' ? 'bg-emerald-500' :
                             isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                           }`} />
                           {transaction.status}
                        </span>
                        {isRejected && transaction.rejectionReason && (
                          <span className="text-[10px] text-red-500/80 font-bold italic max-w-[150px] truncate ml-1">! {transaction.rejectionReason}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className={`text-lg font-black tracking-tighter ${isRejected ? 'line-through decoration-red-500/50' : isCredit ? 'text-emerald-500 shadow-glow-sm' : 'text-primary-text'}`}>
                         {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       {transaction.receiptUrl && (
                         <button 
                           onClick={() => handleViewReceipt(transaction._id)}
                           className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl transition-all"
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
                   <td colSpan={5} className="py-24 text-center bg-surface">
                      <p className="text-tertiary-text text-[10px] font-black uppercase tracking-[0.4em] italic">No transaction records found in ledger</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}