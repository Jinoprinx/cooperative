'use client';

import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { Transaction, Member } from '@/app/types';

export default function Transactions() {
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

    const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` }, params };
      
      const [transactionsResponse, membersResponse, loansResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, config),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/members`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const combinedTransactions = [
        ...transactionsResponse.data,
        ...loansResponse.data.map((loan: any) => ({ ...loan, type: 'loan' }))
      ];

      setTransactions(combinedTransactions);
      setMembers(membersResponse.data.members || membersResponse.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const memberId = transaction.memberId || (typeof transaction.user === 'object' ? transaction.user?._id : transaction.user);
    const member = members.find(m => m._id === memberId);
    const searchString = searchQuery.toLowerCase();

    // Use member name or transaction/user fields if member not found in list
    const firstName = member?.firstName || (typeof transaction.user === 'object' ? transaction.user?.firstName : '') || '';
    const lastName = member?.lastName || (typeof transaction.user === 'object' ? transaction.user?.lastName : '') || '';

    if (transaction.type === 'loan') {
      return (
        firstName.toLowerCase().includes(searchString) ||
        lastName.toLowerCase().includes(searchString) ||
        (transaction.purpose || '').toLowerCase().includes(searchString)
      );
    } else {
      return (
        firstName.toLowerCase().includes(searchString) ||
        lastName.toLowerCase().includes(searchString) ||
        (transaction.description || '').toLowerCase().includes(searchString)
      );
    }
  });

  const handleApproveTransaction = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${id}`, { status: 'approved' } as Partial<Transaction>, config);
      setTransactions(transactions.map(t => t._id === id ? { ...t, status: 'approved' } : t));
    } catch (error) {
      console.error('Error approving transaction:', error);
    }
  };

  const handleRejectTransaction = async () => {
    if (!selectedTransactionId || !rejectionReason.trim()) return;
    setRejecting(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const endpoint = transactions.find(t => t._id === selectedTransactionId)?.type === 'loan'
        ? `${process.env.NEXT_PUBLIC_API_URL}/loans/${selectedTransactionId}/status`
        : `${process.env.NEXT_PUBLIC_API_URL}/transactions/reject/${selectedTransactionId}`;

      const payload = transactions.find(t => t._id === selectedTransactionId)?.type === 'loan'
        ? { status: 'rejected', rejectionReason }
        : { rejectionReason };

      await axios.post(endpoint, payload, config);

      setTransactions(transactions.map(t => t._id === selectedTransactionId ? { ...t, status: 'rejected', rejectionReason } : t));
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedTransactionId(null);
    } catch (error) {
      console.error('Error rejecting transaction:', error);
    } finally {
      setRejecting(false);
    }
  };

  const openRejectModal = (id: string) => {
    setSelectedTransactionId(id);
    setShowRejectModal(true);
  };

  const handleSearch = () => {
    fetchData({ startDate, endDate });
  };

  const handleViewReceipt = (transactionId: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/receipt?token=${token}`, '_blank');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Ledger Operations</span>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter">
            Transaction <span className="text-white/40">Feed</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-1.5 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white text-[10px] font-black uppercase outline-none px-3 py-1.5 focus:text-primary transition-colors"
              />
              <span className="text-white/10 font-bold">/</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white text-[10px] font-black uppercase outline-none px-3 py-1.5 focus:text-primary transition-colors"
              />
              <button 
                onClick={handleSearch} 
                className="bg-primary/20 hover:bg-primary text-primary hover:text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Sync
              </button>
           </div>
           <button 
             onClick={() => { setStartDate(''); setEndDate(''); fetchData(); }} 
             className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"
             title="Clear Filters"
           >
             <FaSearch className="rotate-45" />
           </button>
        </div>
      </div>

      <div className="relative group">
        <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Search by member, description or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-16 pr-8 text-white text-sm focus:border-primary/50 outline-none transition-all placeholder:text-white/20 font-bold"
        />
      </div>

      <div className="card-premium p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/3">
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Snapshot</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Account Holder</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-center">Protocol</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Value</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Description</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-white/40 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map((transaction) => {
                const memberId = transaction.memberId || (typeof transaction.user === 'object' ? transaction.user?._id : transaction.user);
                const member = members.find(m => m._id === memberId);
                const isCredit = ['deposit', 'loan_disbursement'].includes(transaction.type);
                const isRejected = transaction.status === 'rejected';

                return (
                  <tr key={transaction._id} className={`group hover:bg-white/3 transition-colors ${isRejected ? 'opacity-40 grayscale' : ''}`}>
                    <td className="px-8 py-6 text-[10px] font-black text-white/30 uppercase tracking-tighter whitespace-nowrap">
                       {formatDate(transaction.date || transaction.createdAt || '')}
                    </td>
                    <td className="px-8 py-6">
                       <span className="font-bold text-white text-sm">
                         {member ? `${member.firstName} ${member.lastName}` : (typeof transaction.user === 'object' ? `${transaction.user?.firstName} ${transaction.user?.lastName}` : 'Unknown')}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        transaction.type === 'deposit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        transaction.type === 'withdrawal' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        transaction.type === 'loan' ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-400'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                         <span className={`text-lg font-black tracking-tighter ${isCredit ? 'text-emerald-400 shadow-glow-sm' : 'text-white'} ${isRejected ? 'line-through decoration-red-500' : ''}`}>
                           {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
                         </span>
                         {(transaction.type === 'loan' || transaction.remainingAmount > 0) && (
                           <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Bal: {formatCurrency(transaction.remainingAmount || 0)}</span>
                         )}
                       </div>
                    </td>
                    <td className="px-8 py-6 max-w-[200px]">
                       <p className={`text-xs text-white/40 font-medium truncate ${isRejected ? 'line-through decoration-white/10' : ''}`}>
                         {transaction.description || transaction.purpose}
                       </p>
                       {isRejected && transaction.rejectionReason && (
                         <p className="text-[9px] text-red-500/80 font-black uppercase tracking-tighter mt-1 italic">Defect: {transaction.rejectionReason}</p>
                       )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        transaction.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                        isRejected ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        'bg-amber-500/10 border-amber-500/20 text-amber-500'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${
                          transaction.status === 'approved' ? 'bg-emerald-500' :
                          isRejected ? 'bg-red-500' : 'bg-amber-500 animate-pulse'
                        }`} />
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right whitespace-nowrap">
                       <div className="flex justify-end gap-2">
                         {transaction.receiptUrl && (
                           <button 
                             onClick={() => handleViewReceipt(transaction._id)}
                             className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl transition-all"
                           >
                             Receipts
                           </button>
                         )}
                         {transaction.status === 'pending' && (
                           <>
                             <button onClick={() => handleApproveTransaction(transaction._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                               <FaSearch className="h-4 w-4" /> {/* Use Check icon if preferred, but keeping flow */}
                             </button>
                             <button onClick={() => openRejectModal(transaction._id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                               <FaSearch className="h-4 w-4 rotate-45" />
                             </button>
                           </>
                         )}
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length === 0 && (
          <div className="p-32 text-center bg-white/2">
            <p className="text-white/20 text-sm font-black uppercase tracking-[0.4em]">No financial movements recorded</p>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setShowRejectModal(false)} />
          <div className="relative glass-card p-10 rounded-[3rem] border border-red-500/20 w-full max-w-sm transform animate-float">
            <div className="mb-8 text-center">
               <h3 className="text-2xl font-black text-white tracking-tighter mb-2">Flag Transaction</h3>
               <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Protocol Rejection</p>
            </div>
            
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-red-500 transition-all font-bold resize-none mb-8"
              rows={4}
              placeholder="Specify rejection grounds..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 btn-secondary text-[10px] font-black uppercase tracking-widest py-4 rounded-xl"
                disabled={rejecting}
              >
                Halt
              </button>
              <button 
                onClick={handleRejectTransaction}
                disabled={!rejectionReason.trim() || rejecting}
                className="flex-[2] btn-primary bg-red-600 hover:bg-red-500 border-none shadow-none text-[10px] font-black uppercase tracking-widest py-4 rounded-xl"
              >
                {rejecting ? 'Processing...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}