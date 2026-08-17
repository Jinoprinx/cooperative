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
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-20 text-primary-text w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 sm:gap-4 md:gap-6 w-full min-w-0">
        <div className="min-w-0">
          <span className="text-primary text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] mb-1 sm:mb-1.5 block">Identity Control</span>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-primary-text tracking-tighter truncate">
            Account <span className="text-tertiary-text">Profile</span>
          </h1>
        </div>
        <div className="p-1 bg-surface rounded-xl sm:rounded-2xl border border-border w-full sm:w-auto shrink-0 min-w-0">
          <PayNowButton />
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:gap-8 lg:gap-10 lg:grid-cols-5 items-start w-full min-w-0 max-w-full">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 md:space-y-8 w-full min-w-0 max-w-full">
          <div className="card-premium relative overflow-hidden group bg-surface border border-border w-full min-w-0 max-w-full">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tighter mb-4 sm:mb-6 md:mb-8 flex items-center gap-2.5 sm:gap-3 text-primary-text">
               <FaUserCircle className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
               Global Settings
            </h2>
            
            <div className="mb-4 sm:mb-6 md:mb-8">
              <ProfileImageUpload setProfileImage={setProfileImage} />
            </div>

            <div className="space-y-3 sm:space-y-4 md:space-y-6 w-full min-w-0">
              <div className="relative group/field min-w-0">
                 <span className="absolute top-2 left-3 sm:left-4 md:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">First Name</span>
                 <input
                  type="text"
                  placeholder="First Name"
                  value={user?.firstName || ''}
                  onChange={(e) => updateUser(user ? { ...user, firstName: e.target.value } : user!)}
                  className="w-full bg-surface-lighter border border-border rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 pt-6 sm:pt-7 md:pt-8 text-primary-text text-xs sm:text-sm outline-none focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="relative group/field min-w-0">
                 <span className="absolute top-2 left-3 sm:left-4 md:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em] group-focus-within/field:text-primary transition-colors">Last Name</span>
                 <input
                  type="text"
                  placeholder="Last Name"
                  value={user?.lastName || ''}
                  onChange={(e) => updateUser(user ? { ...user, lastName: e.target.value } : user!)}
                  className="w-full bg-surface-lighter border border-border rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 pt-6 sm:pt-7 md:pt-8 text-primary-text text-xs sm:text-sm outline-none focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="relative group/field opacity-60 min-w-0">
                 <span className="absolute top-2 left-3 sm:left-4 md:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em]">Registry ID (Member ID)</span>
                 <input
                  type="text"
                  placeholder="Member ID"
                  value={user?.memberIdentifier || 'N/A'}
                  disabled
                  className="w-full bg-background border border-border rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 pt-6 sm:pt-7 md:pt-8 text-primary-text/50 text-xs sm:text-sm outline-none cursor-not-allowed font-mono font-bold truncate"
                />
              </div>
              <div className="relative group/field opacity-60 min-w-0">
                 <span className="absolute top-2 left-3 sm:left-4 md:left-6 text-[7px] sm:text-[8px] font-black text-tertiary-text uppercase tracking-[0.2em]">Cooperative Account Number</span>
                 <input
                  type="text"
                  placeholder="Account Number"
                  value={user?.accountNumber || ''}
                  disabled
                  className="w-full bg-background border border-border rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 pt-6 sm:pt-7 md:pt-8 text-primary-text/50 text-xs sm:text-sm outline-none cursor-not-allowed font-mono font-bold truncate"
                />
              </div>
              
              <button 
                onClick={handleUpdateSettings} 
                className="w-full btn-primary py-3.5 sm:py-4 md:py-5 rounded-lg sm:rounded-xl md:rounded-2xl text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-none border-none transition-all duration-500"
              >
                Approve Updates
              </button>
            </div>
          </div>

          {/* Auto Payments */}
          <div className="card-premium bg-surface border border-emerald-500/20 w-full min-w-0 max-w-full">
            <h2 className="text-base sm:text-lg md:text-xl font-black tracking-tighter mb-4 sm:mb-6 md:mb-8 flex items-center gap-2.5 sm:gap-3 text-primary-text">
               <FaMoneyBillWave className="text-emerald-500 h-4 w-4 sm:h-5 sm:w-5" />
               Auto-Monthly-Payment
            </h2>
            <div className="space-y-2.5 sm:space-y-3 md:space-y-4 w-full min-w-0">
               <input
                 type="text"
                 placeholder="Beneficiary Bank"
                 value={bankName}
                 onChange={(e) => setBankName(e.target.value)}
                 className="w-full bg-surface-lighter border border-border rounded-lg sm:rounded-xl py-2.5 sm:py-3.5 px-3 sm:px-5 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold"
               />
               <input
                 type="text"
                 placeholder="Account Number"
                 value={accountNumber}
                 onChange={(e) => setAccountNumber(e.target.value)}
                 className="w-full bg-surface-lighter border border-border rounded-lg sm:rounded-xl py-2.5 sm:py-3.5 px-3 sm:px-5 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-mono font-bold"
               />
               <button 
                 onClick={handleSetupAutoPayment} 
                 className="w-full py-3 sm:py-3.5 md:py-4 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] md:text-xs font-black uppercase tracking-wider border border-emerald-500/20 transition-all"
               >
                 Approve Auto Payment
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: Activity */}
        <div className="lg:col-span-3 w-full min-w-0 max-w-full">
          <div className="card-premium p-0 overflow-hidden relative bg-surface border border-border w-full min-w-0 max-w-full">
            <div className="p-3.5 sm:p-5 md:p-8 lg:p-10 border-b border-border bg-surface">
              <h2 className="text-lg sm:text-xl md:text-2xl font-black text-primary-text tracking-tighter">Recent Activities</h2>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider mt-0.5 sm:mt-1">Latest Account Events</p>
            </div>
            
            <div className="overflow-x-auto min-h-[300px] w-full max-w-full">
              <table className="w-full text-left border-collapse min-w-[420px] sm:min-w-full">
                <thead>
                  <tr className="border-b border-border bg-surface-lighter/50">
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider">Event Date</th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider text-center">Event Status</th>
                    <th className="px-3 sm:px-5 lg:px-8 py-3 sm:py-4 text-[8px] sm:text-[9px] md:text-[10px] font-black text-tertiary-text uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accountActivity.map((activity) => (
                    <tr key={activity._id} className="group hover:bg-surface-lighter transition-colors">
                      <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5">
                         <div className="flex flex-col max-w-[140px] sm:max-w-xs min-w-0">
                           <span className="text-xs sm:text-sm font-bold text-primary-text group-hover:text-primary transition-colors truncate">{activity.description}</span>
                           <span className="text-[8px] sm:text-[9px] font-black text-tertiary-text uppercase tracking-wider mt-0.5">{formatDate(activity.date)}</span>
                         </div>
                      </td>
                      <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 text-center uppercase whitespace-nowrap">
                         <span className={`inline-flex px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[7px] sm:text-[8px] md:text-[9px] font-black tracking-wider border ${
                           activity.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                           'bg-amber-500/10 border-amber-500/20 text-amber-500'
                         }`}>
                           {activity.status || 'Verified'}
                         </span>
                      </td>
                      <td className="px-3 sm:px-5 lg:px-8 py-3 sm:py-5 text-right whitespace-nowrap">
                         <span className={`text-xs sm:text-sm md:text-base lg:text-lg font-black tracking-tight ${['deposit', 'loan_disbursement'].includes(activity.type) ? 'text-emerald-500 shadow-glow-sm' : 'text-primary-text'}`}>
                           {['deposit', 'loan_disbursement'].includes(activity.type) ? '+' : '-'} {formatCurrency(activity.amount)}
                         </span>
                      </td>
                    </tr>
                  ))}
                  {accountActivity.length === 0 && (
                    <tr>
                       <td colSpan={3} className="py-16 text-center bg-surface">
                          <p className="text-tertiary-text text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic">No detected account activity</p>
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