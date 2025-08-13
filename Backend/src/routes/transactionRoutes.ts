import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import upload from '../middleware/upload.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import { authenticateToken, isRoleAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all transactions (for admin)
router.get('/', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const transactions = await Transaction.find({})
      .populate('user', 'firstName lastName accountNumber')
      .sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Server error while fetching all transactions' });
  }
});

// Get user's transaction history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    const query: any = { user: req.user?.id };
    
    if (type) {
      query.type = { $in: (type as string).split(',') };
    }
    
    const total = await Transaction.countDocuments(query);
    
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const lastDeposit = await Transaction.findOne({ user: req.user?.id, type: 'deposit', status: 'completed' })
      .sort({ date: -1 })
      .select('amount');
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
      lastDepositAmount: lastDeposit ? lastDeposit.amount : 0,
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction history' });
  }
});


// POST /api/transaction/upload-receipt
router.post(
  '/upload-receipt',
  authenticateToken,
  upload.single('receipt'),
  async (req, res) => {
    try {
      const { depositAmount, loanReturnAmount } = req.body;
      const userId = (req as any).user?.id;
      const receiptPath = req.file?.path;

      if (!receiptPath) {
        return res.status(400).json({ message: 'Receipt is required.' });
      }

      const transactions = [];

      if (depositAmount) {
        const parsedAmount = parseFloat(depositAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          return res.status(400).json({ message: 'Invalid deposit amount.' });
        }
        const depositTransaction = await Transaction.create({
          user: userId,
          type: 'deposit',
          amount: parsedAmount,
          description: 'Deposit',
          receiptUrl: receiptPath,
          status: 'pending',
        });
        transactions.push(depositTransaction);
      }

      if (loanReturnAmount) {
        const parsedAmount = parseFloat(loanReturnAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          return res.status(400).json({ message: 'Invalid loan return amount.' });
        }
        const loanReturnTransaction = await Transaction.create({
          user: userId,
          type: 'loan_repayment',
          amount: parsedAmount,
          description: 'Loan Repayment',
          receiptUrl: receiptPath,
          status: 'pending',
        });
        transactions.push(loanReturnTransaction);
      }

      if (transactions.length === 0) {
        return res.status(400).json({ message: 'Please provide at least one amount.' });
      }

      res.status(201).json({ message: 'Receipt uploaded successfully.', transactions });
    } catch (error) {
      console.error('Upload receipt error:', error);
      res.status(500).json({ message: 'Server error during upload.' });
    }
  }
);

// Admin: Get any user's transaction history
router.get('/user/:userId/history', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    const query: any = { user: userId };
    
    if (type) {
      query.type = { $in: (type as string).split(',') };
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const total = await Transaction.countDocuments(query);
    
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);
    
    res.json({
      transactions,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        accountNumber: user.accountNumber,
      },
    });
  } catch (error) {
    console.error('Admin get transaction history error:', error);
    res.status(500).json({ message: 'Server error while fetching transaction history' });
  }
});

// Admin: Get all pending transactions
router.get('/pending', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const pendingTransactions = await Transaction.find({ status: 'pending' })
      .populate('user', 'firstName lastName email')
      .sort({ date: 1 });
    res.json(pendingTransactions);
  } catch (error) {
    console.error('Get pending transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Approve a transaction
router.post('/approve/:transactionId', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction || transaction.status !== 'pending') {
      return res.status(404).json({ message: 'Pending transaction not found' });
    }

    const user = await User.findById(transaction.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user's balance
    const balanceBefore = user.accountBalance;
    user.accountBalance += transaction.amount;
    const balanceAfter = user.accountBalance;

    // Update transaction
    transaction.status = 'completed';
    transaction.balanceBefore = balanceBefore;
    transaction.balanceAfter = balanceAfter;
    transaction.reference = `DEP-${uuidv4().substring(0, 8)}-${Date.now()}`;
    
    await user.save();
    await transaction.save();

    res.json({ message: 'Transaction approved successfully', transaction });
  } catch (error) {
    console.error('Approve transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin: Reject a transaction
router.post('/reject/:transactionId', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction || transaction.status !== 'pending') {
      return res.status(404).json({ message: 'Pending transaction not found' });
    }

    transaction.status = 'failed'; // or 'rejected'
    await transaction.save();

    res.json({ message: 'Transaction rejected successfully', transaction });
  } catch (error) {
    console.error('Reject transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process a new deposit
router.post('/deposit', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    // Validate input
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit details' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate a unique reference
    const reference = `DEP-${uuidv4().substring(0, 8)}-${Date.now()}`;
    
    // Get current balance
    const balanceBefore = user.accountBalance;
    
    // Update user balance
    user.accountBalance += amount;
    await user.save();
    
    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'deposit',
      amount,
      description: description || 'Deposit to account',
      reference,
      balanceBefore,
      balanceAfter: user.accountBalance,
      status: 'completed',
    });
    
    await transaction.save();
    
    res.status(201).json({
      message: 'Deposit processed successfully',
      transaction,
      newBalance: user.accountBalance,
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server error while processing deposit' });
  }
});

// Process a withdrawal
router.post('/withdrawal', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;
    
    // Validate input
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal details' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has sufficient balance
    if (user.accountBalance < amount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    // Generate a unique reference
    const reference = `WTH-${uuidv4().substring(0, 8)}-${Date.now()}`;
    
    // Get current balance
    const balanceBefore = user.accountBalance;
    
    // Update user balance
    user.accountBalance -= amount;
    await user.save();
    
    // Create transaction record
    const transaction = new Transaction({
      user: userId,
      type: 'withdrawal',
      amount,
      description: description || 'Withdrawal from account',
      reference,
      balanceBefore,
      balanceAfter: user.accountBalance,
      status: 'completed',
    });
    
    await transaction.save();
    
    res.status(201).json({
      message: 'Withdrawal processed successfully',
      transaction,
      newBalance: user.accountBalance,
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error while processing withdrawal' });
  }
});

// Generate transaction report
router.get('/report', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    const query: any = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }
    
    if (type) {
      query.type = { $in: (type as string).split(',') };
    }
    
    const transactions = await Transaction.find(query)
      .populate('user', 'firstName lastName accountNumber')
      .sort({ date: -1 });
    
    // Calculate summary statistics
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalWithdrawals = transactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalLoanDisbursements = transactions
      .filter(t => t.type === 'loan_disbursement')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalLoanRepayments = transactions
      .filter(t => t.type === 'loan_repayment')
      .reduce((sum, t) => sum + t.amount, 0);
    
    res.json({
      transactions,
      summary: {
        totalDeposits,
        totalWithdrawals,
        totalLoanDisbursements,
        totalLoanRepayments,
        netCashFlow: totalDeposits - totalWithdrawals + totalLoanRepayments - totalLoanDisbursements,
        transactionCount: transactions.length,
      },
    });
  } catch (error) {
    console.error('Transaction report error:', error);
    res.status(500).json({ message: 'Server error while generating transaction report' });
  }
});

export default router;