
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { useTenant } from '@/app/context/TenantContext';
import { FaHistory, FaReceipt, FaMoneyBillWave, FaShieldAlt, FaCalendarAlt, FaDownload } from 'react-icons/fa';

export default function PaymentLedger() {
  const { user, loading: authLoading } = useAuth();
  const { tenant } = useTenant();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTransactions = async (params = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/transactions/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 1000, ...params } // Fetch all to calculate correct running balances
      });
      setTransactions(response.data.transactions || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleFilter = () => {
    fetchTransactions({ startDate, endDate });
  };

  const handleViewReceipt = (transactionId: string) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/transactions/${transactionId}/receipt?token=${token}`, '_blank');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">Decrypting Ledger Vault...</p>
        </div>
      </div>
    );
  }

  // Filter completed transactions and sort chronologically (oldest first) to compute running balances
  const completedTransactions = transactions
    .filter(tx => tx.status === 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let runningShare = 0;
  let runningThrift = 0;
  let runningDeposits = 0;
  let runningLoan = 0;
  let runningMobilization = 0;

  const passbookRows = completedTransactions.map((tx) => {
    let particulars = tx.description || '';
    
    let shareDR = 0;
    let shareCR = 0;
    
    let thriftDR = 0;
    let thriftCR = 0;
    
    let depositsDR = 0;
    let depositsCR = 0;
    
    let loanDR = 0;
    let loanCR = 0;
    
    let mobilizationDR = 0;
    let mobilizationCR = 0;

    if (tx.type === 'deposit') {
      particulars = particulars || 'Monthly Contribution';
      const breakdown = tx.ledgerBreakdown || { shareCapital: 0, thriftSavings: 0, deposits: tx.amount, capitalMobilization: 0 };
      shareCR = breakdown.shareCapital || 0;
      thriftCR = breakdown.thriftSavings || 0;
      depositsCR = breakdown.deposits || 0;
      mobilizationCR = breakdown.capitalMobilization || 0;
    } else if (tx.type === 'withdrawal') {
      particulars = particulars || 'Debit Settlement';
      depositsDR = tx.amount + (tx.platformFee || 0);
    } else if (tx.type === 'loan_disbursement') {
      particulars = particulars || 'Loan Disbursement';
      loanDR = tx.amount;
    } else if (tx.type === 'loan_repayment') {
      particulars = particulars || 'Loan Repayment';
      loanCR = tx.amount;
    }

    runningShare += (shareCR - shareDR);
    runningThrift += (thriftCR - thriftDR);
    runningDeposits += (depositsCR - depositsDR);
    runningLoan += (loanDR - loanCR);
    runningMobilization += (mobilizationCR - mobilizationDR);

    return {
      ...tx,
      particulars,
      share: { cr: shareCR, bal: runningShare },
      thrift: { cr: thriftCR, bal: runningThrift },
      deposits: { dr: depositsDR, cr: depositsCR, bal: runningDeposits },
      loan: { dr: loanDR, cr: loanCR, bal: runningLoan },
      mobilization: { cr: mobilizationCR, bal: runningMobilization },
    };
  });

  // Display newest first for the user interface
  const displayRows = [...passbookRows].reverse();

  const totalWithdrawable = user?.ledgerBalances?.deposits ?? runningDeposits;

  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-4 sm:px-6">
      <main className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block font-mono">Vault Settlement Ledger</span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-primary-text">
              Membership <span className="text-tertiary-text">Passbook</span>
            </h1>
          </div>
        </div>

        {/* Running Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">Total Balance (Withdrawable)</span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-primary-text mb-1">{formatCurrency(totalWithdrawable)}</p>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">Deposits Liquid</span>
            </div>
          </div>
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">Share Capital</span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-primary-text mb-1">{formatCurrency(user?.ledgerBalances?.shareCapital ?? runningShare)}</p>
              <span className="text-[8px] font-black text-primary uppercase tracking-wider">Membership Equity</span>
            </div>
          </div>
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">Thrift Savings</span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-primary-text mb-1">{formatCurrency(user?.ledgerBalances?.thriftSavings ?? runningThrift)}</p>
              <span className="text-[8px] font-black text-primary uppercase tracking-wider">Mandatory Savings</span>
            </div>
          </div>
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">Capital Mobilization</span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-primary-text mb-1">{formatCurrency(user?.ledgerBalances?.capitalMobilization ?? runningMobilization)}</p>
              <span className="text-[8px] font-black text-tertiary-text uppercase tracking-wider">Special Projects</span>
            </div>
          </div>
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">Outstanding Loan</span>
            <div>
              <p className={`text-2xl font-black tracking-tighter mb-1 ${runningLoan > 0 ? 'text-rose-500' : 'text-primary-text'}`}>{formatCurrency(runningLoan)}</p>
              <span className="text-[8px] font-black text-tertiary-text uppercase tracking-wider">Repayment Obligation</span>
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <div className="card-premium bg-surface border border-border p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest ml-2">Epoch Start</span>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-surface-lighter border border-border rounded-xl p-4 text-primary-text outline-none focus:border-primary text-xs font-bold"
                />
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest ml-2">Epoch End</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-surface-lighter border border-border rounded-xl p-4 text-primary-text outline-none focus:border-primary text-xs font-bold"
                />
              </div>
            </div>
            <button
              onClick={handleFilter}
              className="btn-primary py-4 px-8 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border-none h-12"
            >
              Filter Ledger
            </button>
            <button
              onClick={() => { setStartDate(''); setEndDate(''); fetchTransactions(); }}
              className="bg-surface-lighter hover:bg-surface border border-border text-primary-text font-black text-xs uppercase tracking-widest px-8 rounded-xl h-12"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Passbook Table */}
        <div className="card-premium bg-surface border border-border p-6 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <FaHistory className="text-primary h-4 w-4" />
            <h3 className="text-sm font-black tracking-widest uppercase text-primary-text">Settled Transactions Passbook</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-bold text-tertiary-text uppercase">
              <thead>
                <tr className="border-b border-border text-[8px] tracking-[0.2em] font-black text-tertiary-text">
                  <th className="pb-4 pr-4">Date</th>
                  <th className="pb-4 pr-4">Particulars</th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">Share Capital<br/><span className="text-[6px] text-tertiary-text/60">(CR | BAL)</span></th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">Thrift Savings<br/><span className="text-[6px] text-tertiary-text/60">(CR | BAL)</span></th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">Vol. Deposits<br/><span className="text-[6px] text-tertiary-text/60">(DR | CR | BAL)</span></th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">Member Loan<br/><span className="text-[6px] text-tertiary-text/60">(DR | CR | BAL)</span></th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">Capital Mobilization<br/><span className="text-[6px] text-tertiary-text/60">(CR | BAL)</span></th>
                  <th className="pb-4 text-right border-l border-border/50">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono text-[10px]">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[10px] font-black tracking-widest text-tertiary-text/40">No entries recorded in passbook.</td>
                  </tr>
                ) : (
                  displayRows.map((row) => (
                    <tr key={row._id} className="hover:bg-primary/5 transition-colors">
                      <td className="py-4 pr-4 font-bold font-sans text-primary-text">{formatDate(row.date)}</td>
                      <td className="py-4 pr-4 font-sans text-primary-text max-w-[150px] truncate">{row.particulars}</td>
                      
                      {/* Share Capital */}
                      <td className="py-4 pr-4 text-center border-l border-border/50">
                        {row.share.cr > 0 ? `+₦${row.share.cr.toLocaleString()}` : '—'} <span className="text-primary-text">| ₦{row.share.bal.toLocaleString()}</span>
                      </td>
                      
                      {/* Thrift Savings */}
                      <td className="py-4 pr-4 text-center border-l border-border/50">
                        {row.thrift.cr > 0 ? `+₦${row.thrift.cr.toLocaleString()}` : '—'} <span className="text-primary-text">| ₦{row.thrift.bal.toLocaleString()}</span>
                      </td>
                      
                      {/* Deposits */}
                      <td className="py-4 pr-4 text-center border-l border-border/50">
                        {row.deposits.dr > 0 ? `-₦${row.deposits.dr.toLocaleString()}` : row.deposits.cr > 0 ? `+₦${row.deposits.cr.toLocaleString()}` : '—'} <span className="text-primary-text">| ₦{row.deposits.bal.toLocaleString()}</span>
                      </td>
                      
                      {/* Member Loan */}
                      <td className="py-4 pr-4 text-center border-l border-border/50">
                        {row.loan.dr > 0 ? `+₦${row.loan.dr.toLocaleString()}` : row.loan.cr > 0 ? `-₦${row.loan.cr.toLocaleString()}` : '—'} <span className="text-rose-500 font-bold">| ₦{row.loan.bal.toLocaleString()}</span>
                      </td>
                      
                      {/* Capital Mobilization */}
                      <td className="py-4 pr-4 text-center border-l border-border/50">
                        {row.mobilization.cr > 0 ? `+₦${row.mobilization.cr.toLocaleString()}` : '—'} <span className="text-primary-text">| ₦{row.mobilization.bal.toLocaleString()}</span>
                      </td>

                      <td className="py-4 text-right border-l border-border/50">
                        {row.receiptUrl ? (
                          <button
                            onClick={() => handleViewReceipt(row._id)}
                            className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors inline-flex items-center gap-1.5 font-sans font-bold"
                          >
                            <FaReceipt className="w-3.5 h-3.5" /> View
                          </button>
                        ) : (
                          <span className="text-tertiary-text/40 font-sans">System Manual</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
