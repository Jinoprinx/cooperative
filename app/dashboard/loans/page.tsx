'use client';

import { useState, useEffect } from 'react';
import { FaHandHoldingUsd, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaPlus, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Loan, Transaction, User } from '@/app/types';
import { useDashboardData } from '@/app/hooks/useDashboardData';

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loanAmount, setLoanAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [sureties, setSureties] = useState<{ phone: string; name: string; found: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { refetch: refetchDashboardData } = useDashboardData();

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
    if (sureties.length < 1) {
      alert('You need at least one surety to apply for a loan.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const suretyIds = sureties.map(s => s.phone);

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/loans/apply`,
        { amount: parseFloat(loanAmount), purpose, durationMonths: parseInt(durationMonths), sureties: suretyIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Loan application submitted successfully! Your surety requests have been sent.');
      setLoanAmount('');
      setPurpose('');
      setDurationMonths('');
      setSureties([]);
      // Refresh loan data
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoans(response.data.history);
      refetchDashboardData();
    } catch (error: any) {
      console.error('Error applying for loan:', error);
      const errorMessage = error.response?.data?.message || 'Failed to apply for loan. Please try again.';
      alert(errorMessage);
    }
  };

  const handleSuretyChange = async (index: number, phone: string) => {
    const newSureties = [...sureties];
    newSureties[index].phone = phone;
    newSureties[index].name = '';
    newSureties[index].found = false;

    if (phone.length === 11) { // Only search when the phone number has 11 digits
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/search?phone=${phone}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data) {
          newSureties[index].name = response.data.name;
          newSureties[index].found = true;
        }
      } catch (error) {
        console.error('Error searching for member:', error);
        newSureties[index].name = 'Member not found';
      }
    }
    setSureties(newSureties);
  };

  const addSurety = () => {
    if (sureties.length < 5) { // Limit to 5 sureties
      setSureties([...sureties, { phone: '', name: '', found: false }]);
    }
  };

  const removeSurety = (index: number) => {
    const newSureties = sureties.filter((_, i) => i !== index);
    setSureties(newSureties);
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
          {/* Sureties */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sureties (at least 2)</label>
            {sureties.map((surety, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="tel"
                  placeholder="Surety Phone Number"
                  value={surety.phone}
                  onChange={(e) => handleSuretyChange(index, e.target.value)}
                  className="input input-bordered w-full"
                />
                <span className={`text-sm ${surety.found ? 'text-green-600' : 'text-red-600'}`}>{surety.name}</span>
                <button onClick={() => removeSurety(index)} className="btn btn-ghost btn-sm">
                  <FaTrash className="text-red-500" />
                </button>
              </div>
            ))}
            {sureties.length < 5 && (
              <button onClick={addSurety} className="btn btn-outline btn-sm">
                <FaPlus className="mr-2" /> Add Surety
              </button>
            )}
          </div>
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
                <tr key={item._id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(item.startDate || item.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {`Loan Application: ${item.purpose}`}
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