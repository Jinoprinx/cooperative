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
}

export default function PendingPaymentsPage() {
  const { user } = useAuth();
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

  const handleApprove = async (transactionId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/transactions/approve/${transactionId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransactions(transactions.filter(t => t._id !== transactionId));
    } catch (err) {
      setError('Failed to approve payment.');
    }
  };

  const handleReject = async (transactionId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/transactions/reject/${transactionId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransactions(transactions.filter(t => t._id !== transactionId));
    } catch (err) {
      setError('Failed to reject payment.');
    }
  };

  const handleViewReceipt = (transactionId: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/receipt?token=${token}`, '_blank');
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="space-y-10 pb-20 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Verification Protocol</span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">
            Pending <span className="text-white/40">Inbound</span>
          </h1>
        </div>
      </div>

      <div className="card-premium p-0 overflow-hidden relative">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/3">
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Protocol Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Account Holder</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Description</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Value (NGN)</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="group hover:bg-white/3 transition-colors">
                  <td className="px-8 py-6 whitespace-nowrap">
                     <span className="text-xs font-bold text-white/60">{new Date(transaction.date).toLocaleDateString()}</span>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex flex-col">
                       <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{transaction.user.firstName} {transaction.user.lastName}</span>
                       <span className="text-[10px] font-medium text-white/20 truncate max-w-[200px]">{transaction.user.email}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-medium text-white/70 max-w-[150px] truncate">{transaction.description}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <span className="text-lg font-black tracking-tighter text-emerald-400 shadow-glow-sm">
                       {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(transaction.amount)}
                     </span>
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-3 items-center">
                       <button 
                         onClick={() => handleViewReceipt(transaction._id)}
                         className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl transition-all"
                       >
                         Doc
                       </button>
                       <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                          <button onClick={() => handleApprove(transaction._id)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                             <div className="w-2.5 h-2.5 border-b-2 border-r-2 border-current rotate-45 mb-1" />
                          </button>
                          <button onClick={() => handleReject(transaction._id)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                             <div className="w-3 h-0.5 bg-current rotate-45 absolute" />
                             <div className="w-3 h-0.5 bg-current -rotate-45 absolute" />
                          </button>
                       </div>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                   <td colSpan={5} className="py-24 text-center bg-white/2">
                      <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em] italic">No pending inbound protocols</p>
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