// Transaction type
export type Transaction = {
    id?: number;
    memberId?: number;
    type?: 'deposit' | 'withdrawal' | 'loan_repayment';
    amount: number;
    date: string;
    description?: string;
    balance?: number;
    status?: 'pending' | 'approved' | 'rejected';
  };
  
  // User data type
  export type UserData = {
    firstName: string;
    lastName: string;
    accountNumber: string;
    accountBalance: number;
    joinDate: string;
  };
  
  // Active loan type
  export type ActiveLoan = {
    id: number;
    amount: number;
    status: 'active' | 'inactive';
    startDate: string;
    endDate: string;
    monthlyPayment: number;
    amountPaid: number;
    remainingAmount: number;
    nextPaymentDate: string;
  };
  
  // Mock transactions
  export const mockTransactions: Transaction[] = [
    { id: 1, type: 'deposit', amount: 45000, date: '2023-04-22', description: 'Monthly contribution', balance: 250000 },
    { id: 2, type: 'withdrawal', amount: 20000, date: '2023-04-15', description: 'Emergency withdrawal', balance: 205000 },
    { id: 3, type: 'deposit', amount: 45000, date: '2023-03-22', description: 'Monthly contribution', balance: 225000 },
    { id: 4, type: 'loan_repayment', amount: 15000, date: '2023-03-10', description: 'Loan repayment', balance: 75000 },
    { id: 5, type: 'deposit', amount: 45000, date: '2023-02-22', description: 'Monthly contribution', balance: 250000 },
  ];

// Mock repayment history
  export const mockRepaymentHistory: Transaction[] = [
    { id: 1, type: 'loan_repayment', amount: 15000, date: '2023-03-10', balance: 75000, description: 'Loan repayment' },
    { id: 2, type: 'loan_repayment', amount: 15000, date: '2023-02-10', balance: 60000, description: 'Loan repayment' },
    { id: 3, type: 'loan_repayment', amount: 15000, date: '2023-01-10', balance: 45000, description: 'Loan repayment' },
  ];
  
  // Mock user data
  export const mockUserData: UserData = {
    firstName: 'John',
    lastName: 'Doe',
    accountNumber: 'COOP12345678',
    accountBalance: 250000,
    joinDate: '2022-10-15',
  };
  
  // Mock active loan
  export const mockActiveLoan: ActiveLoan = {
    id: 1,
    amount: 500000,
    status: 'active',
    startDate: '2023-01-15',
    endDate: '2023-07-15',
    monthlyPayment: 87500,
    amountPaid: 262500,
    remainingAmount: 237500,
    nextPaymentDate: '2023-05-15',
  };

  // Admin user data type
  export type Member = {
    id: number;
    firstName: string;
    lastName: string;
    accountNumber: string;
    joinDate: string;
    accountBalance: number;
  };
  
  export type Loan = {
    id: number;
    memberId: number;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'repaid';
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
  
  export const mockMembers: Member[] = [
    { id: 1, firstName: 'Jane', lastName: 'Smith', accountNumber: 'COOP98765432', joinDate: '2023-04-28', accountBalance: 75000 },
    { id: 2, firstName: 'Michael', lastName: 'Johnson', accountNumber: 'COOP87654321', joinDate: '2023-04-27', accountBalance: 120000 },
    { id: 3, firstName: 'Emily', lastName: 'Williams', accountNumber: 'COOP76543210', joinDate: '2023-04-26', accountBalance: 95000 },
    { id: 4, firstName: 'Robert', lastName: 'Brown', accountNumber: 'COOP12345678', joinDate: '2022-10-15', accountBalance: 250000 },
    { id: 5, firstName: 'Susan', lastName: 'Davis', accountNumber: 'COOP23456789', joinDate: '2023-01-05', accountBalance: 180000 },
    { id: 6, firstName: 'James', lastName: 'Miller', accountNumber: 'COOP34567890', joinDate: '2023-02-10', accountBalance: 150000 },
    { id: 7, firstName: 'Patricia', lastName: 'Wilson', accountNumber: 'COOP45678901', joinDate: '2023-03-15', accountBalance: 200000 },
    { id: 8, firstName: 'David', lastName: 'Taylor', accountNumber: 'COOP56789012', joinDate: '2023-04-01', accountBalance: 100000 },
    { id: 9, firstName: 'Jennifer', lastName: 'Anderson', accountNumber: 'COOP67890123', joinDate: '2023-04-10', accountBalance: 130000 },
    { id: 10, firstName: 'William', lastName: 'Thomas', accountNumber: 'COOP78901234', joinDate: '2023-04-20', accountBalance: 90000 },
  ];
  
  export const mockAllTransactions: Transaction[] = [
    { id: 1, memberId: 4, type: 'deposit', amount: 45000, date: '2023-04-22', description: 'Monthly contribution', status: 'approved' },
    { id: 2, memberId: 4, type: 'withdrawal', amount: 20000, date: '2023-04-15', description: 'Emergency withdrawal', status: 'approved' },
    { id: 3, memberId: 1, type: 'deposit', amount: 50000, date: '2023-04-20', description: 'Initial deposit', status: 'approved' },
    { id: 4, memberId: 2, type: 'deposit', amount: 30000, date: '2023-04-18', description: 'Monthly contribution', status: 'pending' },
    { id: 5, memberId: 3, type: 'withdrawal', amount: 10000, date: '2023-04-16', description: 'Personal expense', status: 'rejected' },
    { id: 6, memberId: 5, type: 'loan_repayment', amount: 50000, date: '2023-04-01', description: 'Loan repayment', status: 'approved' },
    { id: 7, memberId: 6, type: 'deposit', amount: 40000, date: '2023-04-10', description: 'Monthly contribution', status: 'pending' },
  ];
  
  export const mockAllLoans: Loan[] = [
    { id: 1, memberId: 4, amount: 500000, status: 'active', purpose: 'Business expansion', startDate: '2023-01-15', endDate: '2023-07-15', monthlyPayment: 87500, amountPaid: 262500, remainingAmount: 237500, nextPaymentDate: '2023-05-15', repaymentHistory: [{ date: '2023-02-15', amount: 87500 }, { date: '2023-03-15', amount: 87500 }, { date: '2023-04-15', amount: 87500 }] },
    { id: 2, memberId: 5, amount: 300000, status: 'approved', purpose: 'Home renovation', startDate: '2023-03-01', endDate: '2023-09-01', monthlyPayment: 50000, amountPaid: 0, remainingAmount: 300000, nextPaymentDate: '2023-04-01', repaymentHistory: [] },
    { id: 3, memberId: 6, amount: 200000, status: 'pending', purpose: 'Education', startDate: '', endDate: '', monthlyPayment: 0, amountPaid: 0, remainingAmount: 200000, nextPaymentDate: '', repaymentHistory: [] },
  ];
  
  export const mockStats: Stats = {
    totalMembers: 540,
    activeMembers: 512,
    totalBalance: 45678000,
    totalDeposits: 12345000,
    totalWithdrawals: 5678000,
    activeLoans: 32,
    totalLoanAmount: 23456000,
    pendingLoans: 8,
  };