// Shared TypeScript types mirrored from the web app
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountNumber?: string;
  accountBalance: number;
  phoneNumber?: string;
  role: 'member' | 'admin' | 'super-admin';
  isVerified: boolean;
  profileImage?: string;
  tenantId?: string;
  isMainAdmin?: boolean;
  hasPin?: boolean;
  isManual?: boolean;
  status?: 'pending' | 'active' | 'rejected';
  subdomain?: string;
  tenantName?: string;
}

export interface Transaction {
  _id: string;
  date: string;
  description: string;
  type: 'deposit' | 'withdrawal' | 'loan_repayment' | 'loan_disbursement';
  amount: number;
  status?: string;
}

export interface Loan {
  _id: string;
  amount: number;
  totalRepayment: number;
  remainingAmount: number;
  amountPaid: number;
  monthlyPayment: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed';
  nextPaymentDate?: string;
  disbursedAt?: string;
  purpose?: string;
  tenantId?: string;
}

export interface Notification {
  _id: string;
  message: string;
  isRead: boolean;
  type: 'success' | 'alert' | 'info';
  createdAt?: string;
}

export interface Tenant {
  _id: string;
  name: string;
  subdomain: string;
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
  settings?: {
    loanRules?: {
      maxApprovalAmount?: number;
      interestRate?: number;
      deductInterestAtSource?: boolean;
    };
    registrationOpen?: boolean;
  };
}

export interface DashboardSummary {
  totalDeposits: number;
  totalWithdrawals: number;
  lastDepositAmount: number;
  lastDepositDate?: string;
}

export interface AdminStats {
  totalBalance: number;
  totalInbound: number;
  totalOutbound: number;
  pendingLoans: number;
  pendingRegistrations: number;
  totalMembers: number;
  activeMembers: number;
  activeLoans: number;
  totalLoanAmount: number;
  pendingPayments: number;
  billing?: {
    tier: string;
    rebateReserve: number;
    platformBalance: number;
    platformDues?: number;
    subscriptionStatus: string;
    nextBillingDate?: string;
  };
}
