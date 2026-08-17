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
  FaShieldAlt,
  FaAward,
  FaBalanceScale,
  FaFileInvoiceDollar,
  FaChartPie,
  FaBookReader,
  FaBuilding,
  FaGavel,
  FaHandshake
} from 'react-icons/fa';

type ReportCategory = 'general' | 'loans' | 'members' | 'transactions' | 'sureties' | 'agm';

export default function Reports() {
  const [reportCategory, setReportCategory] = useState<ReportCategory>('general');
  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AGM Custom variables
  const [agmExpenses, setAgmExpenses] = useState<string>('0');
  // Appropriation percentage rates (% of Net Surplus)
  const [reserveFundRate, setReserveFundRate] = useState<string>('15');
  const [educationFundRate, setEducationFundRate] = useState<string>('10');
  // Dividend/Interest rates per equity stream
  const [shareRate, setShareRate] = useState<string>('5');
  const [savingsRate, setSavingsRate] = useState<string>('5');
  const [depositRate, setDepositRate] = useState<string>('6');
  const [capitalMobRate, setCapitalMobRate] = useState<string>('7');
  // Percentage-based appropriation items (% of Net Surplus)
  const [committeeSittingRate, setCommitteeSittingRate] = useState<string>('10');
  const [secretaryHonorariumRate, setSecretaryHonorariumRate] = useState<string>('1');
  // Fixed-amount appropriation items (₦)
  const [entertainment, setEntertainment] = useState<string>('0');
  const [stationery, setStationery] = useState<string>('0');
  const [provisionBadDebt, setProvisionBadDebt] = useState<string>('0');
  const [miscExpenses, setMiscExpenses] = useState<string>('0');
  // Custom line items
  const [customItems, setCustomItems] = useState<{name: string, amount: string}[]>([]);
  // Member schedule display options
  const [showMemberNames, setShowMemberNames] = useState<boolean>(true);
  
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
      
      if (reportCategory === 'agm') {
        response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/agm`, {
          ...config,
          params: { 
            year: selectedYear,
            expenses: parseFloat(agmExpenses) || 0,
            reserveFundRate: parseFloat(reserveFundRate) || 15,
            educationFundRate: parseFloat(educationFundRate) || 10,
            shareRate: parseFloat(shareRate) || 5,
            savingsRate: parseFloat(savingsRate) || 5,
            depositRate: parseFloat(depositRate) || 6,
            capitalMobRate: parseFloat(capitalMobRate) || 7,
            committeeSittingRate: parseFloat(committeeSittingRate) || 10,
            secretaryHonorariumRate: parseFloat(secretaryHonorariumRate) || 1,
            entertainment: parseFloat(entertainment) || 0,
            stationery: parseFloat(stationery) || 0,
            provisionBadDebt: parseFloat(provisionBadDebt) || 0,
            miscExpenses: parseFloat(miscExpenses) || 0,
            customItems: JSON.stringify(customItems.filter(i => i.name && parseFloat(i.amount) > 0))
          },
        });
      } else if (reportCategory === 'general') {
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

  const handleGenerateAGMReport = async (targetYearParam?: string) => {
    const y = targetYearParam || selectedYear;
    setReportCategory('agm');
    setReportType('yearly');
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/agm`, {
        ...config,
        params: { 
          year: y,
          expenses: parseFloat(agmExpenses) || 0,
          reserveFundRate: parseFloat(reserveFundRate) || 15,
          educationFundRate: parseFloat(educationFundRate) || 10,
          shareRate: parseFloat(shareRate) || 5,
          savingsRate: parseFloat(savingsRate) || 5,
          depositRate: parseFloat(depositRate) || 6,
          capitalMobRate: parseFloat(capitalMobRate) || 7,
          committeeSittingRate: parseFloat(committeeSittingRate) || 10,
          secretaryHonorariumRate: parseFloat(secretaryHonorariumRate) || 1,
          entertainment: parseFloat(entertainment) || 0,
          stationery: parseFloat(stationery) || 0,
          provisionBadDebt: parseFloat(provisionBadDebt) || 0,
          miscExpenses: parseFloat(miscExpenses) || 0,
          customItems: JSON.stringify(customItems.filter(i => i.name && parseFloat(i.amount) > 0))
        },
      });
      setRawReportData(response.data);
      setActiveTab('overview');
    } catch (err: any) {
      console.error('Error generating AGM report:', err);
      setError(err?.response?.data?.message || 'Failed to synthesize AGM Report. Please check your credentials or API connection.');
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
    } else if (reportCategory === 'agm') {
      csvContent += "STATUTORY ANNUAL GENERAL MEETING (AGM) REPORT\n";
      csvContent += `Cooperative Name,"${rawReportData.governance?.cooperativeName || ''}"\n`;
      csvContent += `Fiscal Year,${rawReportData.governance?.fiscalYear || selectedYear}\n`;
      csvContent += `Generated At,"${new Date(rawReportData.generatedAt || Date.now()).toLocaleString()}"\n\n`;

      csvContent += "MEMBERSHIP DEMOGRAPHICS & GROWTH\n";
      csvContent += `Total Members,${rawReportData.membershipStats?.totalMembers || 0}\n`;
      csvContent += `Active Members,${rawReportData.membershipStats?.activeMembers || 0}\n`;
      csvContent += `Pending Members,${rawReportData.membershipStats?.pendingMembers || 0}\n`;
      csvContent += `New Members Admitted (${selectedYear}),${rawReportData.membershipStats?.newMembersCount || 0}\n`;
      csvContent += `Self-Signup Enrolment,${rawReportData.membershipStats?.selfSignups || 0}\n`;
      csvContent += `Manual Enrolment,${rawReportData.membershipStats?.manualEnrolments || 0}\n\n`;

      csvContent += "STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)\n";
      csvContent += "Category,Amount (NGN)\n";
      csvContent += `Liquid Bank/Account Balances,${rawReportData.balanceSheet?.assets?.liquidBalances || 0}\n`;
      csvContent += `Outstanding Loans Receivable,${rawReportData.balanceSheet?.assets?.outstandingLoansReceivable || 0}\n`;
      csvContent += `TOTAL COOPERATIVE ASSETS,${rawReportData.balanceSheet?.assets?.aggregateCooperativeAssets || 0}\n`;
      csvContent += `Share Capital Pool,${rawReportData.balanceSheet?.equityAndLiabilities?.shareCapital || 0}\n`;
      csvContent += `Thrift Savings Pool,${rawReportData.balanceSheet?.equityAndLiabilities?.thriftSavings || 0}\n`;
      csvContent += `General Deposits Pool,${rawReportData.balanceSheet?.equityAndLiabilities?.generalDeposits || 0}\n`;
      csvContent += `Capital Mobilization Pool,${rawReportData.balanceSheet?.equityAndLiabilities?.capitalMobilization || 0}\n`;
      csvContent += `TOTAL MEMBERS EQUITY,${rawReportData.balanceSheet?.equityAndLiabilities?.totalMemberEquity || 0}\n\n`;

      csvContent += "INCOME & EXPENDITURE STATEMENT\n";
      csvContent += `Loan Interest Earned,${rawReportData.incomeAndExpenditure?.revenue?.loanInterestEarned || 0}\n`;
      csvContent += `Processing Fees Earned,${rawReportData.incomeAndExpenditure?.revenue?.processingFeesEarned || 0}\n`;
      csvContent += `Other Fee Revenue,${rawReportData.incomeAndExpenditure?.revenue?.otherFeeRevenue || 0}\n`;
      csvContent += `Total Annual Deposits,${rawReportData.incomeAndExpenditure?.cashFlow?.totalDeposits || 0}\n`;
      csvContent += `Total Annual Withdrawals,${rawReportData.incomeAndExpenditure?.cashFlow?.totalWithdrawals || 0}\n`;
      csvContent += `Total Loan Disbursements,${rawReportData.incomeAndExpenditure?.cashFlow?.totalLoanDisbursements || 0}\n`;
      csvContent += `Total Loan Repayments,${rawReportData.incomeAndExpenditure?.cashFlow?.totalLoanRepayments || 0}\n`;
      csvContent += `NET OPERATING SURPLUS / CASH FLOW,${rawReportData.incomeAndExpenditure?.cashFlow?.netCashFlow || 0}\n\n`;

      csvContent += "LOAN PORTFOLIO PERFORMANCE\n";
      csvContent += `Loans Issued Count,${rawReportData.loanPortfolio?.totalLoansIssuedCount || 0}\n`;
      csvContent += `Loans Issued Amount,${rawReportData.loanPortfolio?.totalLoansIssuedAmount || 0}\n`;
      csvContent += `Active Loans Count,${rawReportData.loanPortfolio?.activeLoansCount || 0}\n`;
      csvContent += `Active Loans Amount,${rawReportData.loanPortfolio?.activeLoansAmount || 0}\n`;
      csvContent += `Completed Loans Count,${rawReportData.loanPortfolio?.completedLoansCount || 0}\n`;
      csvContent += `Defaulted Loans Count,${rawReportData.loanPortfolio?.defaultedLoansCount || 0}\n`;
      csvContent += `Delinquency Rate (%),${rawReportData.loanPortfolio?.delinquencyRate || 0}%\n\n`;

      csvContent += "SURETY & RISK EXPOSURE AUDIT\n";
      csvContent += `Total Guarantors Count,${rawReportData.suretyRisk?.totalGuarantorsCount || 0}\n`;
      csvContent += `Total Guaranteed Exposure,${rawReportData.suretyRisk?.totalGuaranteedLiability || 0}\n`;
      csvContent += `Guarantors Exceeding 500k Exposure,${rawReportData.suretyRisk?.highRiskGuarantorsCount || 0}\n\n`;

      csvContent += "PROPOSED APPROPRIATION ACCOUNT\n";
      csvContent += "S/N,Narration,Rate/Basis,Amount (NGN)\n";
      rawReportData.dividendProjection?.appropriationAccount?.lineItems?.forEach((item: any, idx: number) => {
        csvContent += `${idx + 1},"${item.name}","${item.rate} of ${item.basis}",${item.amount}\n`;
      });
      csvContent += `,"General Reserve (Balancing Figure)",,${rawReportData.dividendProjection?.appropriationAccount?.generalReserve || 0}\n`;
      csvContent += `,"TOTAL",,${rawReportData.dividendProjection?.appropriationAccount?.netSurplus || 0}\n\n`;

      csvContent += "MEMBER DIVIDEND SCHEDULE\n";
      csvContent += `Member Identifier,${showMemberNames ? 'Member Name,' : ''}Share Capital (NGN),Dividend on Shares (NGN),Thrift Savings (NGN),Interest on Savings (NGN),Deposits (NGN),Interest on Deposits (NGN),Capital Mobilization (NGN),Rebate on Cap. Mob. (NGN),Total Dividend (NGN),Status\n`;
      rawReportData.dividendProjection?.dividendSchedule?.forEach((m: any) => {
        csvContent += `"${m.memberIdentifier || 'N/A'}",${showMemberNames ? `"${m.name}",` : ''}${m.shareCapital},${m.shareDividend || 0},${m.thriftSavings},${m.savingsInterest || 0},${m.deposits},${m.depositInterest || 0},${m.capitalMobilization},${m.capitalMobRebate || 0},${m.totalDividend || 0},"${m.status}"\n`;
      });

      downloadCSV(csvContent, `AGM_Annual_Report_${selectedYear}.csv`);
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

      {/* Statutory AGM Report Generator Banner Card */}
      <div className="card-premium relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-primary/10 to-amber-500/10 border border-emerald-500/30 p-6 sm:p-8 rounded-3xl no-print shadow-[0_0_50px_rgba(16,185,129,0.05)]">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border border-emerald-500/30">
                Statutory AGM Feature
              </span>
              <span className="text-tertiary-text text-xs font-bold">• Full ICA & Statutory Compliance</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-primary-text">
              Annual General Meeting (AGM) Comprehensive Packet
            </h2>
            <p className="text-sm text-secondary-text leading-relaxed">
              Synthesize your cooperative's complete statutory AGM report from members records with a single click. Includes Governance, Balance Sheet, P&L, Loan Health, Surety Risk, and Dividend Schedules.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            <div className="flex flex-col gap-1 min-w-[120px]">
              <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-1">Fiscal Year</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full bg-surface border border-border rounded-2xl px-5 py-4 text-primary-text text-sm font-black outline-none focus:border-emerald-500 transition-all cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y} className="bg-background">
                    FY {y}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex flex-col gap-1 min-w-[150px]">
              <span className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-1">Expenses (₦)</span>
              <input
                type="number"
                min="0"
                placeholder="e.g. 50000"
                value={agmExpenses}
                onChange={(e) => setAgmExpenses(e.target.value)}
                className="w-full bg-surface border border-border rounded-2xl px-5 py-4 text-primary-text text-sm font-bold outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Collapsible Appropriation Configuration */}
            <details className="w-full lg:w-auto">
              <summary className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 cursor-pointer hover:text-emerald-400 transition-colors select-none">
                ▸ Configure Appropriation Rates
              </summary>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {/* Statutory Rates */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Reserve Fund (%)</span>
                  <input type="number" min="0" max="100" value={reserveFundRate} onChange={(e) => setReserveFundRate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Education Fund (%)</span>
                  <input type="number" min="0" max="100" value={educationFundRate} onChange={(e) => setEducationFundRate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest ml-1">Share Div. (%)</span>
                  <input type="number" min="0" max="100" value={shareRate} onChange={(e) => setShareRate(e.target.value)}
                    className="w-full bg-surface border border-emerald-500/30 rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest ml-1">Savings Int. (%)</span>
                  <input type="number" min="0" max="100" value={savingsRate} onChange={(e) => setSavingsRate(e.target.value)}
                    className="w-full bg-surface border border-emerald-500/30 rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest ml-1">Deposit Int. (%)</span>
                  <input type="number" min="0" max="100" value={depositRate} onChange={(e) => setDepositRate(e.target.value)}
                    className="w-full bg-surface border border-emerald-500/30 rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest ml-1">Cap. Mob. Rebate (%)</span>
                  <input type="number" min="0" max="100" value={capitalMobRate} onChange={(e) => setCapitalMobRate(e.target.value)}
                    className="w-full bg-surface border border-emerald-500/30 rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Committee (%)</span>
                  <input type="number" min="0" max="100" value={committeeSittingRate} onChange={(e) => setCommitteeSittingRate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Sec. Hon. (%)</span>
                  <input type="number" min="0" max="100" value={secretaryHonorariumRate} onChange={(e) => setSecretaryHonorariumRate(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Entertainment (₦)</span>
                  <input type="number" min="0" value={entertainment} onChange={(e) => setEntertainment(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Stationery (₦)</span>
                  <input type="number" min="0" value={stationery} onChange={(e) => setStationery(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Prov. Bad Debt (₦)</span>
                  <input type="number" min="0" value={provisionBadDebt} onChange={(e) => setProvisionBadDebt(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Misc. Expenses (₦)</span>
                  <input type="number" min="0" value={miscExpenses} onChange={(e) => setMiscExpenses(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2.5 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                </div>
              </div>

              {/* Custom Line Items */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-1">Custom Line Items</span>
                  <button
                    onClick={() => setCustomItems([...customItems, { name: '', amount: '0' }])}
                    className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors"
                  >
                    + Add Item
                  </button>
                </div>
                {customItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input type="text" placeholder="Item name" value={item.name}
                      onChange={(e) => { const updated = [...customItems]; updated[idx].name = e.target.value; setCustomItems(updated); }}
                      className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                    <input type="number" min="0" placeholder="₦ Amount" value={item.amount}
                      onChange={(e) => { const updated = [...customItems]; updated[idx].amount = e.target.value; setCustomItems(updated); }}
                      className="w-28 bg-surface border border-border rounded-xl px-3 py-2 text-primary-text text-xs font-bold outline-none focus:border-emerald-500 transition-all" />
                    <button onClick={() => setCustomItems(customItems.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300 text-xs font-black px-2">✕</button>
                  </div>
                ))}
              </div>

              {/* Show Member Names Toggle */}
              <div className="mt-3 flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={showMemberNames} onChange={(e) => setShowMemberNames(e.target.checked)} className="sr-only peer" />
                  <div className="w-8 h-4 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest">Show Member Names</span>
              </div>
            </details>

            <div className="flex flex-col gap-1 self-end w-full sm:w-auto">
              <button
                onClick={() => handleGenerateAGMReport()}
                disabled={loading}
                className="flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-primary text-white hover:opacity-90 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:tracking-[0.3em] transition-all duration-500 border-none disabled:opacity-50"
              >
                <FaAward className="text-lg animate-pulse" />
                <span>{loading && reportCategory === 'agm' ? 'Synthesizing AGM...' : 'Generate AGM Report'}</span>
              </button>
            </div>
          </div>
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
                <option value="agm" className="bg-background font-black text-emerald-500">Statutory AGM Report (Annual Packet)</option>
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

              {reportCategory === 'agm' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-tertiary-text uppercase tracking-widest ml-4">
                      Operating Expenses (₦)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={agmExpenses}
                      onChange={(e) => setAgmExpenses(e.target.value)}
                      className="w-full bg-surface border border-border rounded-2xl p-4 text-primary-text text-sm outline-none focus:border-emerald-500 transition-all font-bold"
                      placeholder="e.g. 50000"
                    />
                    <p className="text-[9px] text-tertiary-text ml-4">
                      Operating expenses incurred in the year under review.
                    </p>
                  </div>

                  <details className="col-span-2" open>
                    <summary className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-4 cursor-pointer hover:text-emerald-400 transition-colors select-none mb-2">
                      ▸ Appropriation Rates Configuration
                    </summary>
                    <div className="grid grid-cols-2 gap-3 px-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-2">Reserve Fund (%)</label>
                        <input type="number" min="0" max="100" value={reserveFundRate} onChange={(e) => setReserveFundRate(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-2">Education Fund (%)</label>
                        <input type="number" min="0" max="100" value={educationFundRate} onChange={(e) => setEducationFundRate(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest ml-2">Share Dividend (%)</label>
                        <input type="number" min="0" max="100" value={shareRate} onChange={(e) => setShareRate(e.target.value)}
                          className="w-full bg-surface border border-emerald-500/30 rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest ml-2">Savings Interest (%)</label>
                        <input type="number" min="0" max="100" value={savingsRate} onChange={(e) => setSavingsRate(e.target.value)}
                          className="w-full bg-surface border border-emerald-500/30 rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest ml-2">Deposit Interest (%)</label>
                        <input type="number" min="0" max="100" value={depositRate} onChange={(e) => setDepositRate(e.target.value)}
                          className="w-full bg-surface border border-emerald-500/30 rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest ml-2">Cap. Mob. Rebate (%)</label>
                        <input type="number" min="0" max="100" value={capitalMobRate} onChange={(e) => setCapitalMobRate(e.target.value)}
                          className="w-full bg-surface border border-emerald-500/30 rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-2">Committee Sitting (%)</label>
                        <input type="number" min="0" max="100" value={committeeSittingRate} onChange={(e) => setCommitteeSittingRate(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-2">Sec. Honorarium (%)</label>
                        <input type="number" min="0" max="100" value={secretaryHonorariumRate} onChange={(e) => setSecretaryHonorariumRate(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-2">Entertainment (₦)</label>
                        <input type="number" min="0" value={entertainment} onChange={(e) => setEntertainment(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-2">Stationery (₦)</label>
                        <input type="number" min="0" value={stationery} onChange={(e) => setStationery(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-2">Prov. Bad Debt (₦)</label>
                        <input type="number" min="0" value={provisionBadDebt} onChange={(e) => setProvisionBadDebt(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-tertiary-text uppercase tracking-widest ml-2">Misc. Expenses (₦)</label>
                        <input type="number" min="0" value={miscExpenses} onChange={(e) => setMiscExpenses(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl p-3 text-primary-text text-xs outline-none focus:border-emerald-500 transition-all font-bold" />
                      </div>
                    </div>
                    <p className="text-[9px] text-tertiary-text ml-4 mt-2">
                      Individual rates per equity stream. Dividend on shares, interest on savings/deposits, and rebate on capital mobilization are calculated as % of their respective totals.
                    </p>
                  </details>
                </>
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

          {/* ============================================================ */}
          {/* 6. STATUTORY ANNUAL GENERAL MEETING (AGM) COMPREHENSIVE PACKET */}
          {/* ============================================================ */}
          {reportCategory === 'agm' && (
            <div className="space-y-12">
              
              {/* Executive AGM Cover Header */}
              <div className="card-premium bg-gradient-to-br from-emerald-500/10 via-surface to-primary/5 border-2 border-emerald-500/30 p-8 sm:p-10 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/50 pb-8 mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.25em] px-4 py-1.5 rounded-full shadow-sm">
                        Statutory AGM Packet • FY {data.year || selectedYear}
                      </span>
                      <span className="text-secondary-text text-xs font-bold">
                        ICA Compliant
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-primary-text">
                      {data.governance?.cooperativeName || 'Cooperative Society'}
                    </h2>
                    <p className="text-sm text-secondary-text mt-1 font-medium">
                      Subdomain: <span className="font-bold text-primary-text">{data.governance?.subdomain || 'N/A'}</span> • Generated on {new Date(data.generatedAt || Date.now()).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={handlePrint}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md"
                    >
                      <FaPrint /> Print Booklet
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-md"
                    >
                      <FaDownload /> Export CSV
                    </button>
                  </div>
                </div>

                {/* Governance & Leadership Committee */}
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-tertiary-text mb-4 flex items-center gap-2">
                    <FaBuilding className="text-emerald-500" /> Executive Committee & Registered Admin Officers
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.governance?.officers?.map((officer: any, idx: number) => (
                      <div key={idx} className="bg-surface/80 border border-border/60 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-black text-primary-text">
                            {officer.firstName} {officer.lastName}
                          </p>
                          <p className="text-xs text-secondary-text">{officer.email || officer.phoneNumber || 'Officer'}</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">
                          {officer.isMainAdmin ? 'Main Admin' : 'Admin'}
                        </span>
                      </div>
                    ))}
                    {(!data.governance?.officers || data.governance.officers.length === 0) && (
                      <p className="text-xs text-secondary-text italic">No executive officers found.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 1: MEMBERSHIP DEMOGRAPHICS & GROWTH AUDIT */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                  <h3 className="text-xl font-black tracking-tight text-primary-text">
                    Section 1: Membership Demographics & Growth Audit
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="card-premium border-emerald-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-tertiary-text">Total Registry</span>
                      <FaUsers className="text-emerald-500 text-xl" />
                    </div>
                    <p className="text-3xl font-black text-primary-text">{data.membershipStats?.totalMembers || 0}</p>
                    <p className="text-xs text-secondary-text mt-2 font-medium">
                      Active: <span className="text-emerald-500 font-bold">{data.membershipStats?.activeMembers || 0}</span> • Pending: {data.membershipStats?.pendingMembers || 0}
                    </p>
                  </div>

                  <div className="card-premium border-blue-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-tertiary-text">New FY Members</span>
                      <FaUserPlus className="text-blue-500 text-xl" />
                    </div>
                    <p className="text-3xl font-black text-primary-text">{data.membershipStats?.newMembersCount || 0}</p>
                    <p className="text-xs text-secondary-text mt-2 font-medium">
                      Admitted in FY {data.year || selectedYear}
                    </p>
                  </div>

                  <div className="card-premium border-purple-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-tertiary-text">Self-Signup Enrolment</span>
                      <FaAward className="text-purple-500 text-xl" />
                    </div>
                    <p className="text-3xl font-black text-primary-text">{data.membershipStats?.selfSignups || 0}</p>
                    <p className="text-xs text-secondary-text mt-2 font-medium">
                      Online Portal Registrations
                    </p>
                  </div>

                  <div className="card-premium border-amber-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-black uppercase tracking-widest text-tertiary-text">Manual Enrolment</span>
                      <FaBookReader className="text-amber-500 text-xl" />
                    </div>
                    <p className="text-3xl font-black text-primary-text">{data.membershipStats?.manualEnrolments || 0}</p>
                    <p className="text-xs text-secondary-text mt-2 font-medium">
                      Executive Admin Enrolments
                    </p>
                  </div>
                </div>

                {data.membershipStats?.newMembersList && data.membershipStats.newMembersList.length > 0 && (
                  <div className="card-premium">
                    <h4 className="text-sm font-black uppercase tracking-widest text-tertiary-text mb-4">
                      New Members Admitted During Fiscal Year ({data.membershipStats.newMembersList.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="border-b border-border uppercase font-black text-tertiary-text">
                          <tr>
                            <th className="py-3">Member Identifier</th>
                            <th className="py-3">Member Name</th>
                            <th className="py-3">Email / Phone</th>
                            <th className="py-3">Enrolment Mode</th>
                            <th className="py-3 text-right">Join Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 font-medium">
                          {data.membershipStats.newMembersList.slice(0, 15).map((member: any, idx: number) => (
                            <tr key={idx} className="hover:bg-background/40 transition-colors">
                              <td className="py-3 font-bold text-primary-text">{member.memberIdentifier || 'N/A'}</td>
                              <td className="py-3 font-black text-primary-text">{member.firstName} {member.lastName}</td>
                              <td className="py-3 text-secondary-text">{member.email || member.phoneNumber || 'N/A'}</td>
                              <td className="py-3">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary">
                                  {member.isManual ? 'Manual Admin' : 'Self-Signup'}
                                </span>
                              </td>
                              <td className="py-3 text-right text-secondary-text">
                                {new Date(member.joinDate || member.createdAt).toLocaleDateString('en-NG')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: STATEMENT OF FINANCIAL POSITION (BALANCE SHEET) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                  <h3 className="text-xl font-black tracking-tight text-primary-text">
                    Section 2: Statement of Financial Position (Statutory Balance Sheet)
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Cooperative Assets */}
                  <div className="card-premium space-y-6 border-emerald-500/30">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary-text flex items-center gap-2">
                        <FaPiggyBank className="text-emerald-500 text-lg" /> Cooperative Assets (Liquidity & Receivables)
                      </h4>
                      <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                        Assets
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <span className="text-sm text-secondary-text font-medium">Liquid Bank & Cash Account Balances</span>
                        <span className="text-base font-black text-primary-text">
                          {formatCurrency(data.balanceSheet?.assets?.liquidBalances || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <span className="text-sm text-secondary-text font-medium">Outstanding Loan Portfolio Receivables</span>
                        <span className="text-base font-black text-primary-text">
                          {formatCurrency(data.balanceSheet?.assets?.outstandingLoansReceivable || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30">
                        <span className="text-sm font-black uppercase tracking-widest text-emerald-600">Total Cooperative Assets</span>
                        <span className="text-xl font-black text-emerald-600">
                          {formatCurrency(data.balanceSheet?.assets?.aggregateCooperativeAssets || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Members' Equity & Liabilities */}
                  <div className="card-premium space-y-6 border-primary/30">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                      <h4 className="text-sm font-black uppercase tracking-widest text-primary-text flex items-center gap-2">
                        <FaBalanceScale className="text-primary text-lg" /> Members' Equity & Ledgers
                      </h4>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                        Equity & Reserves
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <span className="text-sm text-secondary-text font-medium">Share Capital Pool</span>
                        <span className="text-base font-black text-primary-text">
                          {formatCurrency(data.balanceSheet?.equityAndLiabilities?.shareCapital || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <span className="text-sm text-secondary-text font-medium">Thrift Savings Pool</span>
                        <span className="text-base font-black text-primary-text">
                          {formatCurrency(data.balanceSheet?.equityAndLiabilities?.thriftSavings || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <span className="text-sm text-secondary-text font-medium">General Deposits Pool</span>
                        <span className="text-base font-black text-primary-text">
                          {formatCurrency(data.balanceSheet?.equityAndLiabilities?.generalDeposits || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-border/40">
                        <span className="text-sm text-secondary-text font-medium">Capital Mobilization Reserves</span>
                        <span className="text-base font-black text-primary-text">
                          {formatCurrency(data.balanceSheet?.equityAndLiabilities?.capitalMobilization || 0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-4 bg-primary/10 p-4 rounded-2xl border border-primary/30">
                        <span className="text-sm font-black uppercase tracking-widest text-primary-text">Total Member Equity Pool</span>
                        <span className="text-xl font-black text-primary-text">
                          {formatCurrency(data.balanceSheet?.equityAndLiabilities?.totalMemberEquity || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: INCOME, EXPENDITURE & ANNUAL SURPLUS STATEMENT */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                  <h3 className="text-xl font-black tracking-tight text-primary-text">
                    Section 3: Income, Expenditure & Operating Surplus Statement (P&L)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">
                      Loan Interest Earned
                    </span>
                    <p className="text-2xl font-black text-emerald-500">
                      {formatCurrency(data.incomeAndExpenditure?.revenue?.loanInterestEarned || 0)}
                    </p>
                    <p className="text-xs text-secondary-text mt-1">From active & repaid loan contracts</p>
                  </div>

                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">
                      Processing Fees Earned
                    </span>
                    <p className="text-2xl font-black text-blue-500">
                      {formatCurrency(data.incomeAndExpenditure?.revenue?.processingFeesEarned || 0)}
                    </p>
                    <p className="text-xs text-secondary-text mt-1">Loan origination & processing fees</p>
                  </div>

                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">
                      Other Fee Revenue
                    </span>
                    <p className="text-2xl font-black text-purple-500">
                      {formatCurrency(data.incomeAndExpenditure?.revenue?.otherFeeRevenue || 0)}
                    </p>
                    <p className="text-xs text-secondary-text mt-1">Portal & administrative charges</p>
                  </div>
                </div>

                {/* Cash Flow Summary Card */}
                <div className="card-premium bg-gradient-to-r from-surface to-background border-border p-6 rounded-3xl">
                  <h4 className="text-sm font-black uppercase tracking-widest text-tertiary-text mb-6">
                    Annual Cash Flow & Operating Surplus Audit
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
                    <div>
                      <span className="text-xs text-secondary-text block">Total Deposits (Inflows)</span>
                      <span className="text-lg font-black text-emerald-500">{formatCurrency(data.incomeAndExpenditure?.cashFlow?.totalDeposits || 0)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-secondary-text block">Loan Repayments (Inflows)</span>
                      <span className="text-lg font-black text-emerald-500">{formatCurrency(data.incomeAndExpenditure?.cashFlow?.totalLoanRepayments || 0)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-secondary-text block">Withdrawals (Outflows)</span>
                      <span className="text-lg font-black text-red-500">{formatCurrency(data.incomeAndExpenditure?.cashFlow?.totalWithdrawals || 0)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-secondary-text block">Loan Disbursements (Outflows)</span>
                      <span className="text-lg font-black text-red-500">{formatCurrency(data.incomeAndExpenditure?.cashFlow?.totalLoanDisbursements || 0)}</span>
                    </div>
                    <div className={`p-4 rounded-2xl border ${
                      (data.incomeAndExpenditure?.cashFlow?.netCashFlow || 0) >= 0 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600' 
                        : 'bg-red-500/10 border-red-500/40 text-red-600'
                    }`}>
                      <span className="text-[10px] font-black uppercase tracking-widest block">Net FY Cash Flow Surplus</span>
                      <span className="text-xl font-black">{formatCurrency(data.incomeAndExpenditure?.cashFlow?.netCashFlow || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 4: CREDIT COMMITTEE PORTFOLIO HEALTH & SURETY AUDIT */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                  <h3 className="text-xl font-black tracking-tight text-primary-text">
                    Section 4: Credit Committee Portfolio Health & Surety Risk Audit
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">FY Loans Issued</span>
                    <p className="text-2xl font-black text-primary-text">{data.loanPortfolio?.totalLoansIssuedCount || 0}</p>
                    <p className="text-xs font-bold text-emerald-500 mt-1">{formatCurrency(data.loanPortfolio?.totalLoansIssuedAmount || 0)}</p>
                  </div>

                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">Active Portfolio</span>
                    <p className="text-2xl font-black text-blue-500">{data.loanPortfolio?.activeLoansCount || 0} Loans</p>
                    <p className="text-xs font-bold text-secondary-text mt-1">{formatCurrency(data.loanPortfolio?.activeLoansAmount || 0)} Outstanding</p>
                  </div>

                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">Completed / Repaid</span>
                    <p className="text-2xl font-black text-emerald-500">{data.loanPortfolio?.completedLoansCount || 0}</p>
                    <p className="text-xs text-secondary-text mt-1">Successfully retired loans</p>
                  </div>

                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">Delinquency Rate</span>
                    <p className={`text-2xl font-black ${(data.loanPortfolio?.delinquencyRate || 0) > 5 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {data.loanPortfolio?.delinquencyRate || 0}%
                    </p>
                    <p className="text-xs text-secondary-text mt-1">{data.loanPortfolio?.defaultedLoansCount || 0} Defaulted loans</p>
                  </div>
                </div>

                {/* Surety & Guarantor Risk Card */}
                <div className="card-premium bg-surface border border-border p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-primary-text flex items-center gap-2">
                      <FaShieldAlt className="text-amber-500" /> Supervisory Committee Surety & Guarantor Risk Exposure
                    </h4>
                    <p className="text-xs text-secondary-text">
                      Combined exposure across {data.suretyRisk?.totalGuarantorsCount || 0} active guarantors
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-black tracking-wider text-tertiary-text block">Total Guaranteed Liability</span>
                      <span className="text-lg font-black text-primary-text">{formatCurrency(data.suretyRisk?.totalGuaranteedLiability || 0)}</span>
                    </div>
                    <div className="text-right pl-6 border-l border-border">
                      <span className="text-[10px] uppercase font-black tracking-wider text-tertiary-text block">&gt; ₦500k High-Risk Guarantors</span>
                      <span className="text-lg font-black text-amber-500">{data.suretyRisk?.highRiskGuarantorsCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: PROPOSED APPROPRIATION ACCOUNT & MEMBER DIVIDEND SCHEDULE */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-emerald-500 pl-4">
                  <div>
                    <h3 className="text-xl font-black tracking-tight text-primary-text">
                      Section 5: Proposed Appropriation Account & Member Dividend Schedule
                    </h3>
                    <p className="text-xs text-secondary-text mt-1">
                      Industry-standard surplus appropriation with individual dividend/interest rates per equity stream. General Reserve is the balancing figure.
                    </p>
                  </div>
                  {data.dividendProjection?.appropriationAccount?.isOverAppropriated && (
                    <span className="text-xs font-black uppercase tracking-wider bg-red-500/10 text-red-500 px-4 py-2 rounded-xl border border-red-500/20 animate-pulse">
                      ⚠ Over-Appropriated
                    </span>
                  )}
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">Net Operating Surplus</span>
                    <p className="text-2xl font-black text-emerald-500">
                      {formatCurrency(data.dividendProjection?.appropriationAccount?.netSurplus || data.incomeAndExpenditure?.cashFlow?.netOperatingSurplus || 0)}
                    </p>
                    <p className="text-xs text-secondary-text mt-1">Surplus available for appropriation</p>
                  </div>

                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">Total Appropriated</span>
                    <p className="text-2xl font-black text-blue-500">
                      {formatCurrency(data.dividendProjection?.appropriationAccount?.totalAppropriated || 0)}
                    </p>
                    <p className="text-xs text-secondary-text mt-1">Sum of all appropriation items</p>
                  </div>

                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">Total Member Dividends</span>
                    <p className="text-2xl font-black text-emerald-600">
                      {formatCurrency(data.dividendProjection?.dividendTotals?.grandTotalDividends || 0)}
                    </p>
                    <p className="text-xs text-secondary-text mt-1">Across all 4 equity streams</p>
                  </div>

                  <div className="card-premium">
                    <span className="text-xs font-black uppercase tracking-widest text-tertiary-text block mb-2">General Reserve</span>
                    <p className={`text-2xl font-black ${(data.dividendProjection?.appropriationAccount?.generalReserve || 0) < 0 ? 'text-red-500' : 'text-primary-text'}`}>
                      {formatCurrency(data.dividendProjection?.appropriationAccount?.generalReserve || 0)}
                    </p>
                    <p className="text-xs text-secondary-text mt-1">Balancing figure (surplus − appropriations)</p>
                  </div>
                </div>

                {/* PROPOSED APPROPRIATION ACCOUNT TABLE */}
                <div className="card-premium">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary-text mb-4 border-b border-border pb-3">
                    Proposed Appropriation Account for the Year {data.year || ''}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="border-b-2 border-emerald-500/30 uppercase font-black text-tertiary-text">
                        <tr>
                          <th className="py-3.5 w-12">S/N</th>
                          <th className="py-3.5">Narration</th>
                          <th className="py-3.5 text-center">Rate</th>
                          <th className="py-3.5 text-right">Amount (₦)</th>
                          <th className="py-3.5 text-right">Net Surplus (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {/* Net Surplus Header Row */}
                        <tr className="bg-emerald-500/5">
                          <td className="py-3.5"></td>
                          <td className="py-3.5 font-black text-emerald-600">Net Surplus</td>
                          <td className="py-3.5"></td>
                          <td className="py-3.5"></td>
                          <td className="py-3.5 text-right font-black text-emerald-600 text-sm">
                            {formatCurrency(data.dividendProjection?.appropriationAccount?.netSurplus || 0)}
                          </td>
                        </tr>

                        {/* Line Items */}
                        {data.dividendProjection?.appropriationAccount?.lineItems?.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-background/40 transition-colors">
                            <td className="py-3.5 text-tertiary-text">{idx + 1}.</td>
                            <td className="py-3.5 font-bold text-primary-text">{item.name}</td>
                            <td className="py-3.5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                item.rate === 'Fixed' 
                                  ? 'bg-blue-500/10 text-blue-500'
                                  : 'bg-emerald-500/10 text-emerald-500'
                              }`}>
                                {item.rate}
                              </span>
                            </td>
                            <td className="py-3.5 text-right font-bold text-primary-text">
                              {formatCurrency(item.amount || 0)}
                            </td>
                            <td className="py-3.5"></td>
                          </tr>
                        ))}

                        {/* General Reserve (Balancing Figure) */}
                        <tr className={`${(data.dividendProjection?.appropriationAccount?.generalReserve || 0) < 0 ? 'bg-red-500/5' : 'bg-blue-500/5'}`}>
                          <td className="py-3.5 text-tertiary-text">
                            {(data.dividendProjection?.appropriationAccount?.lineItems?.length || 0) + 1}.
                          </td>
                          <td className="py-3.5 font-black text-primary-text">General Reserve (Balancing Figure)</td>
                          <td className="py-3.5 text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-500">
                              Balance
                            </span>
                          </td>
                          <td className={`py-3.5 text-right font-black text-sm ${(data.dividendProjection?.appropriationAccount?.generalReserve || 0) < 0 ? 'text-red-500' : 'text-primary-text'}`}>
                            {formatCurrency(data.dividendProjection?.appropriationAccount?.generalReserve || 0)}
                          </td>
                          <td className="py-3.5"></td>
                        </tr>

                        {/* Total Row */}
                        <tr className="border-t-2 border-emerald-500/30 bg-emerald-500/5">
                          <td className="py-4"></td>
                          <td className="py-4 font-black text-emerald-600 text-sm uppercase tracking-wider">TOTAL</td>
                          <td className="py-4"></td>
                          <td className="py-4 text-right font-black text-emerald-600 text-sm">
                            {formatCurrency(data.dividendProjection?.appropriationAccount?.netSurplus || 0)}
                          </td>
                          <td className="py-4 text-right font-black text-emerald-600 text-sm">
                            {formatCurrency(data.dividendProjection?.appropriationAccount?.netSurplus || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Dividend Rates Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="card-premium text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-tertiary-text block mb-1">Share Dividend</span>
                    <p className="text-lg font-black text-emerald-500">{data.dividendProjection?.dividendRates?.shareRate || 0}%</p>
                    <p className="text-[9px] text-secondary-text mt-1">{formatCurrency(data.dividendProjection?.dividendTotals?.totalShareDividend || 0)}</p>
                  </div>
                  <div className="card-premium text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-tertiary-text block mb-1">Savings Interest</span>
                    <p className="text-lg font-black text-blue-500">{data.dividendProjection?.dividendRates?.savingsRate || 0}%</p>
                    <p className="text-[9px] text-secondary-text mt-1">{formatCurrency(data.dividendProjection?.dividendTotals?.totalSavingsInterest || 0)}</p>
                  </div>
                  <div className="card-premium text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-tertiary-text block mb-1">Deposit Interest</span>
                    <p className="text-lg font-black text-purple-500">{data.dividendProjection?.dividendRates?.depositRate || 0}%</p>
                    <p className="text-[9px] text-secondary-text mt-1">{formatCurrency(data.dividendProjection?.dividendTotals?.totalDepositInterest || 0)}</p>
                  </div>
                  <div className="card-premium text-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-tertiary-text block mb-1">Cap. Mob. Rebate</span>
                    <p className="text-lg font-black text-amber-500">{data.dividendProjection?.dividendRates?.capitalMobRate || 0}%</p>
                    <p className="text-[9px] text-secondary-text mt-1">{formatCurrency(data.dividendProjection?.dividendTotals?.totalCapMobRebate || 0)}</p>
                  </div>
                </div>

                {/* MEMBER DIVIDEND SCHEDULE TABLE */}
                <div className="card-premium">
                  <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                    <h4 className="text-sm font-black uppercase tracking-widest text-primary-text">
                      Member Dividend Schedule ({data.dividendProjection?.eligibleMembersCount || 0} Eligible Members)
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-[9px] font-black text-tertiary-text uppercase tracking-widest">Names</span>
                      <div className="relative inline-flex items-center">
                        <input type="checkbox" checked={showMemberNames} onChange={(e) => setShowMemberNames(e.target.checked)} className="sr-only peer" />
                        <div className="w-8 h-4 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                      </div>
                    </label>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="border-b border-border uppercase font-black text-tertiary-text">
                        <tr>
                          <th className="py-3.5">Member ID</th>
                          {showMemberNames && <th className="py-3.5">Name</th>}
                          <th className="py-3.5 text-right">Share Cap. (₦)</th>
                          <th className="py-3.5 text-right">Div. on Shares (₦)</th>
                          <th className="py-3.5 text-right">Thrift Sav. (₦)</th>
                          <th className="py-3.5 text-right">Int. on Savings (₦)</th>
                          <th className="py-3.5 text-right">Deposits (₦)</th>
                          <th className="py-3.5 text-right">Int. on Deposits (₦)</th>
                          <th className="py-3.5 text-right">Cap. Mob. (₦)</th>
                          <th className="py-3.5 text-right">Rebate (₦)</th>
                          <th className="py-3.5 text-right font-black text-emerald-600">Total Div. (₦)</th>
                          <th className="py-3.5 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium">
                        {data.dividendProjection?.dividendSchedule && data.dividendProjection.dividendSchedule.length > 0 ? (
                          data.dividendProjection.dividendSchedule.map((member: any, idx: number) => (
                            <tr key={idx} className="hover:bg-background/40 transition-colors">
                              <td className="py-3.5 font-bold text-primary-text">{member.memberIdentifier || 'N/A'}</td>
                              {showMemberNames && <td className="py-3.5 font-black text-primary-text">{member.name}</td>}
                              <td className="py-3.5 text-right text-secondary-text">{formatCurrency(member.shareCapital || 0)}</td>
                              <td className="py-3.5 text-right font-bold text-emerald-600">{formatCurrency(member.shareDividend || 0)}</td>
                              <td className="py-3.5 text-right text-secondary-text">{formatCurrency(member.thriftSavings || 0)}</td>
                              <td className="py-3.5 text-right font-bold text-blue-500">{formatCurrency(member.savingsInterest || 0)}</td>
                              <td className="py-3.5 text-right text-secondary-text">{formatCurrency(member.deposits || 0)}</td>
                              <td className="py-3.5 text-right font-bold text-purple-500">{formatCurrency(member.depositInterest || 0)}</td>
                              <td className="py-3.5 text-right text-secondary-text">{formatCurrency(member.capitalMobilization || 0)}</td>
                              <td className="py-3.5 text-right font-bold text-amber-500">{formatCurrency(member.capitalMobRebate || 0)}</td>
                              <td className="py-3.5 text-right font-black text-emerald-600 text-sm">{formatCurrency(member.totalDividend || 0)}</td>
                              <td className="py-3.5 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  member.status === 'active' || !member.status
                                    ? 'bg-emerald-500/10 text-emerald-500'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}>
                                  {member.status || 'Active'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={showMemberNames ? 12 : 11} className="py-8 text-center text-secondary-text italic">
                              No members with active contributions found for dividend schedule.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Statutory AGM Footer Note */}
                <div className="card-premium bg-surface/60 border border-border/60 p-6 rounded-2xl text-center">
                  <p className="text-xs text-secondary-text">
                    This Statutory AGM Report is compiled from real-time member records, transaction ledgers, and loan schedules on the platform in accordance with Cooperative Societies Act standards.
                    Dividends on shares, interest on savings/deposits, and rebates on capital mobilization are calculated individually per equity stream at the rates approved by the General Meeting.
                  </p>
                </div>
              </div>

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