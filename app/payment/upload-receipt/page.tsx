'use client';

import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { useDashboardData } from '@/app/hooks/useDashboardData'; // Import useDashboardData

export default function UploadReceiptPage() {
  const { user } = useAuth();
  const { refetch: refetchDashboardData } = useDashboardData(); // Get refetch from useDashboardData
  const [file, setFile] = useState<File | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [loanReturnAmount, setLoanReturnAmount] = useState('');
  const [description, setDescription] = useState(''); // New state for description
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
    if (!file || (!depositAmount && !loanReturnAmount)) {
      setError('Please provide a receipt and at least one amount.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('receipt', file);

    if (depositAmount) {
      formData.append('depositAmount', depositAmount);
    }

    if (loanReturnAmount) {
      formData.append('loanReturnAmount', loanReturnAmount);
    }

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
      setDepositAmount('');
      setLoanReturnAmount('');
      setDescription(''); // Clear description after successful upload
      refetchDashboardData(); // Refetch dashboard data after successful upload
    } catch (err) {
      setError('Failed to upload receipt. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-md mt-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">Upload Payment Receipt</h1>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="receipt" className="block text-gray-700 text-sm font-bold mb-2">Payment Receipt:</label>
          <input
            type="file"
            id="receipt"
            onChange={handleFileChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="depositAmount" className="block text-gray-700 text-sm font-bold mb-2">Deposit Amount:</label>
          <input
            type="number"
            id="depositAmount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label htmlFor="loanReturnAmount" className="block text-gray-700 text-sm font-bold mb-2">Loan Return Amount:</label>
          <input
            type="number"
            id="loanReturnAmount"
            value={loanReturnAmount}
            onChange={(e) => setLoanReturnAmount(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows={3}
          />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 ease-in-out w-full" disabled={loading}>
          {loading ? 'Submitting...' : 'Send for Approval'}
        </button>
      </form>
    </main>
  );
}
