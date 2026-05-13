'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FaUsers,
  FaMoneyBillWave,
  FaChartLine,
  FaHandshake,
  FaArrowUp,
  FaArrowDown,
  FaUserPlus,
  FaLock,
  FaLockOpen,
  FaExclamationTriangle,
  FaUserShield
} from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import axios from 'axios';
import { Stats, Member, Loan } from '@/app/types';
import { RecentMember, PendingLoan, PendingPayment } from './types';
import PayNowButton from '@/app/components/PayNowButton';
import { FaHandHoldingUsd } from 'react-icons/fa';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast'; // Assuming react-hot-toast is available or similar

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<Member[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user, isMainAdmin } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [verifyingPin, setVerifyingPin] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [showSuretyErrorModal, setShowSuretyErrorModal] = useState(false);
  const [suretyErrorMessage, setSuretyErrorMessage] = useState('');
  const [showLoanRejectionModal, setShowLoanRejectionModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [loanRejectionReason, setLoanRejectionReason] = useState('');
  const [rejectingLoan, setRejectingLoan] = useState(false);
  const [showRegistrationApprovalModal, setShowRegistrationApprovalModal] = useState(false);
  const [selectedRegistrationId, setSelectedRegistrationId] = useState<string | null>(null);
  const [initialDepositAmount, setInitialDepositAmount] = useState('');
  const [initialLoanBalance, setInitialLoanBalance] = useState('');
  const [approvingRegistration, setApprovingRegistration] = useState(false);

  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (paymentStatus === 'success') {
      toast.success('Subscription payment successful!', {
        duration: 5000,
        position: 'top-center',
      });
      // Optionally clean up the URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [paymentStatus]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in.');
          setLoading(false);
          return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        // Fetch members for recent members
        const membersResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/members`, config);
        const members: Member[] = membersResponse.data.members;
        const sortedMembers = members
          .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
          .slice(0, 3);
        setRecentMembers(sortedMembers);

        // Fetch loans for pending loans
        const loansResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/loans/pending`, config);
        const loans: Loan[] = loansResponse.data;
        const pending = loans
          .filter(loan => loan.status === 'pending')
          .slice(0, 3)
          .map(loan => ({
            ...loan,
            // Use populated user from loan object if available, otherwise fallback to member search
            user: (typeof loan.user === 'object' && loan.user !== null)
              ? loan.user
              : (members.find(m => m._id === (loan.memberId || loan.user)) || { _id: '', firstName: 'Unknown', lastName: '', accountNumber: '' }),
            createdAt: loan.createdAt || new Date().toISOString().split('T')[0],
          }));
        setPendingLoans(pending);

        // Fetch stats
        const statsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/stats`, config);
        setStats(statsResponse.data);

        // Fetch recent transactions
        const transactionsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, config);
        const allTransactions = transactionsResponse.data.map((t: any) => ({ ...t, type: t.type || 'transaction' }));

        const allLoans = loans.map((l: any) => ({ ...l, type: 'loan' }));

        const combined = [...allTransactions, ...allLoans]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setRecentTransactions(combined);

        // Fetch pending payments
        const pendingPaymentsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/pending-payments`, config);
        setPendingPayments(pendingPaymentsResponse.data.pendingPayments);

        // Fetch pending registrations
        const pendingRegistrationsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/registrations/pending`, config);
        setPendingRegistrations(pendingRegistrationsResponse.data);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
          <div className="text-center">
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-202 border-t-primary animate-spin"></div>
          <p className="text-tertiary-text font-medium tracking-widest uppercase text-xs">Initializing Intelligence...</p>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handlePaySubscription = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/billing/initialize`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      }
    } catch (err: any) {
      console.error('Payment Error:', err);
      setError(err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions/approve/${paymentId}`,
        {},
        config
      );

      setPendingPayments((prevPayments) =>
        prevPayments.filter((payment) => payment._id !== paymentId)
      );
    } catch (error) {
      console.error("Error approving payment:", error);
      setError("Failed to approve payment. Please try again.");
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPaymentId || !rejectionReason.trim()) return;

    setRejecting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions/reject/${selectedPaymentId}`,
        { rejectionReason },
        config
      );

      setPendingPayments((prevPayments) =>
        prevPayments.filter((payment) => payment._id !== selectedPaymentId)
      );
      setShowRejectionModal(false);
      setRejectionReason('');
      setSelectedPaymentId(null);
    } catch (error) {
      console.error("Error rejecting payment:", error);
      setError("Failed to reject payment. Please try again.");
    } finally {
      setRejecting(false);
    }
  };

  const openRejectModal = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setShowRejectionModal(true);
  };

  const handleApproveLoan = async (loanId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/status`,
        { status: 'approved' },
        config
      );

      setPendingLoans((prevLoans) =>
        prevLoans.filter((loan) => loan._id !== loanId)
      );
    } catch (error: any) {
      console.error("Error approving loan:", error);
      const message = error.response?.data?.message || "";
      if (message.includes("sureties") || message.includes("approved until ALL")) {
        setSuretyErrorMessage("You cannot approve this loan yet as one or more surties hasn't approved it");
        setShowSuretyErrorModal(true);
      } else {
        setError(message || "Failed to approve loan. Please try again.");
      }
    }
  };

  const handleRejectLoan = (loanId: string) => {
    setSelectedLoanId(loanId);
    setShowLoanRejectionModal(true);
  };

  const confirmRejectLoan = async () => {
    if (!selectedLoanId || !loanRejectionReason.trim()) return;

    setRejectingLoan(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/loans/${selectedLoanId}/status`,
        { status: 'rejected', reason: loanRejectionReason },
        config
      );

      setPendingLoans((prevLoans) =>
        prevLoans.filter((loan) => loan._id !== selectedLoanId)
      );
      setShowLoanRejectionModal(false);
      setLoanRejectionReason('');
      setSelectedLoanId(null);
    } catch (error) {
      console.error("Error rejecting loan:", error);
      setError("Failed to reject loan. Please try again.");
    } finally {
      setRejectingLoan(false);
    }
  };

  const handleApproveRegistrationClick = (userId: string) => {
    if (isMainAdmin) {
      setSelectedRegistrationId(userId);
      setShowRegistrationApprovalModal(true);
    } else {
      executeApproveRegistration(userId); // Normal admins just approve directly
    }
  };

  const executeApproveRegistration = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      setApprovingRegistration(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const payload: any = {};
      if (isMainAdmin && userId === selectedRegistrationId) {
        payload.initialDepositAmount = initialDepositAmount ? Number(initialDepositAmount) : 0;
        payload.initialLoanBalance = initialLoanBalance ? Number(initialLoanBalance) : 0;
      }

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/registrations/${userId}/approve`,
        payload,
        config
      );

      setPendingRegistrations((prevRegistrations) =>
        prevRegistrations.filter((user) => user._id !== userId)
      );

      setShowRegistrationApprovalModal(false);
      setSelectedRegistrationId(null);
      setInitialDepositAmount('');
      setInitialLoanBalance('');
    } catch (error) {
      console.error("Error approving registration:", error);
      setError("Failed to approve registration. Please try again.");
    } finally {
      setApprovingRegistration(false);
    }
  };

  const handleRejectRegistration = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/registrations/${userId}/reject`,
        {},
        config
      );

      setPendingRegistrations((prevRegistrations) =>
        prevRegistrations.filter((user) => user._id !== userId)
      );
    } catch (error) {
      console.error("Error rejecting registration:", error);
      setError("Failed to reject registration. Please try again.");
    }
  };
  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setVerifyingPin(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/verify-pin`,
        { pin },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.unlocked) {
        setIsUnlocked(true);
        setShowPinModal(false);
        setPin('');
      }
    } catch (error: any) {
      setPinError(error.response?.data?.message || 'Invalid PIN');
    } finally {
      setVerifyingPin(false);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Executive Overview</span>
          <h1 className="text-4xl sm:text-5xl font-black text-primary-text tracking-tighter">
            Admin <span className="text-tertiary-text">Dashboard</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-tertiary-text text-xs font-bold bg-surface px-4 py-2 rounded-full border border-border">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          System Live
        </div>
      </div>

      {isMainAdmin && !user?.hasPin && (
        <div className="card-premium bg-amber-500/10 border-amber-500/20 p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
            <FaExclamationTriangle className="h-6 w-6 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-amber-500 font-black text-sm uppercase tracking-widest mb-1">Security Alert</h3>
            <p className="text-secondary-text text-sm font-medium">
              You have not set an account balance PIN yet.{' '}
              <Link href="/admin/settings" className="text-amber-500 underline font-bold hover:text-amber-400">
                Go to settings to set your 4-digit PIN
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Members */}
        <div className="card-premium group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-700" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover:scale-110 transition-transform duration-500">
              <FaUsers className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest leading-none mb-1">Total Members</p>
              <h3 className="text-3xl font-black text-primary-text tracking-tighter">{stats?.totalMembers || 0}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-tertiary-text font-bold">Active Members</span>
            <span className="text-emerald-500 font-black">{stats?.activeMembers || 0}</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000" 
              style={{ width: `${((stats?.activeMembers || 0) / (stats?.totalMembers || 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Total Balance */}
        <div className="card-premium group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700" />
          {!isMainAdmin ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <FaLock className="h-8 w-8 text-tertiary-text mb-3" />
              <p className="text-tertiary-text text-[10px] font-black uppercase tracking-[0.2em]">Restricted View</p>
            </div>
          ) : !isUnlocked ? (
            <button
              onClick={() => setShowPinModal(true)}
              className="flex flex-col items-center justify-center w-full py-6 group/btn"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center mb-4 group-hover/btn:scale-110 group-hover/btn:border-emerald-500/30 transition-all duration-500">
                <FaLock className="h-6 w-6 text-emerald-500 group-hover/btn:animate-pulse" />
              </div>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">Unlock Balance</p>
            </button>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest">Total Liquidity</p>
                <button onClick={() => setIsUnlocked(false)} className="text-tertiary-text hover:text-primary-text transition-colors">
                  <FaLockOpen className="h-3 w-3" />
                </button>
              </div>
              <h3 className="text-2xl font-black text-primary-text tracking-tighter mb-6 break-words">
                {formatCurrency(stats?.totalBalance || 0)}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-surface p-2 rounded-xl border border-border">
                  <span className="text-[8px] font-black text-tertiary-text uppercase tracking-tighter">Deposits</span>
                  <p className="text-[10px] font-bold text-emerald-500 truncate">{formatCurrency(stats?.totalDeposits || 0)}</p>
                </div>
                <div className="bg-surface p-2 rounded-xl border border-border">
                  <span className="text-[8px] font-black text-tertiary-text uppercase tracking-tighter">Withdrawals</span>
                  <p className="text-[10px] font-bold text-red-500 truncate">{formatCurrency(stats?.totalWithdrawals || 0)}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Active Loans */}
        <div className="card-premium group relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-700" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <FaHandshake className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest leading-none mb-1">Active Loans</p>
              <h3 className="text-3xl font-black text-primary-text tracking-tighter">{stats?.activeLoans || 0}</h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-tertiary-text font-bold">Total Disbursed</span>
            <span className="text-purple-500 font-black">{formatCurrency(stats?.totalLoanAmount || 0)}</span>
          </div>
        </div>

        {/* Pending Actions */}
        <div className="card-premium group relative overflow-hidden border-amber-500/20">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all duration-700" />
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
              <FaChartLine className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest leading-none mb-1">Attention Required</p>
              <h3 className="text-3xl font-black text-primary-text tracking-tighter">{(stats?.pendingLoans || 0) + pendingPayments.length + pendingRegistrations.length}</h3>
            </div>
          </div>
          <Link href="/admin/loans/pending" className="text-[10px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-widest flex items-center gap-2">
            View All Action Items
            <FaArrowUp className="rotate-45 h-2 w-2" />
          </Link>
        </div>

        {/* Billing & Reserve (Main Admin Only) */}
        {isMainAdmin && stats?.billing && (
          <div className="card-premium group relative overflow-hidden border-primary/20 bg-primary/5 lg:col-span-1">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-primary text-[8px] font-black uppercase tracking-[0.2em] mb-1 block">Billing Model</span>
                <h3 className="text-xl font-black text-primary-text tracking-tighter">
                  {stats.billing.tier === 'free' ? 'Free Plan' : 'Per Member'}
                </h3>
              </div>
              <div className={`text-[8px] font-black px-2 py-1 rounded-md border uppercase tracking-widest ${
                stats.billing.subscriptionStatus === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : stats.billing.subscriptionStatus === 'grace_period'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}>
                {stats.billing.subscriptionStatus.replace('_', ' ')}
              </div>
            </div>

            {/* Per-member rate breakdown */}
            {stats.billing.tier !== 'free' ? (
              <div className="bg-surface rounded-2xl border border-border p-3 mb-4">
                <p className="text-tertiary-text text-[9px] font-black uppercase tracking-widest mb-1">Monthly Bill</p>
                <p className="text-primary-text font-black text-sm">
                  ₦{(stats.billing.memberMonthlyRate ?? 300).toLocaleString()}
                  <span className="text-tertiary-text font-bold"> × </span>
                  {stats.billing.memberCount ?? stats.billing.memberCount ?? 0}
                  <span className="text-tertiary-text font-bold"> members = </span>
                  <span className="text-primary">
                    {formatCurrency((stats.billing.memberMonthlyRate ?? 300) * (stats.billing.memberCount ?? 0))}
                  </span>
                </p>
              </div>
            ) : (
              <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/20 p-3 mb-4">
                <p className="text-emerald-400 text-[9px] font-black uppercase tracking-widest mb-1">Free Tier</p>
                <p className="text-emerald-400 font-black text-sm">
                  {stats.billing.memberCount ?? 0} / {stats.billing.freeThreshold ?? 30} members
                </p>
                <p className="text-tertiary-text text-[9px] mt-0.5">
                  Free up to {stats.billing.freeThreshold ?? 30} members
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-tertiary-text text-[9px] font-black uppercase tracking-tighter">Year-End Rebate</span>
                <p className="text-lg font-black text-emerald-500 tracking-tighter">{formatCurrency(stats.billing.rebateReserve)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-tertiary-text text-[9px] font-black uppercase tracking-tighter">Platform Dues</span>
                <p className="text-lg font-black text-primary-text tracking-tighter">{formatCurrency(stats.billing.platformDues ?? stats.billing.platformBalance)}</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                <span className="text-[9px] text-tertiary-text font-bold uppercase">
                  {stats.billing.subscriptionStatus === 'grace_period' 
                    ? 'Grace ends in 3 days' 
                    : stats.billing.nextBillingDate 
                      ? `Next: ${formatDate(stats.billing.nextBillingDate)}`
                      : 'No active subscription'}
                </span>
                {stats.billing.tier !== 'free' && (
                  <button 
                    onClick={handlePaySubscription}
                    disabled={loading}
                    className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-primary-text transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Pay Bills'}
                  </button>
                )}
           </div>
          </div>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card-premium p-0 overflow-hidden">
            <div className="p-8 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-primary-text tracking-tight">Recent Activity</h2>
                <p className="text-tertiary-text text-xs font-medium">Real-time update of platform transactions</p>
              </div>
              <Link href="/admin/transactions" className="btn-secondary px-6 py-2 text-xs">View History</Link>
            </div>
            <div className="divide-y divide-border">
              {recentTransactions.length > 0 ? recentTransactions.map((transaction) => {
                const isDebit = transaction.type === 'loan' || transaction.type === 'withdrawal';
                return (
                  <div key={transaction._id} className="p-6 flex items-center justify-between hover:bg-surface transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                        isDebit 
                          ? 'bg-purple-500/10 border-purple-500/20 text-purple-500 group-hover:bg-purple-500/20' 
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 group-hover:bg-emerald-500/20'
                      }`}>
                        {transaction.type === 'loan' ? <FaHandshake className="h-5 w-5" /> : <FaMoneyBillWave className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className={`font-bold text-primary-text group-hover:text-primary transition-colors ${transaction.status === 'rejected' ? 'line-through opacity-50' : ''}`}>
                          {transaction.user?.firstName} {transaction.user?.lastName}
                        </p>
                        <p className="text-[10px] text-tertiary-text font-black uppercase tracking-widest">{transaction.purpose || transaction.description}</p>
                        {transaction.status === 'rejected' && transaction.rejectionReason && (
                          <span className="inline-block mt-1 bg-red-500/10 text-red-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-500/20">
                            REJECTED: {transaction.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-black tracking-tight ${isDebit ? 'text-primary-text' : 'text-emerald-500'} ${transaction.status === 'rejected' ? 'line-through opacity-30' : ''}`}>
                        {isDebit ? '-' : '+'} {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-[10px] text-tertiary-text font-bold">{formatDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-12 text-center text-tertiary-text italic text-sm font-medium">No recent transactions recorded.</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Center - Sidebar style */}
        <div className="space-y-8">
          {/* Recent Members List */}
          <div className="card-premium p-0 overflow-hidden">
            <div className="p-6 border-b border-border bg-surface">
              <h2 className="text-lg font-black text-primary-text tracking-tight uppercase tracking-widest">New Members</h2>
            </div>
            <div className="p-4 space-y-4">
              {recentMembers.map((member) => (
                <div key={member._id} className="flex items-center gap-4 bg-surface p-4 rounded-3xl border border-border hover:border-primary/30 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-black text-primary text-xs border border-primary/20">
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-primary-text text-sm truncate">{member.firstName} {member.lastName}</p>
                    <p className="text-[10px] text-tertiary-text font-black tracking-tighter uppercase">{member.accountNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary">{formatCurrency(member.accountBalance)}</p>
                  </div>
                </div>
              ))}
              <Link href="/admin/members" className="block text-center text-[10px] font-black text-tertiary-text uppercase tracking-[0.2em] py-4 hover:text-primary transition-colors">
                View Directory
              </Link>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-2 gap-4">
            <Link href="/admin/transactions" className="card-premium p-6 text-center hover:bg-emerald-500/10 hover:border-emerald-500/20 group transition-all duration-500">
              <FaMoneyBillWave className="h-6 w-6 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-primary-text uppercase tracking-widest">Transactions</span>
            </Link>
            <Link href="/admin/members" className="card-premium p-6 text-center hover:bg-blue-500/10 hover:border-blue-500/20 group transition-all duration-500">
              <FaUserPlus className="h-6 w-6 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-primary-text uppercase tracking-widest">Add User</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Approvals Section */}
      {(pendingPayments.length > 0 || pendingLoans.length > 0 || pendingRegistrations.length > 0) && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black text-primary-text tracking-tighter">Queue <span className="text-tertiary-text">Approvals</span></h2>
            <span className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">Action Required</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {/* Pending Payments */}
            {pendingPayments.map((payment) => (
              <div key={payment._id} className="card-premium bg-surface border-border hover:border-emerald-500/30 transition-all duration-500 group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                      <FaMoneyBillWave className="h-6 w-6" />
                    </div>
                    {payment.isProxyPayment && (
                      <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">Proxy</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest block mb-1">Amount</span>
                    <p className="text-xl font-black text-emerald-500 leading-none">{formatCurrency(payment.amount)}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-primary-text font-bold text-sm truncate">{payment.user?.firstName} {payment.user?.lastName}</p>
                  <p className="text-tertiary-text text-xs font-medium line-clamp-1">{payment.description}</p>
                </div>
                {/* Audit: Initiated By (main admin only) */}
                {isMainAdmin && payment.initiatedBy && (
                  <div className="mb-4 flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-xl">
                    <FaUserShield className="h-3 w-3 text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-400">Initiated by: {payment.initiatedBy.firstName} {payment.initiatedBy.lastName}</span>
                  </div>
                )}
                {/* Actions: Gated for proxy payments */}
                {payment.isProxyPayment && !isMainAdmin ? (
                  <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-3 rounded-2xl">
                    <FaLock className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-amber-500 text-[10px] font-black uppercase tracking-widest">Requires Main Admin</p>
                      <p className="text-amber-500/60 text-[9px]">Only the main admin can approve proxy payments.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex-1 btn-secondary text-[10px] py-2 px-0">View Receipt</a>
                    <button onClick={() => handleApprovePayment(payment._id)} className="flex-1 btn-primary text-[10px] py-2 px-0 bg-emerald-600 hover:bg-emerald-500 shadow-none border-none">Approve</button>
                    <button onClick={() => openRejectModal(payment._id)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 transition-colors">
                      <FaExclamationTriangle className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Pending Registrations */}
            {pendingRegistrations.map((user) => (
              <div key={user._id} className="card-premium bg-surface border-border hover:border-blue-500/30 transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <FaUserPlus className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest block mb-1">Type</span>
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Registration</span>
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-primary-text font-bold text-sm truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-tertiary-text text-[10px] font-black tracking-tighter truncate">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => handleApproveRegistrationClick(user._id)} className="flex-1 btn-primary text-[10px] py-2 px-0 bg-blue-600 hover:bg-blue-500 shadow-none border-none">Approve Entry</button>
                  <button onClick={() => handleRejectRegistration(user._id)} className="btn-secondary text-[10px] py-2 px-4 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-3xl" onClick={() => setShowPinModal(false)} />
          <div className="relative glass-card bg-surface/40 p-10 rounded-[3rem] border border-border shadow-2xl w-full max-w-md transform transition-all animate-float">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[2rem] border border-primary/20 mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                <FaLock className="h-8 w-8 text-primary shadow-glow" />
              </div>
              <h3 className="text-3xl font-black text-primary-text tracking-tighter mb-2">Authorize Access</h3>
              <p className="text-tertiary-text text-sm font-medium">Enter your 4-digit security PIN to view sensitive totals.</p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-8">
              <div className="flex justify-center">
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-5xl tracking-[1.2em] font-black border-b-2 border-border focus:border-primary outline-none bg-transparent py-4 text-primary-text placeholder:text-tertiary-text appearance-none mb-4"
                  placeholder="0000"
                  autoFocus
                  required
                />
              </div>

              {pinError && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-shake">
                  <p className="text-red-500 text-xs font-black text-center uppercase tracking-widest">{pinError}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pin.length !== 4 || verifyingPin}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {verifyingPin ? 'Verifying...' : 'Unlock Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Modals */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowRejectionModal(false)} />
          <div className="relative glass-card p-10 rounded-[3rem] border border-border w-full max-w-sm">
            <h3 className="text-2xl font-black text-primary-text tracking-tight mb-4">Reject Payment</h3>
            <p className="text-tertiary-text text-[10px] font-black uppercase tracking-widest mb-6">Brief explanation for member:</p>
            <textarea
              className="w-full p-4 bg-surface border border-border rounded-[2rem] focus:border-red-500/40 outline-none text-primary-text text-sm transition-all resize-none min-h-[120px]"
              placeholder="e.g., Receipt is blurry or incomplete..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="flex-1 btn-secondary py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectPayment}
                disabled={!rejectionReason.trim() || rejecting}
                className="flex-1 btn-primary bg-red-600 hover:bg-red-500 py-3 shadow-none border-none disabled:opacity-50"
              >
                {rejecting ? 'Wait...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showRegistrationApprovalModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowRegistrationApprovalModal(false)} />
          <div className="relative glass-card p-10 rounded-[3rem] border border-border w-full max-w-md">
            <h3 className="text-2xl font-black text-primary-text tracking-tighter mb-2">Finalize Onboarding</h3>
            <p className="text-tertiary-text text-xs font-medium mb-8">Set the initial financial records for this new member.</p>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.2em] mb-2 block">Opening Savings Balance (₦)</label>
                <input
                  type="number"
                  className="w-full p-5 bg-surface border border-border rounded-3xl outline-none focus:border-primary text-primary-text font-bold"
                  placeholder="0.00"
                  value={initialDepositAmount}
                  onChange={(e) => setInitialDepositAmount(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.2em] mb-2 block">Existing Loan Debt (₦)</label>
                <input
                  type="number"
                  className="w-full p-5 bg-surface border border-border rounded-3xl outline-none focus:border-primary text-primary-text font-bold"
                  placeholder="0.00"
                  value={initialLoanBalance}
                  onChange={(e) => setInitialLoanBalance(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setShowRegistrationApprovalModal(false)}
                className="flex-1 btn-secondary text-sm"
              >
                Back
              </button>
              <button
                onClick={() => selectedRegistrationId && executeApproveRegistration(selectedRegistrationId)}
                disabled={approvingRegistration}
                className="flex-[2] btn-primary text-sm shadow-none border-none"
              >
                {approvingRegistration ? 'Onboarding...' : 'Approve & Activate Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Surety Error Modal */}
      {showSuretyErrorModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowSuretyErrorModal(false)} />
          <div className="relative glass-card p-10 rounded-[3rem] border border-border w-full max-w-sm text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 rounded-full mb-4 border border-amber-500/20">
              <FaExclamationTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-xl font-black text-primary-text tracking-tight mb-2">Approval Restricted</h3>
            <p className="text-tertiary-text mb-6">{suretyErrorMessage}</p>
            <button
              onClick={() => setShowSuretyErrorModal(false)}
              className="w-full btn-primary py-3 rounded-2xl border-none shadow-none"
            >
              Understand
            </button>
          </div>
        </div>
      )}

      {/* Loan Rejection Reason Modal */}
      {showLoanRejectionModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setShowLoanRejectionModal(false)} />
          <div className="relative glass-card p-10 rounded-[3rem] border border-border w-full max-w-sm">
            <h3 className="text-xl font-black text-primary-text tracking-tight mb-4">Reason for Loan Rejection</h3>
            <p className="text-xs text-tertiary-text mb-3 uppercase tracking-wider font-semibold">Please provide a reason:</p>
            <textarea
              className="w-full p-3 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all resize-none text-primary-text"
              rows={4}
              placeholder="e.g., Inadequate surety history, income mismatch, etc."
              value={loanRejectionReason}
              onChange={(e) => setLoanRejectionReason(e.target.value)}
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLoanRejectionModal(false)}
                className="flex-1 btn-secondary text-sm"
                disabled={rejectingLoan}
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectLoan}
                disabled={!loanRejectionReason.trim() || rejectingLoan}
                className="flex-1 btn-primary bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl border-none shadow-none transition-colors disabled:opacity-50"
              >
                {rejectingLoan ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}