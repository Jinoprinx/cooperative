export type User = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  accountNumber: string;
  accountBalance: number;
  role: 'user' | 'admin';
  profileImage?: string;
  status: 'pending' | 'active' | 'rejected';
};

export type Member = {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  accountNumber: string;
  joinDate: string;
  accountBalance: number;
  phoneNumber: string;
  role?: 'member' | 'admin';
  status: 'pending' | 'active' | 'rejected';
};

export type Transaction = {
  _id: string;
  memberId?: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  type: 'deposit' | 'withdrawal' | 'loan_repayment' | 'loan_disbursement' | 'interest_payment' | 'fee' | 'loan';
  amount: number;
  date: string;
  createdAt?: string;
  description?: string;
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected';
  reference?: string;
  balanceAfter?: number;
  balanceBefore?: number;
  receiptUrl?: string;
  remainingAmount?: number;
  rejectionReason?: string;
};

export type Loan = {
  createdAt: string;
  _id: string;
  memberId: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    accountNumber?: string;
  };
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate?: string;
  endDate: string;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  amountPaid: number;
  remainingAmount: number;
  disbursedAmount?: number;
  nextPaymentDate?: string;
  repaymentHistory: { date: string; amount: number; reference?: string }[];
  sureties?: {
    user: string;
    status: 'pending' | 'approved' | 'rejected';
  }[];
  purpose: string;
  paymentDueDay: number;
  approvedBy?: string;
  approvalDate?: string;
  renewedFrom?: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid' | 'completed' | 'defaulted' | 'renewed';
};

export type Stats = {
  totalMembers: number;
  activeMembers: number;
  totalBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeLoans: number;
  totalLoanAmount: number;
  pendingLoans: number;
};

export type TransactionSummary = {
  totalDeposits: number;
  totalWithdrawals: number;
  lastDepositAmount?: number;
};

export type ActiveLoan = Loan;

export type PaymentPayload = {
  email: string;
  shares: number;
  thrift: number;
  capital: number;
  deposits: number;
  loan: number;
  totalAsset?: number;
};

export type PaymentRecord = {
  _id: string;
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
};