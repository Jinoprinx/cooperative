'use client';

import { useState, useEffect } from 'react';
import { FaHandHoldingUsd, FaCheckCircle, FaTimesCircle, FaHourglassHalf } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loan, Transaction } from '@/app/types';
import { useDashboardData } from '@/app/hooks/useDashboardData'; // Import useDashboardData

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { refetch: refetchDashboardData } = useDashboardData(); // Get refetch from useDashboardData

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const loansHistoryResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setLoans(loansHistoryResponse.data.history);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching loan data:', error);
        setError('Failed to load loan data. Please try again.');
        setLoading(false);
      }
    };
    fetchLoanData();
  }, [router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleApplyLoan = async () => {
    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      alert('Please enter a valid loan amount.');
      return;
    }
    if (!durationMonths || parseInt(durationMonths) <= 0) {
      alert('Please enter a valid loan duration in months.');
      return;
    }
    if (!purpose.trim()) {
      alert('Please enter the purpose of the loan.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/loans/apply`,
        { amount: parseFloat(loanAmount), purpose, durationMonths: parseInt(durationMonths) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Loan application submitted successfully!');
      setLoanAmount('');
      setPurpose('');
      setDurationMonths(''); // Clear durationMonths after successful application
      // Refresh loan data
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoans(response.data.history); // Use .history as per backend change
      refetchDashboardData(); // Refetch dashboard data after successful loan application
    } catch (error) {
      console.error('Error applying for loan:', error);
      const errorMessage = error.response?.data?.message || 'Failed to apply for loan. Please try again.';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="text-black">Loading loans history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <FaHourglassHalf className="text-yellow-500" />;
      case 'approved':
      case 'active':
        return <FaCheckCircle className="text-green-500" />;
      case 'rejected':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Loans</h1>
      {/* Apply for Loan */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-lg font-medium text-gray-800">Apply for Loan</h2>
        <div className="mt-4 space-y-4">
          <input
            type="number"
            placeholder="Loan Amount (NGN)"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            className="input input-bordered w-full"
          />
          <input
            type="number"
            placeholder="Loan Duration (Months)"
            value={durationMonths}
            onChange={(e) => setDurationMonths(e.target.value)}
            className="input input-bordered w-full"
          />
          <textarea
            placeholder="Purpose of Loan"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="textarea textarea-bordered w-full"
          />
          <button onClick={handleApplyLoan} className="btn btn-primary">
            <FaHandHoldingUsd className="mr-2" /> Apply
          </button>
        </div>
      </div>
      {/* Loan History */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-lg font-medium text-gray-800">Loan History</h2>
        <div className="overflow-x-auto mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {(loans || []).map((item) => (
                <tr key={item._id || item.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate('createdAt' in item ? item.createdAt : item.date)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {'purpose' in item ? `Loan Application: ${item.purpose}` : `Loan ${item.type === 'loan_disbursement' ? 'Disbursement' : 'Repayment'}`}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        item.status === 'approved' || item.status === 'active' || item.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : item.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                    {formatCurrency(item.amount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-500">
                    {'remainingAmount' in item ? formatCurrency(item.remainingAmount) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}