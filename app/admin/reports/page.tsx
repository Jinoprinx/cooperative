'use client';

import { useState } from 'react';
import { mockAllTransactions, mockAllLoans, mockMembers } from '@/app/types'; // Adjust the import path as necessary

export default function Reports() {
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [reportData, setReportData] = useState<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalLoanDisbursements: number;
    totalLoanRepayments: number;
    netCashFlow: number;
    totalMembers: number;
    totalBalance: number;
  } | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const handleGenerateReport = () => {
    if (reportType === 'monthly' && !selectedMonth) {
      alert('Please select a month');
      return;
    }
    if (reportType === 'yearly' && !selectedYear) {
      alert('Please select a year');
      return;
    }

    let startDate: Date;
    let endDate: Date;

    if (reportType === 'monthly') {
      const [year, month] = selectedMonth.split('-').map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0); // Last day of the month
    } else {
      const year = Number(selectedYear);
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    // Filter transactions within the period
    const transactionsInPeriod = mockAllTransactions.filter(t => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });

    const totalDeposits = transactionsInPeriod
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactionsInPeriod
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    // Filter loans disbursed in the period
    const loansDisbursed = mockAllLoans.filter(l => {
      if (!l.startDate) return false;
      const date = new Date(l.startDate);
      return date >= startDate && date <= endDate;
    });

    const totalLoanDisbursements = loansDisbursed.reduce((sum, l) => sum + l.amount, 0);

    // Filter loan repayments in the period
    const totalLoanRepayments = mockAllLoans.reduce((sum, l) => {
      const repaymentsInPeriod = l.repaymentHistory.filter(r => {
        const date = new Date(r.date);
        return date >= startDate && date <= endDate;
      });
      return sum + repaymentsInPeriod.reduce((acc, r) => acc + r.amount, 0);
    }, 0);

    // Total members as of endDate
    const totalMembers = mockMembers.filter(m => new Date(m.joinDate) <= endDate).length;

    // Total balance as of endDate (approximation using current balances)
    const totalBalance = mockMembers
      .filter(m => new Date(m.joinDate) <= endDate)
      .reduce((sum, m) => sum + m.accountBalance, 0);

    // Net cash flow (simplified profit metric)
    const netCashFlow = totalDeposits + totalLoanRepayments - totalWithdrawals - totalLoanDisbursements;

    setReportData({
      totalDeposits,
      totalWithdrawals,
      totalLoanDisbursements,
      totalLoanRepayments,
      netCashFlow,
      totalMembers,
      totalBalance,
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-lg font-medium text-gray-800">Generate Report</h2>
        <div className="mt-4 space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Report Type</span>
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'monthly' | 'yearly')}
              className="select select-bordered w-full max-w-xs"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          {reportType === 'monthly' && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select Month</span>
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input input-bordered w-full max-w-xs"
              />
            </div>
          )}
          {reportType === 'yearly' && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Select Year</span>
              </label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="input input-bordered w-full max-w-xs"
              />
            </div>
          )}
          <button onClick={handleGenerateReport} className="btn btn-primary">
            Generate Report
          </button>
        </div>
      </div>
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium">Total Deposits</h3>
            <p className="text-2xl font-bold">{formatCurrency(reportData.totalDeposits)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium">Total Withdrawals</h3>
            <p className="text-2xl font-bold">{formatCurrency(reportData.totalWithdrawals)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium">Total Loan Disbursements</h3>
            <p className="text-2xl font-bold">{formatCurrency(reportData.totalLoanDisbursements)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium">Total Loan Repayments</h3>
            <p className="text-2xl font-bold">{formatCurrency(reportData.totalLoanRepayments)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium">Net Cash Flow</h3>
            <p className="text-2xl font-bold">{formatCurrency(reportData.netCashFlow)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium">Total Members</h3>
            <p className="text-2xl font-bold">{reportData.totalMembers}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium">Total Balance</h3>
            <p className="text-2xl font-bold">{formatCurrency(reportData.totalBalance)}</p>
          </div>
        </div>
      )}
    </div>
  );
}