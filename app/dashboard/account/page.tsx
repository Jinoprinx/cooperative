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
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text">Loading account history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-red-500 font-bold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 text-primary-text">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Identity Control</span>
          <h1 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
            Account <span className="text-tertiary-text">Profile</span>
          </h1>
        </div>
        <div className="p-1 bg-surface rounded-2xl border border-border">
          <PayNowButton />
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-5 items-start">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-10">
          <div className="card-premium relative overflow-hidden group bg-surface">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <h2 className="text-xl font-black tracking-tighter mb-8 flex items-center gap-3 text-primary-text">
               <FaUserCircle className="text-primary" />
               Global Settings
            </h2>
            
            <div className="mb-10">
              <ProfileImageUpload setProfileImage={setProfileImage} />
            </div>

            <div className="space-y-6">
              <div className="relative group/field">
                 <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">First Name</span>
                 <input
                  type="text"
                  placeholder="First Name"
                  value={user?.firstName || ''}
                  onChange={(e) => updateUser(user ? { ...user, firstName: e.target.value } : user!)}
                  className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-8 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="relative group/field">
                 <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Last Name</span>
                 <input
                  type="text"
                  placeholder="Last Name"
                  value={user?.lastName || ''}
                  onChange={(e) => updateUser(user ? { ...user, lastName: e.target.value } : user!)}
                  className="w-full bg-surface-lighter border border-border rounded-2xl p-6 pt-8 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="relative group/field opacity-60">
                 <span className="absolute top-2 left-6 text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em]">Registry ID</span>
                 <input
                  type="text"
                  placeholder="Account Number"
                  value={user?.accountNumber || ''}
                  disabled
                  className="w-full bg-background border border-border rounded-2xl p-6 pt-8 text-primary-text/50 text-sm outline-none cursor-not-allowed font-mono"
                />
              </div>
              
              <button 
                onClick={handleUpdateSettings} 
                className="w-full btn-primary py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-none border-none hover:tracking-[0.6em] transition-all duration-500"
              >
                Snapshot Updates
              </button>
            </div>
          </div>

          {/* Auto Payments */}
          <div className="card-premium bg-surface border border-emerald-500/20">
            <h2 className="text-xl font-black tracking-tighter mb-8 flex items-center gap-3 text-primary-text">
               <FaMoneyBillWave className="text-emerald-500" />
               Auto-Settlement
            </h2>
            <div className="space-y-4">
               <input
                 type="text"
                 placeholder="Beneficiary Bank"
                 value={bankName}
                 onChange={(e) => setBankName(e.target.value)}
                 className="w-full bg-surface-lighter border border-border rounded-xl py-4 px-6 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold"
               />
               <input
                 type="text"
                 placeholder="Routing Account Number"
                 value={accountNumber}
                 onChange={(e) => setAccountNumber(e.target.value)}
                 className="w-full bg-surface-lighter border border-border rounded-xl py-4 px-6 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-mono font-bold"
               />
               <button 
                 onClick={handleSetupAutoPayment} 
                 className="w-full py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all"
               >
                 Bind Financial Protocol
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: Activity */}
        <div className="lg:col-span-3">
          <div className="card-premium p-0 overflow-hidden relative bg-surface">
            <div className="p-10 border-b border-border bg-surface">
              <h2 className="text-2xl font-black text-primary-text tracking-tighter">Recent Movements</h2>
              <p className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mt-2">Latest Protocol Events</p>
            </div>
            
            <div className="overflow-x-auto min-h-[500px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-lighter">
                    <th className="px-10 py-5 text-[10px] font-black text-tertiary-text uppercase tracking-widest">Event Snapshot</th>
                    <th className="px-10 py-5 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-center">Protocol Status</th>
                    <th className="px-10 py-5 text-[10px] font-black text-tertiary-text uppercase tracking-widest text-right">Value Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accountActivity.map((activity) => (
                    <tr key={activity._id} className="group hover:bg-surface-lighter transition-colors">
                      <td className="px-10 py-8">
                         <div className="flex flex-col">
                           <span className="text-xs font-bold text-primary-text group-hover:text-primary transition-colors">{activity.description}</span>
                           <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest mt-1">{formatDate(activity.date)}</span>
                         </div>
                      </td>
                      <td className="px-10 py-8 text-center uppercase">
                         <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black tracking-widest border ${
                           activity.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                           'bg-amber-500/10 border-amber-500/20 text-amber-500'
                         }`}>
                           {activity.status || 'Verified'}
                         </span>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <span className={`text-lg font-black tracking-tighter ${['deposit', 'loan_disbursement'].includes(activity.type) ? 'text-emerald-500 shadow-glow-sm' : 'text-primary-text'}`}>
                           {['deposit', 'loan_disbursement'].includes(activity.type) ? '+' : '-'} {formatCurrency(activity.amount)}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {accountActivity.length === 0 && (
                    <tr>
                       <td colSpan={3} className="py-32 text-center bg-surface">
                          <p className="text-tertiary-text text-[10px] font-black uppercase tracking-[0.4em] italic">No detected account activity</p>
                       </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}