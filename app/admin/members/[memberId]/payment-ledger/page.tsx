'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { PaymentRecord, Member } from '@/app/types';
import { FaArrowLeft, FaCloudUploadAlt, FaTimes } from 'react-icons/fa';

export default function MemberPaymentLedger() {
  const params = useParams();
  const router = useRouter();
  const { memberId } = params;
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Upload form states
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('deposit');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fetchMemberDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/members/${memberId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMember(response.data.member);
    } catch (error) {
      console.error('Error fetching member details:', error);
    }
  };

  const fetchPaymentRecords = async (queryParams = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/members/${memberId}/payment-ledger`, {
        headers: { Authorization: `Bearer ${token}` },
        params: queryParams
      });
      setPaymentRecords(response.data.paymentRecords);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment records:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (memberId) {
      fetchMemberDetails();
      fetchPaymentRecords();
    }
  }, [memberId]);

  const handleUploadReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !amount) return;

    setUploading(true);
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('amount', amount);
    formData.append('purpose', purpose);
    formData.append('description', description);
    formData.append('targetUserId', memberId as string);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/transactions/upload-receipt`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      setShowUploadModal(false);
      setAmount('');
      setDescription('');
      setFile(null);
      fetchPaymentRecords();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleFilter = () => {
    fetchPaymentRecords({ startDate, endDate });
  };

  const handleQuickFilter = (limit: number) => {
    fetchPaymentRecords({ limit });
  };

  const handleViewReceipt = (transactionId: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/receipt?token=${token}`, '_blank');
  };

  if (loading && !member) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="text-center animate-pulse">
           <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
           <p className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">Accessing Ledger...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 text-primary-text">
       {/* Header */}
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <button onClick={() => router.back()} className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-4 flex items-center gap-2 hover:translate-x-[-4px] transition-transform">
            <FaArrowLeft /> Back to Directory
          </button>
          <h1 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
            Payment <span className="text-tertiary-text">Ledger</span>
          </h1>
          {member && (
            <p className="text-tertiary-text text-sm font-bold mt-2">
              Member: {member.firstName} {member.lastName} ({member.accountNumber})
              {member.isManual && (
                <span className="ml-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border bg-amber-500/10 border-amber-500/20 text-amber-500">
                  Manual Member
                </span>
              )}
            </p>
          )}
        </div>
        <div>
           {member?.isManual && (
             <button 
               onClick={() => setShowUploadModal(true)}
               className="btn-primary px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
             >
               <FaCloudUploadAlt className="text-lg" /> Upload Receipt for Member
             </button>
           )}
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
          <button onClick={handleFilter} className="bg-primary/20 hover:bg-primary text-primary hover:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300">
            Sync View
          </button>
          
          <div className="flex-1 flex justify-end gap-3 pb-1">
            <button onClick={() => handleQuickFilter(5)} className="px-4 py-2 bg-surface border border-border rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-primary transition-all text-tertiary-text hover:text-primary-text">Last 5</button>
            <button onClick={() => handleQuickFilter(10)} className="px-4 py-2 bg-surface border border-border rounded-xl text-[8px] font-black uppercase tracking-widest hover:border-primary transition-all text-tertiary-text hover:text-primary-text">Last 10</button>
            <button onClick={() => { setStartDate(''); setEndDate(''); fetchPaymentRecords(); }} className="px-4 py-2 text-[8px] font-black uppercase tracking-widest text-primary/60 hover:text-primary">Reset</button>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card-premium p-0 overflow-hidden relative bg-surface">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Protocol Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Value (NGN)</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Vector</th>
                <th className="px-8 py-6 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paymentRecords.map((record) => (
                <tr key={record._id} className="group hover:bg-surface-lighter transition-colors">
                  <td className="px-8 py-6 whitespace-nowrap">
                     <span className="text-xs font-bold text-tertiary-text">{formatDate(record.date)}</span>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-lg font-black tracking-tighter text-emerald-500">{formatCurrency(record.amount)}</span>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-surface border border-border rounded-lg">{record.paymentMethod}</span>
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    {(record as any).receiptUrl && (
                      <button
                        onClick={() => handleViewReceipt(record._id)}
                        className="text-[10px] font-black text-primary hover:text-white uppercase tracking-widest px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl transition-all"
                      >
                        View Receipt
                      </button>
                    )}
                  </td>
                </tr>
               ))}
               {paymentRecords.length === 0 && (
                <tr>
                   <td colSpan={4} className="py-24 text-center">
                      <p className="text-tertiary-text text-[10px] font-black uppercase tracking-[0.4em] italic">No ledger records found</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setShowUploadModal(false)} />
          <div className="relative glass-card p-12 rounded-[3.5rem] border border-border w-full max-w-xl shadow-2xl animate-float bg-surface">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-8 right-8 text-tertiary-text hover:text-primary transition-colors"
            >
              <FaTimes />
            </button>
            <div className="mb-10 text-center">
               <h3 className="text-3xl font-black text-primary-text tracking-tighter mb-2">Upload Client Receipt</h3>
               <p className="text-tertiary-text text-xs font-bold uppercase tracking-widest">Documenting a payment for <span className="text-primary">{member?.firstName}</span></p>
            </div>
            
            <form onSubmit={handleUploadReceipt} className="space-y-6">
               <div className="space-y-2 relative group-field">
                  <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within:text-primary transition-colors z-10">Value Amount</span>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-10 text-primary-text text-sm outline-none focus:border-primary transition-all font-black"
                    placeholder="50000"
                  />
               </div>

               <div className="space-y-2 relative group-field">
                  <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] z-10">Protocol Purpose</span>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-10 text-primary-text text-sm outline-none focus:border-primary transition-all font-black uppercase tracking-widest appearance-none"
                  >
                    <option value="deposit">Deposit / Savings</option>
                    <option value="loan_repayment">Loan Repayment</option>
                  </select>
               </div>

               <div className="space-y-2 relative group-field">
                  <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] z-10">Meta Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-10 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold h-24"
                    placeholder="Notes about this transaction..."
                  />
               </div>

               <div className="space-y-2 relative group-field">
                  <span className="absolute top-1 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] z-10">Verification Evidence (File)</span>
                  <input
                    type="file"
                    required
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-10 text-primary-text text-[10px] outline-none focus:border-primary transition-all font-black file:hidden"
                  />
                  {file && <p className="text-[8px] font-bold text-primary mt-1 px-6 truncate">{file.name}</p>}
               </div>

               <button 
                type="submit" 
                disabled={uploading}
                className="w-full btn-primary py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] relative overflow-hidden group shadow-[0_0_30px_rgba(59,130,246,0.15)] mt-4 disabled:opacity-50"
               >
                 {uploading ? 'Processing Evidence...' : 'Authorize Transaction'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
