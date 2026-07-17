'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { useDashboardData } from '@/app/hooks/useDashboardData';
import { FaCloudUploadAlt, FaReceipt, FaMoneyBillWave, FaInfoCircle, FaShieldAlt } from 'react-icons/fa';

export default function UploadReceiptPage() {
  const { user } = useAuth();
  const { refetch: refetchDashboardData } = useDashboardData();
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    setSavingsAmount(val);
    setLoanAmount('0');
  };

  const handleSavingsChange = (val: string) => {
    setSavingsAmount(val);
    const total = parseFloat(amount || '0');
    const savings = parseFloat(val || '0');
    if (!isNaN(total) && !isNaN(savings)) {
      const remaining = Math.max(0, total - savings);
      setLoanAmount(remaining.toString());
    }
  };

  const handleLoanChange = (val: string) => {
    setLoanAmount(val);
    const total = parseFloat(amount || '0');
    const loan = parseFloat(val || '0');
    if (!isNaN(total) && !isNaN(loan)) {
      const remaining = Math.max(0, total - loan);
      setSavingsAmount(remaining.toString());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !amount) {
      setError('Please provide a receipt and an amount.');
      return;
    }

    const total = parseFloat(amount);
    const savings = parseFloat(savingsAmount || '0');
    const loan = parseFloat(loanAmount || '0');

    if (isNaN(total) || total <= 0) {
      setError('Please provide a valid total amount.');
      return;
    }

    if (isNaN(savings) || savings < 0 || isNaN(loan) || loan < 0) {
      setError('Savings and loan allocations must be non-negative.');
      return;
    }

    if (Math.abs((savings + loan) - total) > 0.01) {
      setError('The sum of Savings and Loan allocations must equal the Total Amount.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('amount', amount);
    formData.append('purpose', 'split');
    formData.append('savingsAmount', savingsAmount || '0');
    formData.append('loanAmount', loanAmount || '0');

    if (description) {
      formData.append('description', description);
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/transactions/upload-receipt`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccess('Receipt uploaded successfully. It is pending review.');
      setFile(null);
      setAmount('');
      setSavingsAmount('');
      setLoanAmount('');
      setDescription('');
      refetchDashboardData();
    } catch (err) {
      setError('Failed to upload receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-4">
      <main className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-glow-sm">
            <FaReceipt className="text-2xl text-primary" />
          </div>
          <h1 className="text-4xl font-black text-primary-text tracking-tighter mb-2">Protocol <span className="text-tertiary-text">Settlement</span></h1>
          <p className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em]">Inbound Payment Authentication</p>
        </div>

        <div className="card-premium bg-surface border border-border p-8 md:p-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
           
           {error && (
             <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-shake">
                <p className="text-xs font-black text-red-500 uppercase tracking-widest text-center">{error}</p>
             </div>
           )}
           
           {success && (
             <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl animate-fade-in">
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest text-center">{success}</p>
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2 group/field">
                  <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4 flex items-center gap-2 group-focus-within/field:text-primary transition-colors">
                    <FaCloudUploadAlt /> Payload Source
                  </label>
                  <div className="relative group/upload">
                    <input
                      type="file"
                      id="receipt"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    <label 
                      htmlFor="receipt" 
                      className="flex flex-col items-center justify-center w-full h-40 bg-surface-lighter border border-border border-dashed rounded-3xl cursor-pointer hover:bg-surface hover:border-primary transition-all group-hover/upload:shadow-xl"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <FaCloudUploadAlt className="w-10 h-10 mb-3 text-tertiary-text group-hover/upload:text-primary transition-colors" />
                        <p className="text-xs font-bold text-primary-text">
                          {file ? file.name : "Select Receipt Image"}
                        </p>
                        <p className="text-[8px] text-tertiary-text uppercase tracking-widest mt-2">{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : "PNG, JPG or PDF"}</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="relative group/field">
                    <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Total Receipt Amount (NGN)</span>
                    <input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-black text-lg"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group/field">
                      <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Credit (Savings)</span>
                      <input
                        type="number"
                        id="savingsAmount"
                        value={savingsAmount}
                        onChange={(e) => handleSavingsChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold text-sm"
                        required
                      />
                    </div>

                    <div className="relative group/field">
                      <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Debt Recovery (Loan)</span>
                      <input
                        type="number"
                        id="loanAmount"
                        value={loanAmount}
                        onChange={(e) => handleLoanChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-bold text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group/field">
                <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Protocol Annotations</span>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context for verification..."
                  className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-8 text-primary-text outline-none focus:border-primary transition-all font-medium h-32 resize-none"
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                 <FaShieldAlt className="text-primary h-5 w-5" />
                 <p className="text-[10px] font-bold text-tertiary-text uppercase tracking-widest leading-relaxed">By submitting, you certify that this receipt represents a valid transaction. Integrity violations result in account suspension.</p>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-5 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-none border-none disabled:opacity-50 transition-all duration-500 hover:tracking-[0.6em]"
                disabled={loading}
              >
                {loading ? 'Transmitting Data...' : 'Commit For Verification'}
              </button>
           </form>
        </div>
      </main>
    </div>
  );
}
