export type UserData = {
  id: string;
  firstName: string;
  lastName: string;
  accountNumber: string;
  accountBalance: number;
  profileImage?: string;
};

export type Member = {
  id: string;
  firstName: string;
  lastName: string;
  accountNumber: string;
  joinDate: string;
  accountBalance: number;
};

export type Transaction = {
  id: string;
  memberId: string;
  type: 'deposit' | 'withdrawal' | 'loan_repayment';
  amount: number;
  date: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
};

export type Loan = {
  createdAt: string;
  _id: string;
  memberId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid' | 'completed';
  purpose: string;
  startDate: string;
  endDate: string;
  monthlyPayment: number;
  amountPaid: number;
  remainingAmount: number;
  nextPaymentDate: string;
  repaymentHistory: { date: string; amount: number }[];
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
  id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
};