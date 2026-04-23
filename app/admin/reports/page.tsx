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
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let response;
      if (reportType === 'monthly') {
        const [year, month] = selectedMonth.split('-');
        response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/monthly`, {
          ...config,
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
        const token = localStorage.getItem('token');
        response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/annual`, {
          headers: { Authorization: `Bearer ${token}` },
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
    <div className="space-y-10 pb-20 text-white">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Intelligence Bureau</span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">
            Financial <span className="text-white/40">Audit</span>
          </h1>
        </div>
      </div>

      <div className="card-premium relative overflow-hidden group">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-700" />
        <h2 className="text-xl font-black tracking-tighter mb-8">Generate Protocol</h2>
        
        <div className="grid gap-6 sm:grid-cols-3 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Report Classification</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as 'monthly' | 'yearly')}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
            >
              <option value="monthly" className="bg-slate-900">Monthly Snapshot</option>
              <option value="yearly" className="bg-slate-900">Annual Audit</option>
            </select>
          </div>

          {reportType === 'monthly' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Select Cycle</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary transition-all font-black uppercase tracking-widest"
              />
            </div>
          )}

          {reportType === 'yearly' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-4">Select Period</label>
              <input
                type="number"
                min="2000"
                max="2100"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-primary transition-all font-bold"
              />
            </div>
          )}

          <button 
            onClick={handleGenerateReport} 
            className="btn-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:tracking-[0.6em] transition-all duration-500"
          >
            Synthesize Report
          </button>
        </div>
      </div>

      {reportData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="card-premium h-full flex flex-col justify-between border-emerald-500/10">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Total Deposits</h3>
            <p className="text-3xl font-black text-emerald-400 tracking-tighter shadow-glow-sm">{formatCurrency(reportData.totalDeposits)}</p>
          </div>
          
          <div className="card-premium h-full flex flex-col justify-between border-red-500/10">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Total Withdrawals</h3>
            <p className="text-3xl font-black text-red-500 tracking-tighter">{formatCurrency(reportData.totalWithdrawals)}</p>
          </div>
          
          <div className="card-premium h-full flex flex-col justify-between">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Loan Disbursements</h3>
            <p className="text-3xl font-black text-white tracking-tighter shadow-glow-sm">{formatCurrency(reportData.totalLoanDisbursements)}</p>
          </div>
          
          <div className="card-premium h-full flex flex-col justify-between">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Loan Repayments</h3>
            <p className="text-3xl font-black text-primary tracking-tighter shadow-glow-sm">{formatCurrency(reportData.totalLoanRepayments)}</p>
          </div>
          
          <div className="card-premium h-full flex flex-col justify-between bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Net Cash Flow</h3>
            <p className="text-3xl font-black text-emerald-400 tracking-tighter shadow-glow-lg">{formatCurrency(reportData.netCashFlow)}</p>
          </div>
          
          <div className="card-premium h-full flex flex-col justify-between border-primary/20">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Total Membership</h3>
            <p className="text-3xl font-black text-white tracking-tighter">{reportData.totalMembers}</p>
          </div>
          
          <div className="card-premium h-full flex flex-col justify-between bg-primary/5 border-primary/20">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-4">Aggregate Balance</h3>
            <p className="text-3xl font-black text-primary tracking-tighter shadow-glow-sm">{formatCurrency(reportData.totalBalance)}</p>
          </div>
        </div>
      )}
    </div>
  );
}