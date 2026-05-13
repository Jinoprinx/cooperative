'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';

interface Transaction {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  amount: number;
  description: string;
  receiptUrl: string;
  date: string;
  isProxyPayment?: boolean;
  initiatedBy?: {
    firstName: string;
    lastName: string;
  };
}

export default function PendingPaymentsPage() {
  const { user, isMainAdmin } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions/pending`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTransactions(response.data);
      } catch (err) {
        setError('Failed to fetch pending payments.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchPendingTransactions();
    }
  }, [user]);

  const handleApprove = async (transaction: Transaction) => {
    if (transaction.isProxyPayment && !isMainAdmin) {
      setError('Only the main admin can approve payments made on behalf of manual members.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/transactions/approve/${transaction._id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransactions(transactions.filter(t => t._id !== transaction._id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve payment.');
    }
  };

  const handleReject = async (transaction: Transaction) => {
    if (transaction.isProxyPayment && !isMainAdmin) {
      setError('Only the main admin can reject payments made on behalf of manual members.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/transactions/reject/${transaction._id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransactions(transactions.filter(t => t._id !== transaction._id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject payment.');
    }
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
          <p className="text-tertiary-text">Verifying Protocols...</p>
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Verification Protocol</span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-primary-text">
            Pending <span className="text-tertiary-text">Inbound</span>
          </h1>
        </div>
      </div>

      <div className="card-premium p-0 overflow-hidden relative">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Protocol Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Account Holder</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Description</th>
                {isMainAdmin && <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Initiated By</th>}
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Value (NGN)</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="group hover:bg-surface transition-colors">
                  <td className="px-8 py-6 whitespace-nowrap">
                     <span className="text-xs font-bold text-tertiary-text">{new Date(transaction.date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col">
                       <span className="text-sm font-bold text-primary-text group-hover:text-primary transition-colors">{transaction.user.firstName} {transaction.user.lastName}</span>
                       <span className="text-[10px] font-medium text-tertiary-text truncate max-w-[200px]">{transaction.user.email}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-medium text-secondary-text max-w-[150px] truncate">{transaction.description}</p>
                    {transaction.isProxyPayment && (
                      <span className="inline-block mt-1 text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Proxy</span>
                    )}
                  </td>
                  {isMainAdmin && (
                    <td className="px-8 py-6">
                      {transaction.initiatedBy ? (
                        <span className="text-xs font-bold text-purple-400">{transaction.initiatedBy.firstName} {transaction.initiatedBy.lastName}</span>
                      ) : (
                        <span className="text-xs text-tertiary-text">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-8 py-6 text-right">
                     <span className="text-lg font-black tracking-tighter text-emerald-500 shadow-glow-sm">
                       {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(transaction.amount)}
                     </span>
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    {transaction.isProxyPayment && !isMainAdmin ? (
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">Main Admin Only</span>
                    ) : (
                      <div className="flex justify-end gap-3 items-center">
                         <button 
                           onClick={() => handleViewReceipt(transaction._id)}
                           className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl transition-all"
                         >
                           Doc
                         </button>
                         <div className="flex gap-2 p-1 bg-surface rounded-xl border border-border">
                            <button onClick={() => handleApprove(transaction)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                               <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-current rotate-45 mb-1" />
                            </button>
                            <button onClick={() => handleReject(transaction)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all relative">
                               <div className="w-3 h-0.5 bg-current rotate-45 absolute" />
                               <div className="w-3 h-0.5 bg-current -rotate-45 absolute" />
                            </button>
                         </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                   <td colSpan={isMainAdmin ? 6 : 5} className="py-24 text-center bg-surface">
                      <p className="text-tertiary-text text-[10px] font-black uppercase tracking-[0.4em] italic">No pending inbound protocols</p>
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