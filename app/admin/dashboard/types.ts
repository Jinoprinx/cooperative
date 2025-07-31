import { Member, Loan } from '@/app/types';

export interface RecentMember extends Member {}

export interface PendingLoan extends Loan {
  user: {
    firstName: string;
    lastName: string;
    accountNumber: string;
  };
  createdAt: string;
}

export interface PendingPayment {
  _id: string;
  user: {
    firstName: string;
    lastName: string;
    accountNumber: string;
  };
  receipt: string;
  description: string;
  createdAt: string;
  status: string;
}
