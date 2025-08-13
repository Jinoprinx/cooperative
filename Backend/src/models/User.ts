import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  accountNumber: string;
  accountBalance: number;
  role: 'user' | 'admin';
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    autoDeductionAmount: number;
    autoDeductionDay: number;
    isActive: boolean;
  };
  joinDate: Date;
  lastLogin: Date;
  isActive: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profileImage?: string;
  status: 'pending' | 'active' | 'rejected';
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password should be at least 8 characters long'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
    },
    accountNumber: {
      type: String,
      unique: true,
    },
    accountBalance: {
      type: Number,
      default: 0,
    },
    role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
    bankAccount: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountName: { type: String },
      autoDeductionAmount: { type: Number, default: 0 },
      autoDeductionDay: { type: Number, default: 1 },
      isActive: { type: Boolean, default: false },
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    profileImage: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Generate account number for new users
    if (!this.accountNumber) {
      const timestamp = new Date().getTime().toString().slice(-8);
      this.accountNumber = `COOP${timestamp}`;
    }
    
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);