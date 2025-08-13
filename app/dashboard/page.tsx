'use client';

import { FaMoneyBillWave, FaHistory, FaArrowUp, FaArrowDown, FaHandHoldingUsd, FaUserCircle } from 'react-icons/fa';
import Link from 'next/link';
import { useUser } from '@/app/hooks/useUser';
import { useDashboardData } from '@/app/hooks/useDashboardData';
import PayNowButton from '../components/PayNowButton';
//import dynamic from 'next/dynamic';

//const PayNowButton = dynamic(() => import('@/app/components/PayNowButton'), { ssr: false });

export default function Dashboard() {
  const { user, loading: userLoading, error: userError } = useUser();
  const { transactions, activeLoan, summary, loading: dataLoading, error: dataError, refetch } = useDashboardData();

  const loading = userLoading || dataLoading;
  const error = userError || dataError;

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Account Balance Card */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Account Balance</h2>
            <div className="rounded-full bg-primary p-2 text-white">
              <FaMoneyBillWave className="h-6 w-6" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-primary">{formatCurrency(user?.accountBalance || 0)}</p>
          <p className="mt-2 text-sm text-gray-500">Account Number: {user?.accountNumber}</p>
        </div>

        {/* Loan Summary Card (if there's an active loan) */}
        {activeLoan && (
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-800">Active Loan</h2>
              <div className="rounded-full bg-secondary p-2 text-white">
                <FaHandHoldingUsd className="h-6 w-6" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-bold text-red-600">{formatCurrency(activeLoan.remainingAmount)}</p>
            <p className="mt-2 text-sm text-gray-500">Outstanding Balance</p>
            <div className="mt-4 flex justify-between">
              <span className="text-sm text-gray-500">Next Payment: {activeLoan.nextPaymentDate ? formatDate(activeLoan.nextPaymentDate) : 'N/A'}</span>
              <span className="text-sm font-medium">{formatCurrency(activeLoan.monthlyPayment)}</span>
            </div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-secondary"
                style={{ width: `${(activeLoan.amountPaid / activeLoan.totalRepayment) * 100}%` }}
              ></div>
            </div>
            <div className="mt-4">
              <Link
                href="/dashboard/loans"
                className="text-sm font-medium text-red-600 hover:text-red-800"
              >
                View Details
              </Link>
            </div>
          </div>
        )}

        {/* Transaction Summary Card */}
        <div className="rounded-lg bg-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800">Recent Activity</h2>
            <div className="rounded-full bg-blue-500 p-2 text-white">
              <FaHistory className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaArrowUp className="mr-2 h-4 w-4 text-secondary" />
                <span className="text-sm text-gray-600">Recent Deposit</span>
              </div>
              <span className="text-sm font-medium text-secondary">
                {formatCurrency(summary.lastDepositAmount || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaArrowDown className="mr-2 h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-600">Loan Balance</span>
              </div>
              <span className="text-sm font-medium text-red-500">
                {activeLoan ? formatCurrency(activeLoan.remainingAmount) : formatCurrency(0)}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/transactions"
              className="text-sm font-medium text-blue-500 hover:text-blue-700"
            >
              View All Transactions
            </Link>
          </div>
        </div>
      </div>
      {/* Recent Transactions */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-medium text-gray-800">Recent Transactions</h2>
          <Link
            href="/dashboard/transactions"
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {transactions.slice(0, 5).map((transaction) => (
                <tr key={transaction._id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{transaction.description}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        transaction.type === 'deposit'
                          ? 'bg-green-100 text-green-800'
                          : transaction.type === 'withdrawal'
                          ? 'bg-red-100 text-red-800'
                          : transaction.type === 'loan_repayment'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {transaction.type === 'deposit'
                        ? 'Deposit'
                        : transaction.type === 'withdrawal'
                        ? 'Withdrawal'
                        : transaction.type === 'loan_repayment'
                        ? 'Loan Repayment'
                        : transaction.type}
                    </span>
                  </td>
                  <td
                    className={`whitespace-nowrap px-6 py-4 text-right text-sm font-medium ${
                      ['deposit', 'loan_disbursement'].includes(transaction.type)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {['deposit', 'loan_disbursement'].includes(transaction.type) ? '+' : '-'} {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions Card */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-4 text-lg font-medium text-gray-800">Quick Actions</h2>
          <div className="flex items-center justify-between mb-3">
            <PayNowButton/>
          </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            href="/dashboard/loans"
            className="flex flex-col items-center rounded-lg bg-blue-50 p-4 text-center hover:bg-blue-100"
          >
            <FaHandHoldingUsd className="mb-2 h-8 w-8 text-blue-500" />
            <span className="text-sm font-medium text-blue-700">Apply for Loan</span>
          </Link>
          <Link
            href="/dashboard/account"
            className="flex flex-col items-center rounded-lg bg-green-50 p-4 text-center hover:bg-green-100"
          >
            <FaMoneyBillWave className="mb-2 h-8 w-8 text-green-500" />
            <span className="text-sm font-medium text-green-700">Setup Auto Payment</span>
          </Link>
          <Link
            href="/dashboard/account"
            className="flex flex-col items-center rounded-lg bg-purple-50 p-4 text-center hover:bg-purple-100"
          >
            <FaUserCircle className="mb-2 h-8 w-8 text-purple-500" />
            <span className="text-sm font-medium text-purple-700">Account Settings</span>
          </Link>
          <Link
            href="/dashboard/transactions"
            className="flex flex-col items-center rounded-lg bg-yellow-50 p-4 text-center hover:bg-yellow-100"
          >
            <FaHistory className="mb-2 h-8 w-8 text-yellow-500" />
            <span className="text-sm font-medium text-yellow-700">Transaction History</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
