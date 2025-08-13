import mongoose, { Schema, Document } from 'mongoose';

export interface ILoan extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  interestRate: number;
  durationMonths: number;
  startDate: Date;
  endDate: Date;
  monthlyPayment: number;
  totalInterest: number;
  totalRepayment: number;
  amountPaid: number;
  remainingAmount: number;
  status: 'pending' | 'approved' | 'active' | 'completed' | 'rejected' | 'defaulted';
  purpose: string;
  paymentDueDay: number;
  approvedBy?: mongoose.Types.ObjectId;
  approvalDate?: Date;
  nextPaymentDate?: Date;
  repaymentHistory: Array<{
    amount: number;
    date: Date;
    reference: string;
  }>;
  sureties: Array<{
    user: mongoose.Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected';
  }>;
  createdAt: Date; // Explicitly added
  updatedAt: Date; // Explicitly added
}

const LoanSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sureties: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        status: {
          type: String,
          enum: ['pending', 'approved', 'rejected'],
          default: 'pending',
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
    interestRate: {
      type: Number,
      required: true, // Annual interest rate (e.g., 5 for 5%)
    },
    durationMonths: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    monthlyPayment: {
      type: Number,
    },
    totalInterest: {
      type: Number,
    },
    totalRepayment: {
      type: Number,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    remainingAmount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'active', 'completed', 'rejected', 'defaulted'],
      default: 'pending',
    },
    purpose: {
      type: String,
      required: true,
    },
    paymentDueDay: {
      type: Number,
      default: 15, // 15th of each month by default
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvalDate: {
      type: Date,
    },
    nextPaymentDate: {
      type: Date,
    },
    repaymentHistory: [
      {
        amount: Number,
        date: {
          type: Date,
          default: Date.now,
        },
        reference: String,
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to calculate loan details when approved
LoanSchema.pre('save', function (next) {
  const loan = this as ILoan;
  
  if (loan.isModified('status') && loan.status === 'active' && !loan.startDate) {
    // Set the start date
    loan.startDate = new Date();
    
    // Calculate end date
    const endDate = new Date(loan.startDate);
    endDate.setMonth(endDate.getMonth() + loan.durationMonths);
    loan.endDate = endDate;
    
    // Calculate monthly payment using amortization formula
    const principal = loan.amount;
    const annualRate = loan.interestRate / 100;
    const monthlyRate = annualRate / 12;
    const numberOfPayments = loan.durationMonths;

    if (monthlyRate > 0) {
      loan.monthlyPayment =
        principal *
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      loan.monthlyPayment = principal / numberOfPayments; // No interest
    }

    loan.totalRepayment = loan.monthlyPayment * numberOfPayments;
    loan.totalInterest = loan.totalRepayment - principal;
    
    // Set remaining amount
    loan.remainingAmount = loan.totalRepayment;
    
    // Set approval date
    loan.approvalDate = new Date();

    // Set initial next payment date
    const nextPayment = new Date(loan.startDate);
    nextPayment.setDate(loan.paymentDueDay);
    // If the paymentDueDay has already passed in the current month, set it for the next month
    if (nextPayment.getTime() < loan.startDate.getTime()) {
      nextPayment.setMonth(nextPayment.getMonth() + 1);
    }
    loan.nextPaymentDate = nextPayment;
  }
  
  next();
});

// Index for faster queries
LoanSchema.index({ user: 1, status: 1 });
LoanSchema.index({ status: 1, endDate: 1 }); // For finding active loans

export default mongoose.model<ILoan>('Loan', LoanSchema);