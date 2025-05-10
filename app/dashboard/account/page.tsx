'use client';

import { useState, useEffect } from 'react';
import { FaUserCircle, FaMoneyBillWave } from 'react-icons/fa';
import { mockUserData, mockTransactions } from '@/app/types'; // Shared mock data

export default function Account() {
  const [user, setUser] = useState(mockUserData);
  const [accountActivity, setAccountActivity] = useState(mockTransactions);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetching
    const fetchAccountData = async () => {
      try {
        // In a real app: fetch('/api/account') and fetch('/api/transactions')
        setLoading(false);
      } catch (error) {
        console.error('Error fetching account data:', error);
        setLoading(false);
      }
    };
    fetchAccountData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleUpdateSettings = () => {
    // In a real app, send PATCH request to '/api/account/settings'
    console.log('Updated Settings:', user);
  };

  const handleSetupAutoPayment = () => {
    // In a real app, send POST request to '/api/account/autopay'
    console.log('Auto Payment Setup:', { bankName, accountNumber });
    setBankName('');
    setAccountNumber('');
  };

  if (loading) {
    return (
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
            <p>Loading account...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Account</h1>
        {/* Account Activity */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-medium text-gray-800">Account Activity</h2>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {accountActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(activity.date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{activity.description}</td>
                    <td
                      className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${
                        activity.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {activity.type === 'deposit' ? '+' : '-'} {formatCurrency(activity.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Account Settings */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-medium text-gray-800">Account Settings</h2>
          <div className="mt-4 space-y-4">
            <input
              type="text"
              placeholder="First Name"
              value={user.firstName}
              onChange={(e) => setUser({ ...user, firstName: e.target.value })}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={user.lastName}
              onChange={(e) => setUser({ ...user, lastName: e.target.value })}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Account Number"
              value={user.accountNumber}
              disabled
              className="input input-bordered w-full bg-gray-100"
            />
            <button onClick={handleUpdateSettings} className="btn btn-primary">
              <FaUserCircle className="mr-2" /> Save Changes
            </button>
          </div>
        </div>
        {/* Auto Payments */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h2 className="text-lg font-medium text-gray-800">Setup Auto Payments</h2>
          <div className="mt-4 space-y-4">
            <input
              type="text"
              placeholder="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="input input-bordered w-full"
            />
            <input
              type="text"
              placeholder="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="input input-bordered w-full"
            />
            <button onClick={handleSetupAutoPayment} className="btn btn-primary">
              <FaMoneyBillWave className="mr-2" /> Connect Bank Account
            </button>
          </div>
        </div>
      </div>
  );
}