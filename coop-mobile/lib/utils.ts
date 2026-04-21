export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const getTransactionColor = (type: string): string => {
  switch (type) {
    case 'deposit':
    case 'loan_disbursement':
      return '#10b981';
    case 'withdrawal':
    case 'loan_repayment':
      return '#ef4444';
    default:
      return '#6b7280';
  }
};

export const getTransactionPrefix = (type: string): string => {
  return ['deposit', 'loan_disbursement'].includes(type) ? '+' : '-';
};

export const getTransactionLabel = (type: string): string => {
  const labels: Record<string, string> = {
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    loan_repayment: 'Loan Repayment',
    loan_disbursement: 'Loan Disbursement',
  };
  return labels[type] || type;
};

export const getLoanProgress = (amountPaid: number, totalRepayment: number): number => {
  if (!totalRepayment) return 0;
  return Math.min((amountPaid / totalRepayment) * 100, 100);
};
