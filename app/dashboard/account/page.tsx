'use client';

import { useState, useEffect } from 'react';
import { FaUserCircle, FaMoneyBillWave } from 'react-icons/fa';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Transaction } from '@/app/types';
import ProfileImageUpload from '@/app/components/auth/ProfileImageUpload';
import { useAuth } from '@/app/context/AuthContext';
import dynamic from 'next/dynamic';

const PayNowButton = dynamic(() => import('@/app/components/PayNowButton'), { ssr: false });

export default function Account() {
  const { user, loading, isAuthenticated, updateUser } = useAuth();
  const [accountActivity, setAccountActivity] = useState<Transaction[]>([]);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const fetchAccountActivity = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const transactionsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions/history`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 5 },
        });
        setAccountActivity(transactionsResponse.data.transactions);
      } catch (error) {
        console.error('Error fetching account activity:', error);
        setError('Failed to load account activity. Please try again.');
      }
    };

    if (isAuthenticated) {
      fetchAccountActivity();
    }
  }, [loading, isAuthenticated, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleUpdateSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/profile`,
        { firstName: user.firstName, lastName: user.lastName, profileImage },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    }
  };

  const handleSetupAutoPayment = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/account/autopay`,
        { bankName, accountNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Auto payment setup successfully!');
      setBankName('');
      setAccountNumber('');
    } catch (error) {
      console.error('Error setting up auto payment:', error);
      alert('Failed to setup auto payment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          < p className="text-black">Loading account history...</p>
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Account</h1>
      <div className="mb-4">
        <PayNowButton />
      </div>
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
                      ['deposit', 'loan_disbursement'].includes(activity.type) ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {['deposit', 'loan_disbursement'].includes(activity.type) ? '+' : '-'} {formatCurrency(activity.amount)}
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
        <div className="mt-4">
          <ProfileImageUpload setProfileImage={setProfileImage} />
        </div>
        <div className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="First Name"
            value={user?.firstName || ''}
            onChange={(e) => updateUser(user ? { ...user, firstName: e.target.value } : user!)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={user?.lastName || ''}
            onChange={(e) => updateUser(user ? { ...user, lastName: e.target.value } : user!)}
            className="input input-bordered w-full"
          />
          <input
            type="text"
            placeholder="Account Number"
            value={user?.accountNumber || ''}
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