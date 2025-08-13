import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: 'deposit' | 'withdrawal' | 'loan_disbursement' | 'loan_repayment' | 'interest_payment' | 'fee';
  amount: number;
  description: string;
  reference: string;
  balanceAfter: number;
  balanceBefore: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'rejected';
  date: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'loan_disbursement', 'loan_repayment', 'interest_payment', 'fee'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    reference: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple documents to have a null value
    },
    balanceAfter: {
      type: Number,
    },
    balanceBefore: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'rejected'],
      default: 'pending',
    },
    receiptUrl: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries on frequently accessed fields
TransactionSchema.index({ user: 1, date: -1 });
TransactionSchema.index({ reference: 1 }, { unique: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);