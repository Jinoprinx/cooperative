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

// Mock data for demo purposes
const mockStats = {
  totalMembers: 540,
  activeMembers: 512,
  totalBalance: 45678000,
  totalDeposits: 12345000,
  totalWithdrawals: 5678000,
  activeLoans: 32,
  totalLoanAmount: 23456000,
  pendingLoans: 8,
};

const mockRecentMembers = [
  { id: 1, firstName: 'Jane', lastName: 'Smith', accountNumber: 'COOP98765432', joinDate: '2023-04-28', accountBalance: 75000 },
  { id: 2, firstName: 'Michael', lastName: 'Johnson', accountNumber: 'COOP87654321', joinDate: '2023-04-27', accountBalance: 120000 },
  { id: 3, firstName: 'Emily', lastName: 'Williams', accountNumber: 'COOP76543210', joinDate: '2023-04-26', accountBalance: 95000 },
];

const mockPendingLoans = [
  { id: 1, user: { firstName: 'Robert', lastName: 'Brown', accountNumber: 'COOP12345678' }, amount: 500000, purpose: 'Business expansion', createdAt: '2023-04-25' },
  { id: 2, user: { firstName: 'Susan', lastName: 'Davis', accountNumber: 'COOP23456789' }, amount: 300000, purpose: 'Home renovation', createdAt: '2023-04-24' },
  { id: 3, user: { firstName: 'James', lastName: 'Miller', accountNumber: 'COOP34567890' }, amount: 200000, purpose: 'Education', createdAt: '2023-04-23' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(mockStats);
  const [recentMembers, setRecentMembers] = useState(mockRecentMembers);
  const [pendingLoans, setPendingLoans] = useState(mockPendingLoans);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetching
    const fetchData = async () => {
      try {
        // In a real app, these would be actual API calls
        // const statsData = await fetchStats();
        // const membersData = await fetchRecentMembers();
        // const loansData = await fetchPendingLoans();
        
        // setStats(statsData);
        // setRecentMembers(membersData);
        // setPendingLoans(loansData);
        
        // Using mock data for now
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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
          <p>Loading dashboard...</p>
        </div>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Members */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-blue-100 p-3">
              <FaUsers className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMembers}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">Active Members</p>
            <p className="text-xs font-medium text-green-600">{stats.activeMembers}</p>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-blue-600"
              style={{ width: `${(stats.activeMembers / stats.totalMembers) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Total Balance */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-green-100 p-3">
              <FaMoneyBillWave className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBalance)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            <FaArrowUp className="mr-1 h-3 w-3 text-green-600" />
            <span className="font-medium text-green-600">{formatCurrency(stats.totalDeposits)}</span>
            <span className="mx-2 text-gray-500">Deposits</span>
            <FaArrowDown className="mr-1 h-3 w-3 text-red-600" />
            <span className="font-medium text-red-600">{formatCurrency(stats.totalWithdrawals)}</span>
            <span className="ml-2 text-gray-500">Withdrawals</span>
          </div>
        </div>

        {/* Loans Overview */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-purple-100 p-3">
              <FaHandshake className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Loans</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeLoans}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-500">Total Loan Amount</p>
            <p className="text-xs font-medium text-purple-600">{formatCurrency(stats.totalLoanAmount)}</p>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
            <div
              className="h-1.5 rounded-full bg-purple-600"
              style={{ width: '65%' }}
            ></div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center">
            <div className="mr-4 rounded-full bg-yellow-100 p-3">
              <FaChartLine className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Loans</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingLoans}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/admin/loans/pending"
              className="text-sm font-medium text-yellow-600 hover:text-yellow-700"
            >
              Review pending applications
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Members & Pending Loans */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Members */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Recent Members</h2>
            <Link
              href="/admin/members"
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-white">
                    <FaUserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{member.accountNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-primary">{formatCurrency(member.accountBalance)}</p>
                  <p className="text-xs text-gray-500">Joined: {formatDate(member.joinDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Loans */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Pending Loan Applications</h2>
            <Link
              href="/admin/loans/pending"
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              View All
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingLoans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary-light text-white">
                    <FaHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {loan.user.firstName} {loan.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{loan.purpose}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-secondary">{formatCurrency(loan.amount)}</p>
                  <p className="text-xs text-gray-500">Applied: {formatDate(loan.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-medium text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            href="/admin/members/new"
            className="flex flex-col items-center rounded-lg bg-blue-50 p-4 text-center hover:bg-blue-100"
          >
            <FaUserPlus className="mb-2 h-8 w-8 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Add Member</span>
          </Link>
          <Link
            href="/admin/transactions/new"
            className="flex flex-col items-center rounded-lg bg-green-50 p-4 text-center hover:bg-green-100"
          >
            <FaMoneyBillWave className="mb-2 h-8 w-8 text-green-500" />
            <span className="text-sm font-medium text-green-700">Record Transaction</span>
          </Link>
          <Link
            href="/admin/loans/pending"
            className="flex flex-col items-center rounded-lg bg-purple-50 p-4 text-center hover:bg-purple-100"
          >
            <FaHandshake className="mb-2 h-8 w-8 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Review Loans</span>
          </Link>
          <Link
            href="/admin/reports"
            className="flex flex-col items-center rounded-lg bg-yellow-50 p-4 text-center hover:bg-yellow-100"
          >
            <FaChartLine className="mb-2 h-8 w-8 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700">Generate Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}