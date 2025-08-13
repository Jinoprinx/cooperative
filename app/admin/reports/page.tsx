'use client';

import { useState } from 'react';
import axios from 'axios';
import { Transaction, Loan, Member } from '@/app/types';

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

  const handleGenerateReport = async () => {
    if (reportType === 'monthly' && !selectedMonth) {
      alert('Please select a month');
      return;
    }
    if (reportType === 'yearly' && !selectedYear) {
      alert('Please select a year');
      return;
    }

    try {
      let response;
      if (reportType === 'monthly') {
        const [year, month] = selectedMonth.split('-');
                response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/monthly`, {
          params: { month, year },
        });
        const { transactionSummary, memberSummary, financialSummary } = response.data;
        setReportData({
          totalDeposits: transactionSummary.totalDeposits,
          totalWithdrawals: transactionSummary.totalWithdrawals,
          totalLoanDisbursements: transactionSummary.totalLoanDisbursements,
          totalLoanRepayments: transactionSummary.totalLoanRepayments,
          netCashFlow: transactionSummary.netCashFlow,
          totalMembers: memberSummary.totalActiveMembers,
          totalBalance: financialSummary.totalCooperativeBalance,
        });
      } else {
        response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/annual`, {
          params: { year: selectedYear },
        });
        const { annualTotals, loanStats, totalActiveMembers } = response.data;
        setReportData({
          totalDeposits: annualTotals.deposits,
          totalWithdrawals: annualTotals.withdrawals,
          totalLoanDisbursements: annualTotals.loanDisbursements,
          totalLoanRepayments: annualTotals.loanRepayments,
          netCashFlow: annualTotals.netCashFlow,
          totalMembers: totalActiveMembers,
          totalBalance: loanStats.totalLoanAmount,
        });
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
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
            <h3 className="text-lg font-medium text-gray-900">Total Deposits</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalDeposits)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Withdrawals</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalWithdrawals)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Loan Disbursements</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalLoanDisbursements)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Loan Repayments</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalLoanRepayments)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-900">Net Cash Flow</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.netCashFlow)}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Members</h3>
            <p className="text-2xl font-bold text-gray-900">{reportData.totalMembers}</p>
          </div>
          <div className="card bg-white shadow-md p-4">
            <h3 className="text-lg font-medium text-gray-900">Total Balance</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.totalBalance)}</p>
          </div>
        </div>
      )}
    </div>
  );
}