'use client';

import { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { mockTransactions} from "@/app/types";

export default function Transactions() {
  const [transactions, setTransactions] = useState(mockTransactions);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState(mockTransactions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetching
    const fetchTransactions = async () => {
      try {
        // In a real app: const response = await fetch('/api/transactions');
        // setTransactions(await response.json());
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleFilter = () => {
    const filtered = transactions.filter((t) => {
      const date = new Date(t.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (!start || date >= start) && (!end || date <= end);
    });
    setFilteredTransactions(filtered);
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
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        {/* Filter Section */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input input-bordered w-full md:w-auto"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input input-bordered w-full md:w-auto"
            />
            <button onClick={handleFilter} className="btn btn-primary">
              <FaSearch className="mr-2" /> Search
            </button>
          </div>
        </div>
        {/* Transactions Table */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(transaction.date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{transaction.description}</td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          transaction.type === 'deposit'
                            ? 'bg-green-100 text-green-800'
                            : transaction.type === 'withdrawal'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {transaction.type === 'deposit'
                          ? 'Deposit'
                          : transaction.type === 'withdrawal'
                          ? 'Withdrawal'
                          : 'Loan Repayment'}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${
                        transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'deposit' ? '+' : '-'} {formatCurrency(transaction.amount)}
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