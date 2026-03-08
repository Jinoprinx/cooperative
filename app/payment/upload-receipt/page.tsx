'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { useDashboardData } from '@/app/hooks/useDashboardData'; // Import useDashboardData

export default function UploadReceiptPage() {
  const { user } = useAuth();
  const { refetch: refetchDashboardData } = useDashboardData();
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState<'deposit' | 'loan_repayment'>('deposit');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !amount) {
      setError('Please provide a receipt and an amount.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('receipt', file);
    formData.append('amount', amount);
    formData.append('purpose', purpose);

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
      setDescription('');
      refetchDashboardData();
    } catch (err) {
      setError('Failed to upload receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-lg mx-auto bg-surface border border-border rounded-xl shadow-2xl mt-8">
      <h1 className="text-2xl font-bold mb-6 text-white text-center">Upload Payment Receipt</h1>

      {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg relative mb-4" role="alert">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-lg relative mb-4" role="alert">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="receipt" className="block text-white/70 text-sm font-bold mb-2">Payment Receipt:</label>
          <input
            type="file"
            id="receipt"
            onChange={handleFileChange}
            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="purpose" className="block text-white/70 text-sm font-bold mb-2">Purpose of Payment:</label>
          <select
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as 'deposit' | 'loan_repayment')}
            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
          >
            <option value="deposit">Deposit (Savings)</option>
            <option value="loan_repayment">Loan Refund</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="block text-white/70 text-sm font-bold mb-2">Amount (must match receipt):</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-white/70 text-sm font-bold mb-2">Description (Optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details..."
            className="w-full bg-background border border-border rounded-lg py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition duration-300 ease-in-out w-full disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Send for Approval'}
        </button>
      </form>
    </main>
  );
}
