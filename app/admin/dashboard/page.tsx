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
  FaUserPlus
} from 'react-icons/fa';
import axios from 'axios';
import { Stats, Member, Loan } from '@/app/types';
import { RecentMember, PendingLoan, PendingPayment } from './types';

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentMembers, setRecentMembers] = useState<RecentMember[]>([]);
  const [pendingLoans, setPendingLoans] = useState<PendingLoan[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<Member[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
            user: members.find(m => m._id === loan.memberId) || { _id: '', firstName: 'Unknown', lastName: '', accountNumber: '' },
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
          <div className="loader mb-4 h-8 w-8 rounded-full border-4 border-t-4 border-gray-200 border-t-primary animate-spin"></div>
          <p className="text-black">Loading dashboard...</p>
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

  const handleApprovePayment = async (paymentId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/payments/${paymentId}/approve`,
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

  const handleRejectPayment = async (paymentId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/payments/${paymentId}/reject`,
        {},
        config
      );

      setPendingPayments((prevPayments) =>
        prevPayments.filter((payment) => payment._id !== paymentId)
      );
    } catch (error) {
      console.error("Error rejecting payment:", error);
      setError("Failed to reject payment. Please try again.");
    }
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
    } catch (error) {
      console.error("Error approving loan:", error);
      setError("Failed to approve loan. Please try again.");
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/loans/${loanId}/status`,
        { status: 'rejected' },
        config
      );

      setPendingLoans((prevLoans) =>
        prevLoans.filter((loan) => loan._id !== loanId)
      );
    } catch (error) {
      console.error("Error rejecting loan:", error);
      setError("Failed to reject loan. Please try again.");
    }
  };

  const handleApproveRegistration = async (userId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication required. Please log in.");
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/registrations/${userId}/approve`,
        {},
        config
      );

      setPendingRegistrations((prevRegistrations) =>
        prevRegistrations.filter((user) => user._id !== userId)
      );
    } catch (error) {
      console.error("Error approving registration:", error);
      setError("Failed to approve registration. Please try again.");
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

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Members */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md max-w-xs">
          <div className="flex items-center">
            <div className="mr-3 sm:mr-4 rounded-full bg-blue-100 p-2 sm:p-3">
              <FaUsers className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Members</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats?.totalMembers || 0}</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500 truncate">Active Members</p>
            <p className="text-xs font-medium text-green-600">{stats?.activeMembers || 0}</p>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
            <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${((stats?.activeMembers || 0) / (stats?.totalMembers || 1)) * 100}%` }}></div>
          </div>
        </div>

        {/* Total Balance */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md max-w-xs">
          <div className="flex items-center">
            <div className="mr-3 sm:mr-4 rounded-full bg-green-100 p-2 sm:p-3">
              <FaMoneyBillWave className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Total Balance</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{formatCurrency(stats?.totalBalance || 0)}</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center text-xs flex-wrap gap-2">
            <div className="flex items-center">
              <FaArrowUp className="mr-1 h-3 w-3 text-green-600" />
              <span className="font-medium text-green-600 truncate">{formatCurrency(stats?.totalDeposits || 0)}</span>
              <span className="ml-1 text-gray-500">Deposits</span>
            </div>
            <div className="flex items-center">
              <FaArrowDown className="mr-1 h-3 w-3 text-red-600" />
              <span className="font-medium text-red-600 truncate">{formatCurrency(stats?.totalWithdrawals || 0)}</span>
              <span className="ml-1 text-gray-500">Withdrawals</span>
            </div>
          </div>
        </div>

        {/* Active Loans */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md max-w-xs">
          <div className="flex items-center">
            <div className="mr-3 sm:mr-4 rounded-full bg-purple-100 p-2 sm:p-3">
              <FaHandshake className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Active Loans</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats?.activeLoans || 0}</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500 truncate">Total Loan Amount</p>
            <p className="text-xs font-medium text-purple-600 truncate">{formatCurrency(stats?.totalLoanAmount || 0)}</p>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
            <div className="h-1.5 rounded-full bg-purple-600" style={{ width: '65%' }}></div>
          </div>
        </div>

        {/* Pending Loans */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md max-w-xs">
          <div className="flex items-center">
            <div className="mr-3 sm:mr-4 rounded-full bg-yellow-100 p-2 sm:p-3">
              <FaChartLine className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">Pending Loans</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{stats?.pendingLoans || 0}</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <Link href="/admin/loans/pending" className="text-xs sm:text-sm font-medium text-yellow-600 hover:text-yellow-700 truncate">
              Review pending applications
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Members & Pending Loans */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        {/* Recent Transactions */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-800 truncate">Recent Transactions</h2>
            <Link href="/admin/transactions" className="text-xs sm:text-sm font-medium text-primary hover:text-primary-dark">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTransactions.map((transaction) => (
              <div key={transaction._id} className="flex items-center justify-between py-2 sm:py-3">
                <div className="flex items-center min-w-0">
                  <div className={`mr-2 sm:mr-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${transaction.type === 'loan' ? 'bg-purple-100' : 'bg-green-100'} text-white`}>
                    {transaction.type === 'loan' ? <FaHandshake className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" /> : <FaMoneyBillWave className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{transaction.user?.firstName} {transaction.user?.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{transaction.purpose || transaction.description}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-medium truncate ${transaction.type === 'loan' ? 'text-purple-600' : 'text-green-600'}`}>{formatCurrency(transaction.amount)}</p>
                  <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Members */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-800 truncate">Recent Members</h2>
            <Link href="/admin/members" className="text-xs sm:text-sm font-medium text-primary hover:text-primary-dark">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentMembers.map((member) => (
              <div key={member._id} className="flex items-center justify-between py-2 sm:py-3">
                <div className="flex items-center min-w-0">
                  <div className="mr-2 sm:mr-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-primary-light text-white">
                    <FaUserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{member.firstName} {member.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{member.accountNumber}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-primary truncate">{formatCurrency(member.accountBalance)}</p>
                  <p className="text-xs text-gray-500">Joined: {formatDate(member.joinDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Loans */}
        <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
          <div className="mb-3 sm:mb-4 flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-800 truncate">Pending Loan Applications</h2>
            <Link href="/admin/loans/pending" className="text-xs sm:text-sm font-medium text-primary hover:text-primary-dark">
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingLoans.map((loan) => (
              <div key={loan._id} className="flex items-center justify-between py-2 sm:py-3">
                <div className="flex items-center min-w-0">
                  <div className={`mr-2 sm:mr-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${loan.status === 'pending' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                    <FaHandshake className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{loan.user.firstName} {loan.user.lastName}</p>
                    <p className="text-xs text-gray-500 truncate">{loan.purpose}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-medium text-secondary truncate">{formatCurrency(loan.amount)}</p>
                  <p className="text-xs text-gray-500">Applied: {formatDate(loan.createdAt)}</p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleApproveLoan(loan._id)}
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectLoan(loan._id)}
                      className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Payments */}
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-medium text-gray-800 truncate">Pending Payments</h2>
          <Link href="/admin/payments/pending" className="text-xs sm:text-sm font-medium text-primary hover:text-primary-dark">
            View All
          </Link>
        </div>
        <div className="divide-y divide-gray-200">
          {pendingPayments.map((payment) => (
            <div key={payment._id} className="flex items-center justify-between py-2 sm:py-3">
              <div className="flex items-center min-w-0">
                <div className={`mr-2 sm:mr-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full ${payment.status === 'pending' ? 'bg-red-500' : 'bg-green-500'} text-white`}>
                  <FaMoneyBillWave className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{payment.user.firstName} {payment.user.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{payment.description}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <a href={`${process.env.NEXT_PUBLIC_API_URL}/${payment.receipt}`} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm font-medium text-primary hover:text-primary-dark">
                  View Receipt
                </a>
                <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleApprovePayment(payment._id)}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectPayment(payment._id)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Registrations */}
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
        <div className="mb-3 sm:mb-4 flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-medium text-gray-800 truncate">Pending Registrations</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {pendingRegistrations.map((user) => (
            <div key={user._id} className="flex items-center justify-between py-2 sm:py-3">
              <div className="flex items-center min-w-0">
                <div className="mr-2 sm:mr-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 text-white">
                  <FaUserPlus className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleApproveRegistration(user._id)}
                    className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectRegistration(user._id)}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-4 sm:p-6 shadow-md">
        <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-medium text-gray-800 truncate">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-4">
          <Link href="/admin/members" className="flex flex-col items-center rounded-lg bg-blue-50 p-3 sm:p-4 text-center hover:bg-blue-100">
            <FaUserPlus className="mb-1 sm:mb-2 h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
            <span className="text-xs sm:text-sm font-medium text-blue-700 break-words">Add Member</span>
          </Link>
          <Link href="/admin/transactions" className="flex flex-col items-center rounded-lg bg-green-50 p-3 sm:p-4 text-center hover:bg-green-100">
            <FaMoneyBillWave className="mb-1 sm:mb-2 h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
            <span className="text-xs sm:text-sm font-medium text-green-700 break-words">Record Transaction</span>
          </Link>
          <Link href="/admin/loans" className="flex flex-col items-center rounded-lg bg-purple-50 p-3 sm:p-4 text-center hover:bg-purple-100">
            <FaHandshake className="mb-1 sm:mb-2 h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
            <span className="text-xs sm:text-sm font-medium text-purple-700 break-words">Review Loans</span>
          </Link>
          <Link href="/admin/reports" className="flex flex-col items-center rounded-lg bg-yellow-50 p-3 sm:p-4 text-center hover:bg-yellow-100">
            <FaChartLine className="mb-1 sm:mb-2 h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
            <span className="text-xs sm:text-sm font-medium text-yellow-700 break-words">Generate Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}