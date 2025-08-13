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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactionsResponse, membersResponse, loansResponse] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/members`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/loans`),
        ]);

        const combinedTransactions = [
          ...transactionsResponse.data,
          ...loansResponse.data.map((loan: any) => ({ ...loan, type: 'loan' }))
        ];

        setTransactions(combinedTransactions);
        setMembers(membersResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTransactions = transactions.filter(transaction => {
    const member = members.find(m => m._id === transaction.memberId);
    const searchString = searchQuery.toLowerCase();

    if (transaction.type === 'loan') {
      return (
        member?.firstName.toLowerCase().includes(searchString) ||
        member?.lastName.toLowerCase().includes(searchString) ||
        (transaction.purpose?.toLowerCase() || '').includes(searchString)
      );
    } else {
      return (
        member?.firstName.toLowerCase().includes(searchString) ||
        member?.lastName.toLowerCase().includes(searchString) ||
        (transaction.description?.toLowerCase() || '').includes(searchString)
      );
    }
  });

  const handleApproveTransaction = async (id: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${id}`, { status: 'approved' } as Partial<Transaction>);
      setTransactions(transactions.map(t => t._id === id ? { ...t, status: 'approved' } : t));
    } catch (error) {
      console.error('Error approving transaction:', error);
    }
  };

  const handleRejectTransaction = async (id: string) => {
    try {
      await axios.patch(`${process.env.NEXT_PUBLIC_API_URL}/api/transactions/${id}`, { status: 'rejected' } as Partial<Transaction>);
      setTransactions(transactions.map(t => t._id === id ? { ...t, status: 'rejected' } : t));
    } catch (error) {
      console.error('Error rejecting transaction:', error);
    }
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
      <div className="flex items-center">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by member or description"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-bordered w-full max-w-xs pl-10"
          />
        </div>
      </div>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Remaining Balance</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredTransactions.map((transaction) => {
                const member = members.find(m => m._id === (transaction.memberId || transaction.user));
                return (
                  <tr key={transaction._id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(transaction.date || transaction.createdAt || '')}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{member ? `${member.firstName} ${member.lastName}` : 'Unknown'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          transaction.type === 'deposit'
                            ? 'bg-green-100 text-green-800'
                            : transaction.type === 'withdrawal'
                            ? 'bg-red-100 text-red-800'
                            : transaction.type === 'loan'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatCurrency(transaction.amount)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{transaction.description || transaction.purpose}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          transaction.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : transaction.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{transaction.type === 'loan' ? formatCurrency(transaction.remainingAmount ?? 0) : '-'}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      {transaction.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveTransaction(transaction._id)} className="btn btn-success btn-sm mr-2">
                            Approve
                          </button>
                          <button onClick={() => handleRejectTransaction(transaction._id)} className="btn btn-error btn-sm">
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}