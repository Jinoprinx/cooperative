'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { FaHistory, FaReceipt } from 'react-icons/fa';


// Threshold date separating legacy (pre-passbook) from split transactions
const PASSBOOK_THRESHOLD = new Date('2026-05-14T00:00:00Z');


// ─── Types ────────────────────────────────────────────────────────────────────
interface PassbookRow {
  _id: string;
  date: string | null;
  particulars: string;
  isOpeningBalance?: boolean;
  isLegacy?: boolean;
  receiptUrl?: string;
  share:        { dr: number; cr: number; bal: number };
  thrift:       { dr: number; cr: number; bal: number };
  deposits:     { dr: number; cr: number; bal: number };
  loan:         { dr: number; cr: number; bal: number };
  mobilization: { dr: number; cr: number; bal: number };
  totalAssets:  { dr: number; cr: number; bal: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

const fmtDate = (d: string | null) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const cell = (n: number, prefix = '') =>
  n > 0 ? `${prefix}₦${n.toLocaleString()}` : '—';

// ─── Component ────────────────────────────────────────────────────────────────
export default function PaymentLedger() {
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');

  const fetchTransactions = async (params: Record<string, string> = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/transactions/history`,
        {
          headers: { Authorization: `Bearer ${token}` },
          // Fetch all to compute correct running balances
          params: { limit: 1000, ...params },
        }
      );
      setTransactions(res.data.transactions || []);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) fetchTransactions(); }, [user]);

  const handleViewReceipt = (txId: string) => {
    const token = localStorage.getItem('token');
    window.open(
      `${process.env.NEXT_PUBLIC_API_URL}/transactions/${txId}/receipt?token=${token}`,
      '_blank'
    );
  };

  // ── Loading spinner ──────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black text-tertiary-text uppercase tracking-widest">
            Decrypting Ledger Vault…
          </p>
        </div>
      </div>
    );
  }

  // ── Derive key values from the authenticated user ────────────────────────────
  const prePassbookBalance = user?.prePassbookBalance ?? 0;

  // ── Sort all completed transactions oldest → newest ──────────────────────────
  const completedTxns = transactions
    .filter(tx => tx.status === 'completed')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // ── Compute how much of prePassbookBalance is already in the DB as legacy
  //    transactions so we can avoid double-counting.
  //
  //    A transaction is "legacy" when it was created before the threshold AND
  //    has no ledgerBreakdown (it was never split by the passbook system).
  // ─────────────────────────────────────────────────────────────────────────────
  const legacyNetInDB = completedTxns
    .filter(tx => new Date(tx.date) < PASSBOOK_THRESHOLD && !tx.ledgerBreakdown)
    .reduce((sum, tx) => {
      if (tx.type === 'deposit')    return sum + tx.amount;
      if (tx.type === 'withdrawal') return sum - (tx.amount + (tx.platformFee ?? 0));
      return sum;
    }, 0);

  // Gap = the portion of prePassbookBalance NOT represented by any DB transaction.
  // This can happen when initial deposits or manual adjustments were made outside
  // the normal transaction flow.
  const openingBalanceGap = Math.max(0, prePassbookBalance - legacyNetInDB);

  // ── Build passbook rows ──────────────────────────────────────────────────────
  let runningShare        = 0;
  let runningThrift       = 0;
  let runningDeposits     = 0;
  let runningLoan         = 0;
  let runningMobilization = 0;
  let runningAssets       = 0;

  const passbookRows: PassbookRow[] = [];

  // 1. Prepend synthetic "Opening Balance" row for any gap in the legacy balance.
  //    This ensures every single naira of the member's history is visible.
  if (openingBalanceGap > 0) {
    runningAssets = openingBalanceGap;
    passbookRows.push({
      _id: '__opening_balance__',
      date: null,
      particulars: 'Opening Balance (Pre-Passbook)',
      isOpeningBalance: true,
      share:        { dr: 0, cr: 0, bal: 0 },
      thrift:       { dr: 0, cr: 0, bal: 0 },
      deposits:     { dr: 0, cr: 0, bal: 0 },
      loan:         { dr: 0, cr: 0, bal: 0 },
      mobilization: { dr: 0, cr: 0, bal: 0 },
      totalAssets:  { dr: 0, cr: openingBalanceGap, bal: runningAssets },
    });
  }

  // 2. Map every completed transaction.
  for (const tx of completedTxns) {
    // A transaction is legacy when it pre-dates the passbook threshold AND was
    // never broken down into individual ledger components.
    const isLegacy =
      new Date(tx.date) < PASSBOOK_THRESHOLD && !tx.ledgerBreakdown;

    let particulars = tx.description || '';

    let shareDR = 0,  shareCR = 0;
    let thriftDR = 0, thriftCR = 0;
    let depDR = 0,    depCR = 0;
    let loanDR = 0,   loanCR = 0;
    let mobDR = 0,    mobCR = 0;
    let assetsCR = 0, assetsDR = 0;

    if (isLegacy) {
      // ── Legacy transaction: don't split — just track in Total Assets ──────────
      if (tx.type === 'deposit') {
        particulars = particulars || 'Monthly Contribution';
        assetsCR    = tx.amount;
      } else if (tx.type === 'withdrawal') {
        particulars = particulars || 'Debit Settlement';
        assetsDR    = tx.amount + (tx.platformFee ?? 0);
      }
      // Other legacy types (loan_disbursement etc.) treated as informational only
    } else {
      // ── Passbook transaction: apply full ledger breakdown ─────────────────────
      if (tx.type === 'deposit') {
        particulars  = particulars || 'Monthly Contribution';
        const bd     = tx.ledgerBreakdown ?? {
          shareCapital: 0, thriftSavings: 0, deposits: tx.amount, capitalMobilization: 0,
        };
        shareCR  = bd.shareCapital       ?? 0;
        thriftCR = bd.thriftSavings      ?? 0;
        depCR    = bd.deposits           ?? 0;
        mobCR    = bd.capitalMobilization ?? 0;
        assetsCR = shareCR + thriftCR + depCR + mobCR;

      } else if (tx.type === 'withdrawal') {
        particulars = particulars || 'Debit Settlement';
        depDR       = tx.amount + (tx.platformFee ?? 0);
        assetsDR    = depDR;

      } else if (tx.type === 'loan_disbursement') {
        particulars = particulars || 'Loan Disbursement';
        loanDR      = tx.amount;
        // Loan disbursements do NOT reduce savings assets

      } else if (tx.type === 'loan_repayment') {
        particulars = particulars || 'Loan Repayment';
        loanCR      = tx.amount;
        // Loan repayments do NOT add to savings assets

      } else if (tx.type === 'interest_payment') {
        particulars = particulars || 'Loan Interest Deduction';
        depDR       = tx.amount;
        assetsDR    = tx.amount;
      }
    }

    runningShare        += shareCR  - shareDR;
    runningThrift       += thriftCR - thriftDR;
    runningDeposits     += depCR    - depDR;
    runningLoan         += loanDR   - loanCR;
    runningMobilization += mobCR    - mobDR;
    runningAssets       += assetsCR - assetsDR;

    passbookRows.push({
      _id:          tx._id,
      date:         tx.date,
      particulars,
      isLegacy,
      receiptUrl:   tx.receiptUrl,
      share:        { dr: shareDR,  cr: shareCR,  bal: runningShare },
      thrift:       { dr: thriftDR, cr: thriftCR, bal: runningThrift },
      deposits:     { dr: depDR,    cr: depCR,    bal: runningDeposits },
      loan:         { dr: loanDR,   cr: loanCR,   bal: runningLoan },
      mobilization: { dr: mobDR,    cr: mobCR,    bal: runningMobilization },
      totalAssets:  { dr: assetsDR, cr: assetsCR, bal: runningAssets },
    });
  }

  // Display newest first in the UI
  const displayRows = [...passbookRows].reverse();

  // ── Summary card values ──────────────────────────────────────────────────────
  // "Withdrawable" = pre-passbook legacy balance + post-passbook deposits
  const totalWithdrawable =
    prePassbookBalance + (user?.ledgerBalances?.deposits ?? 0);

  const shareCapitalBal        = user?.ledgerBalances?.shareCapital        ?? runningShare;
  const thriftSavingsBal       = user?.ledgerBalances?.thriftSavings       ?? runningThrift;
  const capitalMobilizationBal = user?.ledgerBalances?.capitalMobilization  ?? runningMobilization;
  // Grand total of all assets = accountBalance (backend-computed)
  const totalAssetsBal         = user?.accountBalance ?? runningAssets;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pt-32 pb-20 px-4 sm:px-6">
      <main className="max-w-[100rem] mx-auto space-y-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block font-mono">
              Vault Settlement Ledger
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-primary-text">
              Membership <span className="text-tertiary-text">Passbook</span>
            </h1>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {/* Total Assets */}
          <div className="card-premium bg-gradient-to-br from-emerald-950/60 to-emerald-900/30 border border-emerald-500/30 p-6 rounded-2xl flex flex-col justify-between col-span-2 md:col-span-1">
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-4">
              Total Assets
            </span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-emerald-300 mb-1">
                {fmt(totalAssetsBal)}
              </p>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">
                All Categories
              </span>
            </div>
          </div>

          {/* Withdrawable (deposits) */}
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">
              Withdrawable (Deposits)
            </span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-primary-text mb-1">
                {fmt(totalWithdrawable)}
              </p>
              <span className="text-[8px] font-black text-emerald-500 uppercase tracking-wider">
                Liquid Balance
              </span>
            </div>
          </div>

          {/* Share Capital */}
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">
              Share Capital
            </span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-primary-text mb-1">
                {fmt(shareCapitalBal)}
              </p>
              <span className="text-[8px] font-black text-primary uppercase tracking-wider">
                Membership Equity
              </span>
            </div>
          </div>

          {/* Thrift Savings */}
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">
              Thrift Savings
            </span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-primary-text mb-1">
                {fmt(thriftSavingsBal)}
              </p>
              <span className="text-[8px] font-black text-primary uppercase tracking-wider">
                Mandatory Savings
              </span>
            </div>
          </div>

          {/* Capital Mobilization */}
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">
              Capital Mobilization
            </span>
            <div>
              <p className="text-2xl font-black tracking-tighter text-primary-text mb-1">
                {fmt(capitalMobilizationBal)}
              </p>
              <span className="text-[8px] font-black text-tertiary-text uppercase tracking-wider">
                Special Projects
              </span>
            </div>
          </div>

          {/* Outstanding Loan */}
          <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col justify-between">
            <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest mb-4">
              Outstanding Loan
            </span>
            <div>
              <p className={`text-2xl font-black tracking-tighter mb-1 ${runningLoan > 0 ? 'text-rose-500' : 'text-primary-text'}`}>
                {fmt(runningLoan)}
              </p>
              <span className="text-[8px] font-black text-tertiary-text uppercase tracking-wider">
                Repayment Obligation
              </span>
            </div>
          </div>
        </div>

        {/* Date Filters */}
        <div className="card-premium bg-surface border border-border p-6 rounded-2xl">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest ml-2">
                Epoch Start
              </span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-surface-lighter border border-border rounded-xl p-4 text-primary-text outline-none focus:border-primary text-xs font-bold"
              />
            </div>
            <div className="flex-1 space-y-2">
              <span className="text-[8px] font-black text-tertiary-text uppercase tracking-widest ml-2">
                Epoch End
              </span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-surface-lighter border border-border rounded-xl p-4 text-primary-text outline-none focus:border-primary text-xs font-bold"
              />
            </div>
            <button
              onClick={() => fetchTransactions({ startDate, endDate })}
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
            <h3 className="text-sm font-black tracking-widest uppercase text-primary-text">
              Settled Transactions Passbook
            </h3>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-6 text-[9px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Legacy (pre-passbook — full amount in Total Assets)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary inline-block" />
              Post-passbook (split by category)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-bold text-tertiary-text uppercase">
              <thead>
                <tr className="border-b border-border text-[8px] tracking-[0.2em] font-black text-tertiary-text">
                  <th className="pb-4 pr-4">Date</th>
                  <th className="pb-4 pr-4">Particulars</th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">
                    Share Capital<br />
                    <span className="text-[6px] text-tertiary-text/60">(CR | BAL)</span>
                  </th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">
                    Thrift Savings<br />
                    <span className="text-[6px] text-tertiary-text/60">(CR | BAL)</span>
                  </th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">
                    Vol. Deposits<br />
                    <span className="text-[6px] text-tertiary-text/60">(DR | CR | BAL)</span>
                  </th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">
                    Member Loan<br />
                    <span className="text-[6px] text-tertiary-text/60">(DR | CR | BAL)</span>
                  </th>
                  <th className="pb-4 pr-4 text-center border-l border-border/50">
                    Cap. Mobilization<br />
                    <span className="text-[6px] text-tertiary-text/60">(CR | BAL)</span>
                  </th>
                  <th className="pb-4 pr-4 text-center border-l border-emerald-500/40 text-emerald-400">
                    Total Assets<br />
                    <span className="text-[6px] text-emerald-400/60">(DR | CR | BAL)</span>
                  </th>
                  <th className="pb-4 text-right border-l border-border/50">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-mono text-[10px]">
                {displayRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-8 text-center text-[10px] font-black tracking-widest text-tertiary-text/40"
                    >
                      No entries recorded in passbook.
                    </td>
                  </tr>
                ) : (
                  displayRows.map(row => {
                    const isOpening = row.isOpeningBalance;
                    const isLegacy  = row.isLegacy;

                    const rowBg = isOpening
                      ? 'bg-emerald-950/30'
                      : isLegacy
                      ? 'bg-amber-950/10'
                      : '';

                    return (
                      <tr key={row._id} className={`hover:bg-primary/5 transition-colors ${rowBg}`}>
                        {/* Date */}
                        <td className="py-4 pr-4 font-bold font-sans text-primary-text whitespace-nowrap">
                          {fmtDate(row.date)}
                        </td>

                        {/* Particulars */}
                        <td className="py-4 pr-4 font-sans text-primary-text max-w-[180px]">
                          <span className="truncate block">{row.particulars}</span>
                          {isOpening && (
                            <span className="text-[8px] text-emerald-400 font-black tracking-wider block mt-0.5">
                              ● Opening Balance
                            </span>
                          )}
                          {isLegacy && (
                            <span className="text-[8px] text-amber-400 font-black tracking-wider block mt-0.5">
                              ● Pre-Passbook
                            </span>
                          )}
                        </td>

                        {/* Share Capital */}
                        <td className="py-4 pr-4 text-center border-l border-border/50">
                          {(isLegacy || isOpening) ? (
                            <span className="text-tertiary-text/30">—</span>
                          ) : (
                            <>
                              {cell(row.share.cr, '+')}
                              {' '}
                              <span className="text-primary-text">
                                | ₦{row.share.bal.toLocaleString()}
                              </span>
                            </>
                          )}
                        </td>

                        {/* Thrift Savings */}
                        <td className="py-4 pr-4 text-center border-l border-border/50">
                          {(isLegacy || isOpening) ? (
                            <span className="text-tertiary-text/30">—</span>
                          ) : (
                            <>
                              {cell(row.thrift.cr, '+')}
                              {' '}
                              <span className="text-primary-text">
                                | ₦{row.thrift.bal.toLocaleString()}
                              </span>
                            </>
                          )}
                        </td>

                        {/* Vol. Deposits */}
                        <td className="py-4 pr-4 text-center border-l border-border/50">
                          {(isLegacy || isOpening) ? (
                            <span className="text-tertiary-text/30">—</span>
                          ) : (
                            <>
                              {row.deposits.dr > 0
                                ? <span className="text-rose-400">-₦{row.deposits.dr.toLocaleString()}</span>
                                : cell(row.deposits.cr, '+')}
                              {' '}
                              <span className="text-primary-text">
                                | ₦{row.deposits.bal.toLocaleString()}
                              </span>
                            </>
                          )}
                        </td>

                        {/* Member Loan */}
                        <td className="py-4 pr-4 text-center border-l border-border/50">
                          {isOpening ? (
                            <span className="text-tertiary-text/30">—</span>
                          ) : (
                            <>
                              {row.loan.dr > 0
                                ? `+₦${row.loan.dr.toLocaleString()}`
                                : row.loan.cr > 0
                                ? <span className="text-rose-400">-₦{row.loan.cr.toLocaleString()}</span>
                                : '—'}
                              {' '}
                              <span className="text-rose-500 font-bold">
                                | ₦{row.loan.bal.toLocaleString()}
                              </span>
                            </>
                          )}
                        </td>

                        {/* Cap. Mobilization */}
                        <td className="py-4 pr-4 text-center border-l border-border/50">
                          {(isLegacy || isOpening) ? (
                            <span className="text-tertiary-text/30">—</span>
                          ) : (
                            <>
                              {cell(row.mobilization.cr, '+')}
                              {' '}
                              <span className="text-primary-text">
                                | ₦{row.mobilization.bal.toLocaleString()}
                              </span>
                            </>
                          )}
                        </td>

                        {/* Total Assets — always shown, highlighted */}
                        <td className="py-4 pr-4 text-center border-l border-emerald-500/40">
                          {row.totalAssets.dr > 0 && (
                            <span className="text-rose-400 mr-1">
                              -₦{row.totalAssets.dr.toLocaleString()}
                            </span>
                          )}
                          {row.totalAssets.cr > 0 && (
                            <span className="text-emerald-400 mr-1">
                              +₦{row.totalAssets.cr.toLocaleString()}
                            </span>
                          )}
                          {row.totalAssets.dr === 0 && row.totalAssets.cr === 0 && (
                            <span className="text-tertiary-text/30 mr-1">—</span>
                          )}
                          <span className="text-emerald-300 font-bold">
                            | ₦{row.totalAssets.bal.toLocaleString()}
                          </span>
                        </td>

                        {/* Receipt */}
                        <td className="py-4 text-right border-l border-border/50">
                          {row.receiptUrl ? (
                            <button
                              onClick={() => handleViewReceipt(row._id)}
                              className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg transition-colors inline-flex items-center gap-1.5 font-sans font-bold"
                            >
                              <FaReceipt className="w-3.5 h-3.5" /> View
                            </button>
                          ) : isOpening ? (
                            <span className="text-emerald-500/60 font-sans text-[9px]">Opening Bal</span>
                          ) : (
                            <span className="text-tertiary-text/40 font-sans">System Manual</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
