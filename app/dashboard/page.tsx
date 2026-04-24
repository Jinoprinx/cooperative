'use client';

import { FaMoneyBillWave, FaHistory, FaArrowUp, FaArrowDown, FaHandHoldingUsd, FaUserCircle, FaBell, FaTimes } from 'react-icons/fa';
import Link from 'next/link';
import { useUser } from '@/app/hooks/useUser';
import { useDashboardData } from '@/app/hooks/useDashboardData';
import PayNowButton from '../components/PayNowButton';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  type: string;
}

export default function Dashboard() {
  const { user, loading: userLoading, error: userError } = useUser();
  const { transactions, activeLoan, summary, loading: dataLoading, error: dataError } = useDashboardData();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      } finally {
        setNotifLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markNotificationAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  };

  const loading = userLoading || dataLoading;
  const error = userError || dataError;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text">Loading dashboard...</p>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Personal Ledger</span>
          <h1 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
            Member <span className="text-tertiary-text">Hub</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-tertiary-text text-[10px] font-black uppercase tracking-widest leading-none mb-1">Status</span>
            <span className="text-emerald-500 text-xs font-bold flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Member
            </span>
          </div>
        </div>
      </div>

      {/* Notifications Banner */}
      {notifications.filter(n => !n.isRead).length > 0 && (
        <div className="space-y-4">
          {notifications.filter(n => !n.isRead).map(notification => (
            <div key={notification._id} className="relative group overflow-hidden">
               <div className={`absolute inset-0 opacity-10 blur-xl group-hover:opacity-20 transition-opacity ${
                 notification.type === 'success' ? 'bg-emerald-500' : notification.type === 'alert' ? 'bg-amber-500' : 'bg-primary'
               }`} />
               <div className={`relative flex items-center justify-between p-6 glass-card border border-border rounded-[2rem] border-l-4 ${
                 notification.type === 'success' ? 'border-emerald-500' : notification.type === 'alert' ? 'border-amber-500' : 'border-primary'
               }`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    notification.type === 'success' ? 'bg-emerald-500/20 text-emerald-500' : 
                    notification.type === 'alert' ? 'bg-amber-500/20 text-amber-500' : 
                    'bg-primary/20 text-primary'
                  }`}>
                    <FaBell className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-primary-text">{notification.message}</p>
                </div>
                <button
                  onClick={() => markNotificationAsRead(notification._id)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface border border-border text-tertiary-text hover:text-primary-text transition-all"
                >
                  <FaTimes className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Account Balance Card */}
        <div className="card-premium group relative overflow-hidden bg-surface">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest leading-none mb-1">Savings Balance</p>
              <h3 className="text-3xl font-black text-primary-text tracking-tighter shadow-glow-sm">{formatCurrency(user?.accountBalance || 0)}</h3>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <FaMoneyBillWave className="h-6 w-6" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-tertiary-text/40 text-[10px] font-black uppercase tracking-widest mb-1">Account Identifier</span>
            <p className="text-sm font-mono font-bold text-secondary-text tracking-wider">{user?.accountNumber}</p>
          </div>
        </div>

        {/* Loan Summary Card */}
        {activeLoan ? (
          <div className="card-premium group relative overflow-hidden bg-surface border-red-500/20">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-red-500/10 rounded-full blur-3xl group-hover:bg-red-500/20 transition-all duration-700" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest leading-none mb-1">Outstanding Loan</p>
                <h3 className="text-3xl font-black text-red-500 tracking-tighter">{formatCurrency(activeLoan.remainingAmount)}</h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform duration-500">
                <FaHandHoldingUsd className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest mb-1">Next Payment Due</span>
                  <span className="text-sm font-bold text-secondary-text">{activeLoan.nextPaymentDate ? formatDate(activeLoan.nextPaymentDate) : 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest mb-1">Amount Due</span>
                  <p className="text-sm font-black text-primary-text">{formatCurrency(activeLoan.monthlyPayment)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-surface-lighter rounded-full overflow-hidden border border-border">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(activeLoan.amountPaid / activeLoan.totalRepayment) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-tertiary-text">
                  <span>Paid: {formatCurrency(activeLoan.amountPaid)}</span>
                  <span>Total: {formatCurrency(activeLoan.totalRepayment)}</span>
                </div>
              </div>
              <Link href="/dashboard/loans" className="block text-center text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest pt-2">View Loan Progression</Link>
            </div>
          </div>
        ) : (
          <div className="card-premium group relative overflow-hidden bg-surface border-emerald-500/20 flex flex-col justify-center items-center text-center">
             <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4">
                <FaHandHoldingUsd className="h-8 w-8" />
             </div>
             <p className="text-primary-text font-bold text-sm mb-1">No Active Loans</p>
             <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest">Apply for funding today</p>
             <Link href="/dashboard/loans" className="mt-6 btn-primary bg-emerald-600 hover:bg-emerald-500 px-8 text-xs py-2 shadow-none border-none">Get Started</Link>
          </div>
        )}

        {/* Activity Summary Card */}
        <div className="card-premium group relative overflow-hidden bg-surface">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">Quick Snapshot</h2>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <FaHistory className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-surface-lighter rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/10">
                  <FaArrowUp className="h-3 w-3" />
                </div>
                <span className="text-xs font-bold text-secondary-text">Last Deposit</span>
              </div>
              <span className="text-sm font-black text-emerald-500">{formatCurrency(summary.lastDepositAmount || 0)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-lighter rounded-2xl border border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/10">
                  <FaArrowDown className="h-3 w-3" />
                </div>
                <span className="text-xs font-bold text-secondary-text">Debt Exposure</span>
              </div>
              <span className="text-sm font-black text-red-500">{activeLoan ? formatCurrency(activeLoan.remainingAmount) : formatCurrency(0)}</span>
            </div>
            <Link href="/dashboard/transactions" className="block text-center text-[10px] font-black text-primary hover:text-primary-text uppercase tracking-widest transition-colors">See Complete History</Link>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Transactions Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card-premium p-0 overflow-hidden bg-surface">
            <div className="p-8 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-primary-text tracking-tight">Financial Feed</h2>
                <p className="text-tertiary-text text-xs font-medium uppercase tracking-widest mt-1">Transaction Stream</p>
              </div>
              <Link href="/dashboard/transactions" className="btn-secondary px-6 py-2 text-xs border border-border">Full History</Link>
            </div>
            <div className="divide-y divide-border">
              {transactions.slice(0, 5).map((transaction) => {
                const isCredit = ['deposit', 'loan_disbursement'].includes(transaction.type);
                return (
                  <div key={transaction._id} className="p-6 flex items-center justify-between hover:bg-surface-lighter transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                        isCredit 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                          : 'bg-red-500/10 border-red-500/20 text-red-500 group-hover:bg-red-500/20 shadow-lg shadow-red-500/5'
                      }`}>
                        {transaction.type === 'deposit' ? <FaArrowUp className="h-5 w-5" /> : 
                         transaction.type === 'loan_repayment' ? <FaHandHoldingUsd className="h-5 w-5" /> :
                         <FaArrowDown className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-primary-text group-hover:text-primary transition-colors">{transaction.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase tracking-widest ${
                            transaction.type === 'deposit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                            transaction.type === 'withdrawal' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-500'
                          }`}>
                            {transaction.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-tertiary-text font-bold">{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black tracking-tighter ${isCredit ? 'text-emerald-500 shadow-glow-sm' : 'text-primary-text'}`}>
                        {isCredit ? '+' : '-'} {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {transactions.length === 0 && (
                <div className="p-12 text-center text-tertiary-text italic text-sm font-medium">No recorded movements found.</div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-8">
          <div className="card-premium bg-surface border-border p-8">
            <h2 className="text-xl font-black text-primary-text tracking-tighter mb-6 underline decoration-primary/30 decoration-4 underline-offset-8">Payment Core</h2>
            <div className="p-1 bg-surface-lighter rounded-[2.5rem] border border-border mb-8 shadow-inner">
               <PayNowButton />
            </div>
            <div className="space-y-4">
               <Link href="/dashboard/loans" className="flex items-center gap-4 p-4 bg-surface-lighter rounded-3xl border border-border hover:border-primary/30 group transition-all duration-300">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                    <FaHandHoldingUsd className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary-text leading-none mb-1">Apply for Loan</p>
                    <p className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">Growth Capital</p>
                  </div>
               </Link>
               <Link href="/dashboard/account" className="flex items-center gap-4 p-4 bg-surface-lighter rounded-3xl border border-border hover:border-emerald-500/30 group transition-all duration-300">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                    <FaArrowUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary-text leading-none mb-1">Auto-Payment</p>
                    <p className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">Set & Forget</p>
                  </div>
               </Link>
               <Link href="/dashboard/account" className="flex items-center gap-4 p-4 bg-surface-lighter rounded-3xl border border-border hover:border-purple-500/30 group transition-all duration-300">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                    <FaUserCircle className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary-text leading-none mb-1">Account Secure</p>
                    <p className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">Verify Details</p>
                  </div>
               </Link>
            </div>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border border-border text-center bg-surface">
            <p className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Support Hub</p>
            <p className="text-sm font-medium text-secondary-text mb-6">Need assistance with your financial records?</p>
            <Link href="mailto:support@coop.com" className="btn-secondary w-full py-3 text-xs tracking-widest font-black rounded-2xl block border border-border">Contact Desk</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
