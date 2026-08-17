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
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-10 pb-20 max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1.5 sm:mb-2 block">Ledger Operations</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary-text tracking-tighter">
            Transaction <span className="text-tertiary-text">Feed</span>
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
           <div className="flex flex-1 sm:flex-initial items-center bg-surface border border-border rounded-xl sm:rounded-2xl p-1 sm:p-1.5 gap-1.5 sm:gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-primary-text text-[9px] sm:text-[10px] font-black uppercase outline-none px-2 sm:px-3 py-1 sm:py-1.5 focus:text-primary transition-colors min-w-0 flex-1 sm:flex-initial"
              />
              <span className="text-tertiary-text font-bold">/</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-primary-text text-[9px] sm:text-[10px] font-black uppercase outline-none px-2 sm:px-3 py-1 sm:py-1.5 focus:text-primary transition-colors min-w-0 flex-1 sm:flex-initial"
              />
              <button 
                onClick={handleSearch} 
                className="bg-primary/20 hover:bg-primary text-primary hover:text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition-all shrink-0"
              >
                Sync
              </button>
           </div>
           <button 
             onClick={() => { setStartDate(''); setEndDate(''); fetchData(); }} 
             className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 flex items-center justify-center rounded-xl bg-surface border border-border text-tertiary-text hover:text-primary-text transition-all"
             title="Clear Filters"
           >
             <FaSearch className="rotate-45 h-3.5 w-3.5" />
           </button>
        </div>
      </div>

      <div className="relative group">
        <FaSearch className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-primary/50 group-focus-within:text-primary transition-colors h-4 w-4" />
        <input
          type="text"
          placeholder="Search by member, description or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border rounded-2xl sm:rounded-3xl py-3.5 sm:py-5 pl-11 sm:pl-16 pr-4 sm:pr-8 text-primary-text text-xs sm:text-sm focus:border-primary/50 outline-none transition-all placeholder:text-tertiary-text font-bold"
        />
      </div>

      <div className="card-premium p-0 overflow-hidden bg-surface border border-border">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border bg-surface-lighter/50">
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Snapshot</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Account Holder</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest text-center">Protocol</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Value</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Description</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest">Status</th>
                <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-wider sm:tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((transaction) => {
                const memberId = transaction.memberId || (typeof transaction.user === 'object' ? transaction.user?._id : transaction.user);
                const member = members.find(m => m._id === memberId);
                const isCredit = ['deposit', 'loan_disbursement'].includes(transaction.type);
                const isRejected = transaction.status === 'rejected';

                return (
                  <tr key={transaction._id} className={`group hover:bg-surface-lighter transition-colors ${isRejected ? 'opacity-40 grayscale' : ''}`}>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-[9px] sm:text-[10px] font-black text-tertiary-text uppercase tracking-tighter whitespace-nowrap">
                       {formatDate(transaction.date || transaction.createdAt || '')}
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                       <span className="font-bold text-primary-text text-xs sm:text-sm">
                         {member ? `${member.firstName} ${member.lastName}` : (typeof transaction.user === 'object' ? `${transaction.user?.firstName} ${transaction.user?.lastName}` : 'Unknown')}
                       </span>
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-center whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider border ${
                        transaction.type === 'deposit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                        transaction.type === 'withdrawal' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                        transaction.type === 'loan' ? 'bg-purple-500/10 border-purple-500/20 text-purple-500' :
                        'bg-blue-500/10 border-blue-500/20 text-blue-500'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                       <div className="flex flex-col">
                         <span className={`text-sm sm:text-base lg:text-lg font-black tracking-tight ${isCredit ? 'text-emerald-500 shadow-glow-sm' : 'text-primary-text'} ${isRejected ? 'line-through decoration-red-500' : ''}`}>
                           {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
                         </span>
                         {(transaction.type === 'loan' || (transaction.remainingAmount || 0) > 0) && (
                           <span className="text-[8px] sm:text-[9px] font-black text-tertiary-text uppercase tracking-wider">Bal: {formatCurrency(transaction.remainingAmount || 0)}</span>
                         )}
                       </div>
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-[200px]">
                       <p className={`text-xs text-tertiary-text font-medium truncate ${isRejected ? 'line-through decoration-border' : ''}`}>
                         {transaction.description || transaction.purpose}
                       </p>
                       {isRejected && transaction.rejectionReason && (
                         <p className="text-[8px] sm:text-[9px] text-red-500/80 font-black uppercase tracking-tighter mt-1 italic truncate">Defect: {transaction.rejectionReason}</p>
                       )}
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-wider border ${
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
                    </td>
                    <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-right whitespace-nowrap">
                       <div className="flex justify-end gap-1.5 sm:gap-2">
                         {transaction.receiptUrl && (
                           <button 
                             onClick={() => handleViewReceipt(transaction._id)}
                             className="text-[9px] sm:text-[10px] font-black text-primary hover:text-white uppercase tracking-wider px-3 py-1.5 sm:px-4 sm:py-2 bg-primary/10 border border-primary/20 rounded-xl transition-all"
                           >
                             Receipt
                           </button>
                         )}
                         {transaction.status === 'pending' && (
                           <>
                             <button onClick={() => handleApproveTransaction(transaction._id)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all">
                               <FaSearch className="h-3 w-3 sm:h-4 sm:w-4" />
                             </button>
                             <button onClick={() => openRejectModal(transaction._id)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                               <FaSearch className="h-3 w-3 sm:h-4 sm:w-4 rotate-45" />
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
          <div className="p-16 sm:p-32 text-center bg-surface">
            <p className="text-tertiary-text text-xs sm:text-sm font-black uppercase tracking-[0.2em] sm:tracking-[0.4em]">No financial movements recorded</p>
          </div>
        )}
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setShowRejectModal(false)} />
          <div className="relative glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] border border-border w-full max-w-sm transform animate-float bg-surface">
            <div className="mb-6 sm:mb-8 text-center">
               <h3 className="text-xl sm:text-2xl font-black text-primary-text tracking-tighter mb-2">Flag Transaction</h3>
               <p className="text-tertiary-text text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Protocol Rejection</p>
            </div>
            
            <textarea
              className="w-full bg-surface-lighter border border-border rounded-xl sm:rounded-2xl p-4 sm:p-5 text-primary-text text-xs sm:text-sm outline-none focus:border-red-500 transition-all font-bold resize-none mb-6 sm:mb-8"
              rows={4}
              placeholder="Specify rejection grounds..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
            
            <div className="flex gap-3 sm:gap-4">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 btn-secondary text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-3.5 sm:py-4 rounded-xl"
                disabled={rejecting}
              >
                Halt
              </button>
              <button 
                onClick={handleRejectTransaction}
                disabled={!rejectionReason.trim() || rejecting}
                className="flex-[2] btn-primary bg-red-600 hover:bg-red-500 border-none shadow-none text-[9px] sm:text-[10px] font-black uppercase tracking-wider py-3.5 sm:py-4 rounded-xl"
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