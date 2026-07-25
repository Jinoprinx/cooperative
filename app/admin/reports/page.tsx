'use client';

import { useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { 
  FaDownload, 
  FaPrint, 
  FaRegFileAlt, 
  FaCoins, 
  FaMoneyBillWave, 
  FaPiggyBank, 
  FaCalculator, 
  FaUserPlus, 
  FaUsers, 
  FaArrowUp, 
  FaArrowDown, 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaHandHoldingUsd, 
  FaExclamationTriangle,
  FaShieldAlt
} from 'react-icons/fa';

type ReportCategory = 'general' | 'loans' | 'members' | 'transactions' | 'sureties';

export default function Reports() {
  const [reportCategory, setReportCategory] = useState<ReportCategory>('general');
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tabs for the secondary tables depending on report category
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // Stores raw payload from backend
  const [rawReportData, setRawReportData] = useState<any | null>(null);

  // Month and Year selections
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, '0');
  });
  
  const [selectedYear, setSelectedYear] = useState(() => {
    return String(new Date().getFullYear());
  });

  // Granular report filters
  const [loanStatus, setLoanStatus] = useState<string>('all');
  const [interestStyle, setInterestStyle] = useState<string>('all');
  const [memberStatus, setMemberStatus] = useState<string>('all');
  const [isManual, setIsManual] = useState<string>('all');
  const [txType, setTxType] = useState<string>('all');
  const [txStatus, setTxStatus] = useState<string>('all');
  const [exposureThreshold, setExposureThreshold] = useState<number>(500000); // Highlight guarantors with liability exposure above ₦500,000

  const months = [
    { value: '01', name: 'January' },
    { value: '02', name: 'February' },
    { value: '03', name: 'March' },
    { value: '04', name: 'April' },
    { value: '05', name: 'May' },
    { value: '06', name: 'June' },
    { value: '07', name: 'July' },
    { value: '08', name: 'August' },
    { value: '09', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' },
  ];

  const years = Array.from({ length: 16 }, (_, i) => String(2020 + i));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount || 0);
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

    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      let response;
      
      if (reportCategory === 'general') {
        if (reportType === 'monthly') {
          response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/monthly`, {
            ...config,
            params: { month: selectedMonth, year: selectedYear },
          });
        } else {
          response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/annual`, {
            ...config,
            params: { year: selectedYear },
          });
        }
      } else {
        // Granular targeted report route
        const params: any = {
          type: reportCategory,
          cycle: reportType,
          year: selectedYear,
          month: reportType === 'monthly' ? selectedMonth : undefined
        };

        if (reportCategory === 'loans') {
          params.status = loanStatus;
          params.interestStyle = interestStyle;
        } else if (reportCategory === 'members') {
          params.status = memberStatus;
          params.isManual = isManual;
        } else if (reportCategory === 'transactions') {
          params.txType = txType;
          params.status = txStatus;
        } else if (reportCategory === 'sureties') {
          params.exposureThreshold = exposureThreshold;
        }

        response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/granular`, {
          ...config,
          params
        });
      }
      
      setRawReportData(response.data);
      setActiveTab('overview');
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err?.response?.data?.message || 'Failed to synthesize audit protocol. Please check your credentials or API connection.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data: string, filename: string) => {
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    if (!rawReportData) return;
    
    let csvContent = "";
    const headerPrefix = `${reportCategory.toUpperCase()} REPORT | Cycle: ${reportType.toUpperCase()} | Year: ${selectedYear}${reportType === 'monthly' ? `, Month: ${selectedMonth}` : ''}\n\n`;
    csvContent += headerPrefix;

    if (reportCategory === 'general') {
      if (reportType === 'monthly') {
        csvContent += "Financial Metrics,Amount (NGN)\n";
        csvContent += `Total Deposits,${rawReportData.transactionSummary?.totalDeposits || 0}\n`;
        csvContent += `Total Withdrawals,${rawReportData.transactionSummary?.totalWithdrawals || 0}\n`;
        csvContent += `Loan Disbursements,${rawReportData.transactionSummary?.totalLoanDisbursements || 0}\n`;
        csvContent += `Loan Repayments,${rawReportData.transactionSummary?.totalLoanRepayments || 0}\n`;
        csvContent += `Net Cash Flow,${rawReportData.transactionSummary?.netCashFlow || 0}\n`;
        csvContent += `Transaction Count,${rawReportData.transactionSummary?.transactionCount || 0}\n`;
        csvContent += `Cooperative Aggregate Balance,${rawReportData.financialSummary?.totalCooperativeBalance || 0}\n`;
        csvContent += `Total Outstanding Loans,${rawReportData.financialSummary?.totalOutstandingLoans || 0}\n\n`;
        
        csvContent += "LEDGER ALLOCATION SUMMARY\n";
        csvContent += "Ledger Category,Amount (NGN)\n";
        csvContent += `Share Capital,${rawReportData.financialSummary?.ledgerSummary?.shareCapital || 0}\n`;
        csvContent += `Thrift Savings,${rawReportData.financialSummary?.ledgerSummary?.thriftSavings || 0}\n`;
        csvContent += `General Deposits,${rawReportData.financialSummary?.ledgerSummary?.deposits || 0}\n`;
        csvContent += `Capital Mobilization,${rawReportData.financialSummary?.ledgerSummary?.capitalMobilization || 0}\n\n`;
        
        csvContent += "NEW MEMBERS REGISTERED\n";
        csvContent += "Name,Email,Phone,Join Date,Status\n";
        rawReportData.memberSummary?.newMembersList?.forEach((m: any) => {
          csvContent += `"${m.firstName} ${m.lastName}","${m.email}","${m.phoneNumber}","${new Date(m.joinDate).toLocaleDateString()}",${m.status}\n`;
        });
        downloadCSV(csvContent, `Monthly_Report_${selectedMonth}_${selectedYear}.csv`);
      } else {
        csvContent += "MONTHLY FINANCIAL BREAKDOWN\n";
        csvContent += "Month,Deposits,Withdrawals,Loan Disbursements,Loan Repayments,Processing Fees,Net Cash Flow,Transaction Count\n";
        rawReportData.monthlyData?.forEach((m: any) => {
          csvContent += `"${m.monthName}",${m.deposits},${m.withdrawals},${m.loanDisbursements},${m.loanRepayments},${m.processingFees},${m.netCashFlow},${m.transactionCount}\n`;
        });
        csvContent += `\nANNUAL TOTALS,${rawReportData.annualTotals?.deposits || 0},${rawReportData.annualTotals?.withdrawals || 0},${rawReportData.annualTotals?.loanDisbursements || 0},${rawReportData.annualTotals?.loanRepayments || 0},${rawReportData.annualTotals?.processingFees || 0},${rawReportData.annualTotals?.netCashFlow || 0},${rawReportData.annualTotals?.transactionCount || 0}\n\n`;
        
        csvContent += "LOAN PORTFOLIO HEALTH SUMMARY\n";
        csvContent += `Total Loans Issued,${rawReportData.loanStats?.totalLoansIssued || 0}\n`;
        csvContent += `Total Issued Amount,${rawReportData.loanStats?.totalLoanAmount || 0}\n`;
        csvContent += `Active Loans Count,${rawReportData.loanStats?.activeLoans || 0}\n`;
        csvContent += `Completed Loans Count,${rawReportData.loanStats?.completedLoans || 0}\n`;
        csvContent += `Defaulted Loans Count,${rawReportData.loanStats?.defaultedLoans || 0}\n`;
        csvContent += `Total Interest Earned,${rawReportData.loanStats?.totalInterestEarned || 0}\n\n`;
        
        csvContent += "YEARLY LEDGER ALLOCATIONS\n";
        csvContent += "Ledger Category,Amount (NGN)\n";
        csvContent += `Share Capital,${rawReportData.ledgerSummary?.shareCapital || 0}\n`;
        csvContent += `Thrift Savings,${rawReportData.ledgerSummary?.thriftSavings || 0}\n`;
        csvContent += `General Deposits,${rawReportData.ledgerSummary?.deposits || 0}\n`;
        csvContent += `Capital Mobilization,${rawReportData.ledgerSummary?.capitalMobilization || 0}\n`;
        
        downloadCSV(csvContent, `Annual_Report_${selectedYear}.csv`);
      }
    } else if (reportCategory === 'loans') {
      csvContent += "SUMMARY STATS\n";
      csvContent += `Total Applications,${rawReportData.summary?.totalCount || 0}\n`;
      csvContent += `Total Principal Payout,${rawReportData.summary?.totalPrincipal || 0}\n`;
      csvContent += `Total Interest Expected,${rawReportData.summary?.totalInterest || 0}\n`;
      csvContent += `Total Repayment Value,${rawReportData.summary?.totalRepayment || 0}\n`;
      csvContent += `Total Amount Collected,${rawReportData.summary?.amountPaid || 0}\n`;
      csvContent += `Outstanding Remaining Liability,${rawReportData.summary?.remainingAmount || 0}\n`;
      csvContent += `Monetized Processing Fees,${rawReportData.summary?.processingFees || 0}\n\n`;

      csvContent += "LOANS PORTFOLIO LEDGER\n";
      csvContent += "Borrower,Member ID,Amount,Interest Style,Rate (%),Monthly Installment,Amount Paid,Remaining,Status,Date\n";
      rawReportData.loans?.forEach((l: any) => {
        csvContent += `"${l.user?.firstName} ${l.user?.lastName}","${l.user?.memberIdentifier || ''}",${l.amount},"${l.interestStyle}",${l.interestRate},${l.monthlyPayment},${l.amountPaid},${l.remainingAmount},"${l.status}","${new Date(l.createdAt).toLocaleDateString()}"\n`;
      });

      downloadCSV(csvContent, `Loans_Granular_Report_${selectedYear}.csv`);
    } else if (reportCategory === 'members') {
      csvContent += "SUMMARY BALANCE TOTALS\n";
      csvContent += `New Registrations,${rawReportData.summary?.newMembersJoined || 0}\n`;
      csvContent += `Total Active Registry,${rawReportData.summary?.totalActiveInSystem || 0}\n`;
      csvContent += `Total Pending Registry,${rawReportData.summary?.totalPendingInSystem || 0}\n`;
      csvContent += `Total Share Capital,${rawReportData.summary?.totalShareCapital || 0}\n`;
      csvContent += `Total Thrift Savings,${rawReportData.summary?.totalThriftSavings || 0}\n`;
      csvContent += `Total Liquid Deposits,${rawReportData.summary?.totalDeposits || 0}\n`;
      csvContent += `Total Capital Mobilization,${rawReportData.summary?.totalCapitalMobilization || 0}\n`;
      csvContent += `Total System Asset Balances,${rawReportData.summary?.totalAccountBalance || 0}\n\n`;

      csvContent += "MEMBERSHIP RECORDS\n";
      csvContent += "Member Identifier,Full Name,Email,Phone,Shares,Thrift,Deposits,Capital Mobilization,Total Balance,Origin,Status,Join Date\n";
      rawReportData.members?.forEach((m: any) => {
        csvContent += `"${m.memberIdentifier || ''}","${m.firstName} ${m.lastName}","${m.email}","${m.phoneNumber || ''}",${m.ledgerBalances?.shareCapital || 0},${m.ledgerBalances?.thriftSavings || 0},${m.ledgerBalances?.deposits || 0},${m.ledgerBalances?.capitalMobilization || 0},${m.accountBalance},"${m.isManual ? 'Manual' : 'Self Signup'}","${m.status}","${new Date(m.joinDate).toLocaleDateString()}"\n`;
      });

      downloadCSV(csvContent, `Members_Granular_Report_${selectedYear}.csv`);
    } else if (reportCategory === 'transactions') {
      csvContent += "TRANSACTION STATISTICS\n";
      csvContent += `Total Transactions,${rawReportData.summary?.count || 0}\n`;
      csvContent += `Total Volume,${rawReportData.summary?.totalVolume || 0}\n`;
      csvContent += `Share Capital Inflows,${rawReportData.summary?.ledger?.shareCapital || 0}\n`;
      csvContent += `Thrift Inflows,${rawReportData.summary?.ledger?.thriftSavings || 0}\n`;
      csvContent += `Deposits Inflows,${rawReportData.summary?.ledger?.deposits || 0}\n`;
      csvContent += `Capital Mobilization Inflows,${rawReportData.summary?.ledger?.capitalMobilization || 0}\n\n`;

      csvContent += "TRANSACTION LEDGER ENTRIES\n";
      csvContent += "Date,Borrower/Depositor,Member ID,Reference,Type,Amount,Status,Description,Initiated By,Approved By\n";
      rawReportData.transactions?.forEach((t: any) => {
        csvContent += `"${new Date(t.date).toLocaleDateString()}","${t.user?.firstName} ${t.user?.lastName}","${t.user?.memberIdentifier || ''}","${t.reference || ''}","${t.type}",${t.amount},"${t.status}","${t.description || ''}","${t.initiatedBy ? `${t.initiatedBy.firstName} ${t.initiatedBy.lastName}` : ''}","${t.approvedBy ? `${t.approvedBy.firstName} ${t.approvedBy.lastName}` : ''}"\n`;
      });

      downloadCSV(csvContent, `Transactions_Granular_Report_${selectedYear}.csv`);
    } else if (reportCategory === 'sureties') {
      csvContent += "COOPERATIVE RISK EXPOSURE\n";
      csvContent += `Guarantors Count,${rawReportData.summary?.totalGuarantorsCount || 0}\n`;
      csvContent += `Guarantors Exceeding Exposure Limit,${rawReportData.summary?.highRiskGuarantorsCount || 0}\n`;
      csvContent += `Combined Guaranteed Exposure Liability,${rawReportData.summary?.totalOutstandingExposureCombined || 0}\n\n`;

      csvContent += "ACTIVE GUARANTOR LIABILITY RANKINGS\n";
      csvContent += "Guarantor Name,Guaranteed Loans Count,Initial Guaranteed Sum,Outstanding Exposure,Phone,Email\n";
      rawReportData.guarantorExposureList?.forEach((g: any) => {
        csvContent += `"${g.guarantorDetails?.firstName} ${g.guarantorDetails?.lastName}",${g.guaranteedLoansCount},${g.totalInitialGuaranteed},${g.totalOutstandingExposure},"${g.guarantorDetails?.phoneNumber || ''}","${g.guarantorDetails?.email || ''}"\n`;
      });

      downloadCSV(csvContent, `Surety_Risk_Audit_${selectedYear}.csv`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Helper variables for computations/display
  const isMonthly = reportType === 'monthly';
  const data = rawReportData;
  const ledger = data?.financialSummary?.ledgerSummary || data?.ledgerSummary || data?.summary?.ledger || { shareCapital: 0, thriftSavings: 0, deposits: 0, capitalMobilization: 0 };
  const totalLedgerBalance = ledger.shareCapital + ledger.thriftSavings + ledger.deposits + ledger.capitalMobilization;
  const getLedgerPercent = (val: number) => {
    if (!totalLedgerBalance) return '0%';
    return `${Math.round((val / totalLedgerBalance) * 100)}%`;
  };

  return (
    <div className="space-y-8 pb-20 text-primary-text print-container">
      {/* Inject print-only styles that override screen layouts */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          header, nav, aside, button, select, input, label, .no-print, [role="dialog"], .sticky, .fixed {
            display: none !important;
          }
          body, html, main, .print-container, .lg\\:pl-80 {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            left: 0 !important;
            top: 0 !important;
            position: relative !important;
          }
          .lg\\:pl-80 {
            padding-left: 0 !important;
          }
          .card-premium, .card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            background: transparent !important;
            color: black !important;
            break-inside: avoid !important;
          }
          .text-emerald-500, .text-emerald-400 {
            color: #059669 !important;
          }
          .text-red-500, .text-red-400 {
            color: #dc2626 !important;
          }
          .text-primary, .text-primary-text {
            color: black !important;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            break-inside: auto !important;
          }
          tr {
            break-inside: avoid !important;
            break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
        }
      `}} />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 no-print">
        <div>
          <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">Intelligence Bureau</span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-primary-text">
            Financial <span className="text-tertiary-text">Audit</span>
          </h1>
        </div>
      </div>

      {/* Protocol Parameter Selector */}
      <div className="card-premium relative overflow-hidden group no-print">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
        <h2 className="text-xl font-black tracking-tighter mb-6 text-primary-text">Audit Configuration Setup</h2>
        
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-4 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Audit Target Category</label>
              <select
                value={reportCategory}
                onChange={(e) => {
                  setReportCategory(e.target.value as ReportCategory);
                  setRawReportData(null);
                }}
                className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="general" className="bg-background">General Financial Summary</option>
                <option value="loans" className="bg-background">Granular Loans Portfolio</option>
                <option value="members" className="bg-background">Granular Members Registry</option>
                <option value="transactions" className="bg-background">Ledger Transactions Audit</option>
                <option value="sureties" className="bg-background">Surety & Liability Exposure</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Report Cycle</label>
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value as 'monthly' | 'yearly');
                  setRawReportData(null);
                }}
                className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="monthly" className="bg-background">Monthly Cycle</option>
                <option value="yearly" className="bg-background">Annual Cycle</option>
              </select>
            </div>

            {reportType === 'monthly' ? (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Select Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                  >
                    {months.map((m) => (
                      <option key={m.value} value={m.value} className="bg-background">
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Select Year</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                  >
                    {years.map((y) => (
                      <option key={y} value={y} className="bg-background">
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="space-y-2 sm:col-span-2">
                <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Select Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-background">
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Dynamic Advanced Filters for granular audits */}
          {reportCategory !== 'general' && (
            <div className="grid gap-6 sm:grid-cols-3 border-t border-border/50 pt-6">
              {reportCategory === 'loans' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Filter by status</label>
                    <select
                      value={loanStatus}
                      onChange={(e) => setLoanStatus(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                    >
                      <option value="all">All Loan Statuses</option>
                      <option value="pending">Pending Approval</option>
                      <option value="approved">Approved</option>
                      <option value="active">Active (Disbursed)</option>
                      <option value="completed">Completed / Repaid</option>
                      <option value="defaulted">Defaulted (Bad Debt)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Interest Style</label>
                    <select
                      value={interestStyle}
                      onChange={(e) => setInterestStyle(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                    >
                      <option value="all">All Interest Styles</option>
                      <option value="upfront">Upfront Interest</option>
                      <option value="deferred">Deferred Interest</option>
                    </select>
                  </div>
                </>
              )}

              {reportCategory === 'members' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Membership Status</label>
                    <select
                      value={memberStatus}
                      onChange={(e) => setMemberStatus(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                    >
                      <option value="all">All Members Statuses</option>
                      <option value="active">Active Members</option>
                      <option value="pending">Pending Approval</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Enrolment Type</label>
                    <select
                      value={isManual}
                      onChange={(e) => setIsManual(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                    >
                      <option value="all">All Formats</option>
                      <option value="manual">Manual Enrolment</option>
                      <option value="auto">Self Signup / Portal</option>
                    </select>
                  </div>
                </>
              )}

              {reportCategory === 'transactions' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Transaction Type</label>
                    <select
                      value={txType}
                      onChange={(e) => setTxType(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                    >
                      <option value="all">All Types</option>
                      <option value="deposit">Deposit (Savings)</option>
                      <option value="withdrawal">Withdrawal</option>
                      <option value="loan_disbursement">Loan Disbursement</option>
                      <option value="loan_repayment">Loan Repayment</option>
                      <option value="interest_payment">Interest Payment</option>
                      <option value="fee">Processing / Portal Fee</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">Payment Status</label>
                    <select
                      value={txStatus}
                      onChange={(e) => setTxStatus(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed / Confirmed</option>
                      <option value="pending">Pending Approval</option>
                    </select>
                  </div>
                </>
              )}

              {reportCategory === 'sureties' && (
                <div className="space-y-2 col-span-2">
                  <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">
                    Guarantor Liability Limit Exposure (₦)
                  </label>
                  <input
                    type="number"
                    step="50000"
                    value={exposureThreshold}
                    onChange={(e) => setExposureThreshold(Number(e.target.value))}
                    className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-primary transition-all font-bold"
                    placeholder="Identify guarantors exceeding this outstanding sum"
                  />
                  <p className="text-[9px] text-tertiary-text ml-4">
                    Highlights members whose total liability in backing active loans exceeds this threshold.
                  </p>
                </div>
              )}

              {/* Float synthesize button inside filters row if column allows */}
              <div className="flex items-end justify-end h-full">
                <button 
                  onClick={handleGenerateReport} 
                  disabled={loading}
                  className="w-full btn-primary py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:tracking-[0.3em] transition-all duration-500 border-none disabled:opacity-50"
                >
                  {loading ? 'Synthesizing...' : 'Synthesize Advanced Audit'}
                </button>
              </div>
            </div>
          )}

          {reportCategory === 'general' && (
            <div className="flex justify-end pt-2 border-t border-border/20">
              <button 
                onClick={handleGenerateReport} 
                disabled={loading}
                className="btn-primary px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-[0_0_30px_rgba(59,130,246,0.1)] hover:tracking-[0.6em] transition-all duration-500 border-none disabled:opacity-50"
              >
                {loading ? 'Synthesizing...' : 'Synthesize General Summary'}
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-6 rounded-3xl flex items-start gap-4 no-print animate-fade-in">
          <FaExclamationCircle className="h-6 w-6 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-black tracking-tight text-red-500">Audit Protocol Fault</h4>
            <p className="text-sm opacity-90 mt-1">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center no-print">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-secondary-text font-black tracking-widest uppercase text-xs">Accessing Targeted Ledgers & Audits...</p>
        </div>
      )}

      {/* Generated Report Output */}
      {data && !loading && (
        <div className="space-y-8 print-container">
          
          {/* Print Headers */}
          <div className="hidden print:block border-b border-border pb-6 mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              Cooperative Financial Audit Report ({reportCategory.toUpperCase()})
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Generated on {new Date().toLocaleString()} | Period: {isMonthly ? `${selectedMonth}/${selectedYear}` : `Year ${selectedYear}`}
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/50 pb-6 no-print">
            <div className="text-sm font-black uppercase tracking-widest text-primary-text">
              Synthesized Result: <span className="text-primary">{reportCategory} audit</span>
            </div>

            {/* Print/Export Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 bg-surface hover:bg-border border border-border text-primary-text px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
              >
                <FaPrint className="text-primary text-sm" /> Print Report
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-2 btn-primary px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300"
              >
                <FaDownload className="text-sm" /> Export CSV
              </button>
            </div>
          </div>

          {/* ============================================================ */}
          {/* 1. GENERAL FINANCIAL SUMMARY LAYOUT */}
          {/* ============================================================ */}
          {reportCategory === 'general' && (
            <div className="space-y-8">
              {/* KPIs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                
                <div className="card-premium h-full flex flex-col justify-between border-emerald-500/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FaPiggyBank className="text-5xl" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Total Deposits</h3>
                    <p className="text-3xl font-black text-emerald-500 tracking-tighter">
                      {formatCurrency(isMonthly ? data.transactionSummary?.totalDeposits : data.annualTotals?.deposits)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[10px] font-bold text-secondary-text">
                    <FaArrowUp className="text-emerald-500" /> Inbound savings contribution
                  </div>
                </div>

                <div className="card-premium h-full flex flex-col justify-between border-red-500/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FaMoneyBillWave className="text-5xl" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Total Withdrawals</h3>
                    <p className="text-3xl font-black text-red-500 tracking-tighter">
                      {formatCurrency(isMonthly ? data.transactionSummary?.totalWithdrawals : data.annualTotals?.withdrawals)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[10px] font-bold text-secondary-text">
                    <FaArrowDown className="text-red-500" /> Outbound member withdrawals
                  </div>
                </div>

                <div className="card-premium h-full flex flex-col justify-between border-primary/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FaHandHoldingUsd className="text-5xl" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Loan Disbursements</h3>
                    <p className="text-3xl font-black text-primary-text tracking-tighter">
                      {formatCurrency(isMonthly ? data.transactionSummary?.totalLoanDisbursements : data.annualTotals?.loanDisbursements)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[10px] font-bold text-secondary-text">
                    <FaCalculator className="text-primary" /> Active loans payout volume
                  </div>
                </div>

                <div className="card-premium h-full flex flex-col justify-between border-blue-500/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FaCoins className="text-5xl" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Loan Repayments</h3>
                    <p className="text-3xl font-black text-primary tracking-tighter">
                      {formatCurrency(isMonthly ? data.transactionSummary?.totalLoanRepayments : data.annualTotals?.loanRepayments)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[10px] font-bold text-secondary-text">
                    <FaCheckCircle className="text-blue-500" /> Principal & interest collected
                  </div>
                </div>

                <div className="card-premium h-full flex flex-col justify-between bg-emerald-500/5 border-emerald-500/20 relative overflow-hidden group">
                  <div>
                    <h3 className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Net Cash Flow</h3>
                    <p className={`text-3xl font-black tracking-tighter ${
                      (isMonthly ? data.transactionSummary?.netCashFlow : data.annualTotals?.netCashFlow) >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {formatCurrency(isMonthly ? data.transactionSummary?.netCashFlow : data.annualTotals?.netCashFlow)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-emerald-500/10 text-[10px] font-bold text-secondary-text">
                    Deposits + Repayments - Outflows
                  </div>
                </div>

                <div className="card-premium h-full flex flex-col justify-between border-primary/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <FaUsers className="text-5xl" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Membership Registry</h3>
                    <p className="text-3xl font-black text-primary-text tracking-tighter">
                      {isMonthly ? data.memberSummary?.totalActiveMembers : data.totalActiveMembers}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-[10px] font-bold text-secondary-text">
                    <FaUserPlus className="text-primary" /> 
                    +{isMonthly ? data.memberSummary?.newMembers : data.newMembersList?.length || 0} registered in cycle
                  </div>
                </div>

                <div className="card-premium h-full flex flex-col justify-between bg-primary/5 border-primary/20 relative overflow-hidden group">
                  <div>
                    <h3 className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Aggregate Balance</h3>
                    <p className="text-3xl font-black text-primary tracking-tighter">
                      {formatCurrency(isMonthly ? data.financialSummary?.totalCooperativeBalance : data.loanStats?.totalLoanAmount)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-primary/10 text-[10px] font-bold text-secondary-text">
                    {isMonthly ? 'Total assets in system' : 'Aggregate issued credit limit'}
                  </div>
                </div>

                <div className="card-premium h-full flex flex-col justify-between border-amber-500/10 relative overflow-hidden group">
                  <div>
                    <h3 className="text-[10px] font-black text-tertiary-text uppercase tracking-[0.4em] mb-4">Processing Fees</h3>
                    <p className="text-3xl font-black text-amber-500 tracking-tighter">
                      {formatCurrency(isMonthly ? data.loanSummary?.totalProcessingFees : data.annualTotals?.processingFees)}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-500/10 text-[10px] font-bold text-secondary-text">
                    Cooperative processing service revenue
                  </div>
                </div>

              </div>

              {/* Local Tabs Selection for General Report */}
              <div className="flex bg-surface border border-border p-1 rounded-xl w-fit no-print">
                <button 
                  onClick={() => setActiveTab('overview')} 
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase ${activeTab === 'overview' ? 'bg-primary text-white' : 'text-secondary-text'}`}
                >
                  General Overview
                </button>
                <button 
                  onClick={() => setActiveTab('ledger')} 
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase ${activeTab === 'ledger' ? 'bg-primary text-white' : 'text-secondary-text'}`}
                >
                  Ledgers breakdown
                </button>
                <button 
                  onClick={() => setActiveTab('loans')} 
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase ${activeTab === 'loans' ? 'bg-primary text-white' : 'text-secondary-text'}`}
                >
                  Loans Statistics
                </button>
                <button 
                  onClick={() => setActiveTab('listings')} 
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase ${activeTab === 'listings' ? 'bg-primary text-white' : 'text-secondary-text'}`}
                >
                  {isMonthly ? 'Transactions & Members' : 'Monthly Breakdown'}
                </button>
              </div>

              {activeTab === 'overview' && (
                <div className="card-premium">
                  <h3 className="text-sm font-black uppercase tracking-widest text-primary-text mb-4">Report Summary Overview</h3>
                  <p className="text-sm text-secondary-text leading-relaxed">
                    During this audit cycle ({isMonthly ? `month of ${selectedMonth}/${selectedYear}` : `year of ${selectedYear}`}), the cooperative recorded a total transaction volume of <span className="text-primary-text font-black">{isMonthly ? data.transactionSummary?.transactionCount : data.annualTotals?.transactionCount}</span> entries.
                    The cash inflow via savings deposits stood at <span className="text-emerald-500 font-bold">{formatCurrency(isMonthly ? data.transactionSummary?.totalDeposits : data.annualTotals?.deposits)}</span>.
                    Net Cash Flow resulted in <span className={`font-bold ${(isMonthly ? data.transactionSummary?.netCashFlow : data.annualTotals?.netCashFlow) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(isMonthly ? data.transactionSummary?.netCashFlow : data.annualTotals?.netCashFlow)}</span>.
                    Total cooperative liquid resources are tracked at <span className="text-primary-text font-bold">{formatCurrency(isMonthly ? data.financialSummary?.totalCooperativeBalance : data.annualTotals?.deposits)}</span> with outstanding loans sitting at <span className="text-primary-text font-bold">{formatCurrency(isMonthly ? data.financialSummary?.totalOutstandingLoans : data.loanStats?.totalLoanAmount)}</span>.
                  </p>
                </div>
              )}

              {activeTab === 'ledger' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="card-premium">
                    <h3 className="text-lg font-black tracking-tight mb-2">Savings Ledger Allocation</h3>
                    <div className="space-y-6">
                      {[
                        { label: 'Share Capital', val: ledger.shareCapital, color: 'bg-primary' },
                        { label: 'Thrift Savings', val: ledger.thriftSavings, color: 'bg-emerald-500' },
                        { label: 'General Deposits', val: ledger.deposits, color: 'bg-blue-500' },
                        { label: 'Capital Mobilization', val: ledger.capitalMobilization, color: 'bg-amber-500' }
                      ].map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-black uppercase mb-2">
                            <span>{item.label}</span>
                            <span>{formatCurrency(item.val)} ({getLedgerPercent(item.val)})</span>
                          </div>
                          <div className="h-3 w-full bg-border/40 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color}`} style={{ width: getLedgerPercent(item.val) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card-premium bg-surface/50 justify-center flex flex-col">
                    <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-2">Ledger Allocations total</h4>
                    <p className="text-3xl font-black text-primary-text">{formatCurrency(totalLedgerBalance)}</p>
                    <p className="text-xs text-secondary-text mt-2 leading-relaxed">
                      This represents all pooled savings contribution categories collected during the specified cycle.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'loans' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="card-premium space-y-4">
                    <h3 className="text-sm font-black uppercase text-tertiary-text">Portfolio Stats</h3>
                    <div>
                      <span className="text-[10px] text-tertiary-text block">Total Issued Capital</span>
                      <span className="text-xl font-black text-primary-text">{formatCurrency(isMonthly ? data.loanSummary?.loanBreakdown?.upfrontAmount + data.loanSummary?.loanBreakdown?.deferredAmount : data.loanStats?.totalLoanAmount)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-tertiary-text block">Total Interest Earned</span>
                      <span className="text-xl font-black text-emerald-500">{formatCurrency(isMonthly ? data.loanSummary?.totalInterestEarned : data.loanStats?.totalInterestEarned)}</span>
                    </div>
                  </div>
                  <div className="card-premium col-span-2">
                    <h3 className="text-sm font-black uppercase text-tertiary-text mb-4">Application Status Counts</h3>
                    <div className="grid grid-cols-4 gap-4 text-center">
                      {[
                        { label: 'Active', val: data.loanSummary?.loanStatusSummary?.active + data.loanSummary?.loanStatusSummary?.approved || data.loanStatusSummary?.active + data.loanStatusSummary?.approved || 0 },
                        { label: 'Completed', val: data.loanSummary?.loanStatusSummary?.completed || data.loanStatusSummary?.completed || 0 },
                        { label: 'Pending', val: data.loanSummary?.loanStatusSummary?.pending || data.loanStatusSummary?.pending || 0 },
                        { label: 'Defaulted', val: data.loanSummary?.loanStatusSummary?.defaulted || data.loanStatusSummary?.defaulted || 0 }
                      ].map((item, idx) => (
                        <div key={idx} className="bg-surface border border-border p-3 rounded-xl">
                          <span className="text-[9px] font-black uppercase text-tertiary-text block mb-1">{item.label}</span>
                          <span className="text-2xl font-black text-primary-text">{item.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'listings' && (
                <div className="space-y-6">
                  {isMonthly ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <div className="card-premium">
                        <h3 className="text-base font-black tracking-tight mb-4">Recent Transactions</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="border-b border-border uppercase font-black tracking-wider text-tertiary-text">
                              <tr>
                                <th className="py-2">Member</th>
                                <th className="py-2">Type</th>
                                <th className="py-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.recentTransactions?.map((tx: any, idx: number) => (
                                <tr key={idx} className="border-b border-border/40">
                                  <td className="py-2.5 font-bold">{tx.user?.firstName} {tx.user?.lastName}</td>
                                  <td className="py-2.5 uppercase font-black text-primary">{tx.type}</td>
                                  <td className="py-2.5 text-right font-black">{formatCurrency(tx.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="card-premium">
                        <h3 className="text-base font-black tracking-tight mb-4">Recent Loans</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="border-b border-border uppercase font-black tracking-wider text-tertiary-text">
                              <tr>
                                <th className="py-2">Borrower</th>
                                <th className="py-2">Style</th>
                                <th className="py-2 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.recentLoans?.map((l: any, idx: number) => (
                                <tr key={idx} className="border-b border-border/40">
                                  <td className="py-2.5 font-bold">{l.user?.firstName} {l.user?.lastName}</td>
                                  <td className="py-2.5 uppercase font-black text-primary">{l.interestStyle}</td>
                                  <td className="py-2.5 text-right font-black">{formatCurrency(l.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="card-premium">
                      <h3 className="text-base font-black tracking-tight mb-4">Monthly Breakdown</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="border-b border-border text-[10px] text-tertiary-text uppercase font-black tracking-wider">
                            <tr>
                              <th className="py-3">Month</th>
                              <th className="py-3 text-right">Deposits</th>
                              <th className="py-3 text-right">Withdrawals</th>
                              <th className="py-3 text-right">Disbursements</th>
                              <th className="py-3 text-right">Repayments</th>
                              <th className="py-3 text-right">Net Flow</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.monthlyData?.map((m: any, idx: number) => (
                              <tr key={idx} className="border-b border-border/40">
                                <td className="py-3.5 font-black">{m.monthName}</td>
                                <td className="py-3.5 text-right text-emerald-500 font-bold">{formatCurrency(m.deposits)}</td>
                                <td className="py-3.5 text-right text-red-500">{formatCurrency(m.withdrawals)}</td>
                                <td className="py-3.5 text-right">{formatCurrency(m.loanDisbursements)}</td>
                                <td className="py-3.5 text-right text-primary">{formatCurrency(m.loanRepayments)}</td>
                                <td className={`py-3.5 text-right font-black ${m.netCashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{formatCurrency(m.netCashFlow)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* ============================================================ */}
          {/* 2. GRANULAR LOANS REPORT LAYOUT */}
          {/* ============================================================ */}
          {reportCategory === 'loans' && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Loans Count</span>
                  <span className="text-3xl font-black text-primary-text">{data.summary?.totalCount || 0}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Principal Capital Payout</span>
                  <span className="text-3xl font-black text-emerald-500">{formatCurrency(data.summary?.totalPrincipal)}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Total Outstanding Remaining</span>
                  <span className="text-3xl font-black text-red-500">{formatCurrency(data.summary?.remainingAmount)}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Processing Fees Collected</span>
                  <span className="text-3xl font-black text-amber-500">{formatCurrency(data.summary?.processingFees)}</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="card-premium">
                <h3 className="text-base font-black tracking-tight mb-4">Detailed Loan Listings</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-border uppercase font-black text-tertiary-text">
                      <tr>
                        <th className="py-3">Borrower Name</th>
                        <th className="py-3 text-right">Principal</th>
                        <th className="py-3">Interest Style</th>
                        <th className="py-3 text-right">Rate</th>
                        <th className="py-3 text-right">Monthly Installment</th>
                        <th className="py-3 text-right">Remaining Bal</th>
                        <th className="py-3">Sureties Status</th>
                        <th className="py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {data.loans && data.loans.length > 0 ? (
                        data.loans.map((loan: any) => (
                          <tr key={loan._id}>
                            <td className="py-3.5">
                              <div className="font-bold text-primary-text">{loan.user?.firstName} {loan.user?.lastName}</div>
                              <span className="text-[9px] text-secondary-text">{loan.user?.memberIdentifier || loan.user?.accountNumber || 'Manual Member'}</span>
                            </td>
                            <td className="py-3.5 text-right font-black">{formatCurrency(loan.amount)}</td>
                            <td className="py-3.5 uppercase font-black">{loan.interestStyle}</td>
                            <td className="py-3.5 text-right">{loan.interestRate}%</td>
                            <td className="py-3.5 text-right">{formatCurrency(loan.monthlyPayment)}</td>
                            <td className="py-3.5 text-right text-red-500 font-bold">{formatCurrency(loan.remainingAmount)}</td>
                            <td className="py-3.5">
                              <div className="space-y-1">
                                {loan.sureties && loan.sureties.length > 0 ? (
                                  loan.sureties.map((s: any, idx: number) => (
                                    <div key={idx} className="text-[10px]">
                                      {s.user?.firstName} {s.user?.lastName}: <span className={`font-bold ${s.status === 'approved' ? 'text-emerald-500' : 'text-amber-500'}`}>{s.status}</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-secondary-text italic text-[10px]">No sureties requested</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 text-center">
                              <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${
                                loan.status === 'active' || loan.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                loan.status === 'completed' || loan.status === 'repaid' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                loan.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                                {loan.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-secondary-text">No loans found matching criteria.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. GRANULAR MEMBERS REPORT LAYOUT */}
          {/* ============================================================ */}
          {reportCategory === 'members' && (
            <div className="space-y-8">
              {/* Summary stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">New Registrations</span>
                  <span className="text-3xl font-black text-primary-text">{data.summary?.newMembersJoined || 0}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">New Share Capital Payout</span>
                  <span className="text-3xl font-black text-emerald-500">{formatCurrency(data.summary?.totalShareCapital)}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">New Thrift Savings Payout</span>
                  <span className="text-3xl font-black text-blue-500">{formatCurrency(data.summary?.totalThriftSavings)}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Aggregate Asset Balances</span>
                  <span className="text-3xl font-black text-primary">{formatCurrency(data.summary?.totalAccountBalance)}</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="card-premium">
                <h3 className="text-base font-black tracking-tight mb-4">Membership Registry Logs</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-border uppercase font-black text-tertiary-text">
                      <tr>
                        <th className="py-3">Member Details</th>
                        <th className="py-3">Email Address</th>
                        <th className="py-3 text-right">Share Capital</th>
                        <th className="py-3 text-right">Thrift Savings</th>
                        <th className="py-3 text-right">Total Balance</th>
                        <th className="py-3 text-center">Origin</th>
                        <th className="py-3 text-center">Status</th>
                        <th className="py-3 text-right">Join Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {data.members && data.members.length > 0 ? (
                        data.members.map((member: any) => (
                          <tr key={member._id}>
                            <td className="py-3.5">
                              <div className="font-bold text-primary-text">{member.firstName} {member.lastName}</div>
                              <span className="text-[9px] text-secondary-text">{member.memberIdentifier || 'Pending ID'}</span>
                            </td>
                            <td className="py-3.5 text-secondary-text">{member.email}</td>
                            <td className="py-3.5 text-right">{formatCurrency(member.ledgerBalances?.shareCapital)}</td>
                            <td className="py-3.5 text-right">{formatCurrency(member.ledgerBalances?.thriftSavings)}</td>
                            <td className="py-3.5 text-right font-black text-primary-text">{formatCurrency(member.accountBalance)}</td>
                            <td className="py-3.5 text-center uppercase text-[10px] font-black">{member.isManual ? 'Manual' : 'Self-Signup'}</td>
                            <td className="py-3.5 text-center">
                              <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full border ${
                                member.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                              }`}>
                                {member.status}
                              </span>
                            </td>
                            <td className="py-3.5 text-right text-secondary-text">{new Date(member.joinDate).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-secondary-text">No members joined during this period.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 4. LEDGER TRANSACTIONS AUDIT LAYOUT */}
          {/* ============================================================ */}
          {reportCategory === 'transactions' && (
            <div className="space-y-8">
              {/* Summary Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Transaction Count</span>
                  <span className="text-3xl font-black text-primary-text">{data.summary?.count || 0}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Total Transaction Volume</span>
                  <span className="text-3xl font-black text-emerald-500">{formatCurrency(data.summary?.totalVolume)}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Share Capital Contributions</span>
                  <span className="text-3xl font-black text-primary">{formatCurrency(data.summary?.ledger?.shareCapital)}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Thrift Savings Contributions</span>
                  <span className="text-3xl font-black text-blue-500">{formatCurrency(data.summary?.ledger?.thriftSavings)}</span>
                </div>
              </div>

              {/* Data Table */}
              <div className="card-premium">
                <h3 className="text-base font-black tracking-tight mb-4">Detailed Transaction Ledger Entries</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="border-b border-border uppercase font-black text-tertiary-text">
                      <tr>
                        <th className="py-3">Date</th>
                        <th className="py-3">Member</th>
                        <th className="py-3">Reference Code</th>
                        <th className="py-3">Type</th>
                        <th className="py-3 text-right">Amount</th>
                        <th className="py-3">Description</th>
                        <th className="py-3">Auditors (Audit Log)</th>
                        <th className="py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-medium">
                      {data.transactions && data.transactions.length > 0 ? (
                        data.transactions.map((tx: any) => (
                          <tr key={tx._id}>
                            <td className="py-3.5 text-secondary-text">{new Date(tx.date).toLocaleDateString()}</td>
                            <td className="py-3.5">
                              <div className="font-bold text-primary-text">{tx.user?.firstName} {tx.user?.lastName}</div>
                              <span className="text-[9px] text-secondary-text">{tx.user?.memberIdentifier || tx.user?.accountNumber || 'Manual Member'}</span>
                            </td>
                            <td className="py-3.5 font-bold">{tx.reference || 'N/A'}</td>
                            <td className="py-3.5">
                              <span className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${
                                tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                tx.type === 'withdrawal' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                tx.type === 'loan_repayment' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                'bg-primary/10 text-primary border-primary/20'
                              }`}>
                                {tx.type.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3.5 text-right font-black text-primary-text">{formatCurrency(tx.amount)}</td>
                            <td className="py-3.5 text-secondary-text">{tx.description || tx.purpose || 'None'}</td>
                            <td className="py-3.5 text-xs text-secondary-text">
                              <div>Initiator: <span className="font-bold">{tx.initiatedBy ? `${tx.initiatedBy.firstName} ${tx.initiatedBy.lastName}` : 'N/A'}</span></div>
                              <div>Approver: <span className="font-bold">{tx.approvedBy ? `${tx.approvedBy.firstName} ${tx.approvedBy.lastName}` : 'N/A'}</span></div>
                            </td>
                            <td className="py-3.5 text-center">
                              <span className={`text-[10px] uppercase font-black ${
                                tx.status === 'completed' ? 'text-emerald-500' : tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-secondary-text">No transaction logs match filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 5. SURETY RISK & LIABILITY AUDIT LAYOUT */}
          {/* ============================================================ */}
          {reportCategory === 'sureties' && (
            <div className="space-y-8">
              {/* Risk Alert Indicator */}
              {data.summary?.highRiskGuarantorsCount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 p-6 rounded-3xl flex items-start gap-4 no-print">
                  <FaExclamationTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black tracking-tight text-amber-500">Guarantor Risk Alerts Detected</h4>
                    <p className="text-sm opacity-90 mt-1">
                      We detected <span className="font-black text-amber-500">{data.summary.highRiskGuarantorsCount} members</span> who guarantee active loans exceeding your exposure threshold of <span className="font-black">{formatCurrency(exposureThreshold)}</span>. Highly exposed guarantors represent credit concentration risks.
                    </p>
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Guarantors Count</span>
                  <span className="text-3xl font-black text-primary-text">{data.summary?.totalGuarantorsCount || 0}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Exceeding Exposure Threshold</span>
                  <span className="text-3xl font-black text-amber-500">{data.summary?.highRiskGuarantorsCount || 0}</span>
                </div>
                <div className="card-premium">
                  <span className="text-[9px] uppercase tracking-widest text-tertiary-text block mb-1">Combined Guarantees Outstanding Exposure</span>
                  <span className="text-3xl font-black text-red-500">{formatCurrency(data.summary?.totalOutstandingExposureCombined)}</span>
                </div>
              </div>

              {/* Local tabs selection */}
              <div className="flex bg-surface border border-border p-1 rounded-xl w-fit no-print">
                <button 
                  onClick={() => setActiveTab('exposure')} 
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase ${activeTab === 'exposure' ? 'bg-primary text-white' : 'text-secondary-text'}`}
                >
                  Risk Exposure Rankings
                </button>
                <button 
                  onClick={() => setActiveTab('history')} 
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase ${activeTab === 'history' ? 'bg-primary text-white' : 'text-secondary-text'}`}
                >
                  Surety Requests History ({data.suretiesHistory?.length || 0})
                </button>
              </div>

              {activeTab === 'exposure' && (
                <div className="card-premium">
                  <h3 className="text-base font-black tracking-tight mb-4">Active Guarantor Liability Risk Rankings</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-border uppercase font-black text-tertiary-text">
                        <tr>
                          <th className="py-3">Guarantor Name</th>
                          <th className="py-3 text-center">Guaranteed Loans Count</th>
                          <th className="py-3 text-right">Initial Guaranteed Sum</th>
                          <th className="py-3 text-right">Outstanding Exposure (Remaining)</th>
                          <th className="py-3">Phone number</th>
                          <th className="py-3">Email Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {data.guarantorExposureList && data.guarantorExposureList.length > 0 ? (
                          data.guarantorExposureList.map((g: any) => (
                            <tr key={g._id} className={g.totalOutstandingExposure >= exposureThreshold ? 'bg-red-500/5' : ''}>
                              <td className="py-3.5">
                                <div className="font-bold text-primary-text">{g.guarantorDetails?.firstName} {g.guarantorDetails?.lastName}</div>
                                <span className="text-[9px] text-secondary-text">{g.guarantorDetails?.memberIdentifier || 'N/A'}</span>
                              </td>
                              <td className="py-3.5 text-center font-bold text-primary-text">{g.guaranteedLoansCount}</td>
                              <td className="py-3.5 text-right">{formatCurrency(g.totalInitialGuaranteed)}</td>
                              <td className="py-3.5 text-right font-black text-red-500">{formatCurrency(g.totalOutstandingExposure)}</td>
                              <td className="py-3.5 text-secondary-text">{g.guarantorDetails?.phoneNumber || 'N/A'}</td>
                              <td className="py-3.5 text-secondary-text">{g.guarantorDetails?.email}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-secondary-text">No guarantors found exceeding the exposure threshold limit.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="card-premium">
                  <h3 className="text-base font-black tracking-tight mb-4">Guarantees/Surety Request Logs (Created in Cycle)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-border uppercase font-black text-tertiary-text">
                        <tr>
                          <th className="py-3">Date</th>
                          <th className="py-3">Borrower (Member)</th>
                          <th className="py-3 text-right">Loan Amount</th>
                          <th className="py-3">Guarantors Status Details</th>
                          <th className="py-3 text-center">Loan Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {data.suretiesHistory && data.suretiesHistory.length > 0 ? (
                          data.suretiesHistory.map((lh: any) => (
                            <tr key={lh._id}>
                              <td className="py-3.5 text-secondary-text">{new Date(lh.createdAt).toLocaleDateString()}</td>
                              <td className="py-3.5 font-bold text-primary-text">
                                {lh.user?.firstName} {lh.user?.lastName}
                                <span className="text-[9px] block text-secondary-text">{lh.user?.memberIdentifier || lh.user?.accountNumber || 'Manual Member'}</span>
                              </td>
                              <td className="py-3.5 text-right font-black">{formatCurrency(lh.amount)}</td>
                              <td className="py-3.5">
                                <div className="space-y-1">
                                  {lh.sureties?.map((s: any, idx: number) => (
                                    <div key={idx} className="text-xs">
                                      <span className="font-bold">{s.user?.firstName} {s.user?.lastName}</span>: <span className={s.status === 'approved' ? 'text-emerald-500 font-bold' : 'text-amber-500'}>{s.status}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="py-3.5 text-center">
                                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full border ${
                                  lh.status === 'active' || lh.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                  {lh.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-secondary-text">No loans with sureties created during this period.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {!data && !loading && (
        <div className="card-premium py-20 text-center flex flex-col items-center justify-center border-dashed border-2">
          <FaRegFileAlt className="text-tertiary-text text-5xl mb-4 animate-pulse" />
          <h3 className="text-lg font-black uppercase tracking-tight text-primary-text">No active audit synthesized</h3>
          <p className="text-sm text-secondary-text max-w-sm mt-2">
            Configure the audit target parameters and select advanced filters above to synthesize a financial audit report.
          </p>
        </div>
      )}
    </div>
  );
}