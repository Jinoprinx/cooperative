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

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Pending Payments</h1>
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Receipt</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction._id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{transaction.user.firstName} {transaction.user.lastName}</p>
                  <p className="text-gray-600 whitespace-no-wrap">{transaction.user.email}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">${transaction.amount.toFixed(2)}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{transaction.description}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <p className="text-gray-900 whitespace-no-wrap">{new Date(transaction.date).toLocaleDateString()}</p>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <a href={`${process.env.NEXT_PUBLIC_API_URL}/${transaction.receiptUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Receipt</a>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <button onClick={() => handleApprove(transaction._id)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2">Approve</button>
                  <button onClick={() => handleReject(transaction._id)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}