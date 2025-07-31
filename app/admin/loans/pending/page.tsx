
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheck, FaTimes } from 'react-icons/fa';

interface User {
  firstName: string;
  lastName: string;
  accountNumber: string;
}

interface Loan {
  _id: string;
  user: User;
  amount: number;
  purpose: string;
  createdAt: string;
}

export default function PendingLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/pending`, config);
      setLoans(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching pending loans:', error);
      setError('Failed to load pending loans. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingLoans();
  }, []);

  const handleLoanAction = async (loanId: string, status: 'approved' | 'rejected') => {
    console.log('Attempting to update loan with ID:', loanId); // Add this line for debugging
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/status`, { status }, config);
      // Refresh the list of pending loans
      fetchPendingLoans();
    } catch (error) {
      console.error(`Error ${status === 'approved' ? 'approving' : 'rejecting'} loan:`, error);
      alert(`Failed to ${status} loan. Please try again.`);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Pending Loan Applications</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Member
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purpose
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Applied
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loans.map((loan) => (
              <tr key={loan._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{loan.user.firstName} {loan.user.lastName}</div>
                  <div className="text-sm text-gray-500">{loan.user.accountNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(loan.amount)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{loan.purpose}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-500">
                    {new Date(loan.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleLoanAction(loan._id, 'approved')}
                    className="text-green-600 hover:text-green-900 mr-4"
                  >
                    <FaCheck />
                  </button>
                  <button
                    onClick={() => handleLoanAction(loan._id, 'rejected')}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FaTimes />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
