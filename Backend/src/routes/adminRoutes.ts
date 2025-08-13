import express from 'express';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import { authenticateToken, isRoleAdmin } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = express.Router();

/////////////////////


// Admin Registration Endpoint
// adminAuthRoutes.js
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with admin flag
    user = new User({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role: role || 'user',
      accountNumber: generateAccountNumber(),
      isActive: true,
      joinDate: new Date(),
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create JWT token with admin flag
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'cooperativesecret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});

// Helper function to generate account number
function generateAccountNumber() {
  return 'COOP' + Math.floor(10000000 + Math.random() * 90000000);
}



///////////////////
// Get all members
router.get('/members', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    // Build search query
    const query: any = {};
    
    if (search) {
      // Search by name, email, account number, or phone
      const searchStr = search as string;
      query.$or = [
        { firstName: { $regex: searchStr, $options: 'i' } },
        { lastName: { $regex: searchStr, $options: 'i' } },
        { email: { $regex: searchStr, $options: 'i' } },
        { accountNumber: { $regex: searchStr, $options: 'i' } },
        { phoneNumber: { $regex: searchStr, $options: 'i' } },
      ];
    }
    
    const total = await User.countDocuments(query);
    
    const members = await User.find(query)
      .select('-password')
      .sort({ lastName: 1, firstName: 1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);
    
    res.json({
      members,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ message: 'Server error while fetching members' });
  }
});

// Get a specific member's details
router.get('/members/:userId', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Get member's active loans
    const activeLoans = await Loan.find({
      user: userId,
      status: { $in: ['approved', 'active'] },
    });
    
    // Get recent transactions
    const recentTransactions = await Transaction.find({ user: userId })
      .sort({ date: -1 })
      .limit(5);
    
    // Calculate member's statistics
    const totalDeposits = await Transaction.aggregate([
      { $match: { user: user._id, type: 'deposit' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    const totalWithdrawals = await Transaction.aggregate([
      { $match: { user: user._id, type: 'withdrawal' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    const totalLoansTaken = await Loan.aggregate([
      { $match: { user: user._id, status: { $in: ['completed', 'active', 'approved'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    
    res.json({
      member: user,
      activeLoans,
      recentTransactions,
      statistics: {
        totalDeposits: totalDeposits.length ? totalDeposits[0].total : 0,
        totalWithdrawals: totalWithdrawals.length ? totalWithdrawals[0].total : 0,
        totalLoansTaken: totalLoansTaken.length ? totalLoansTaken[0].total : 0,
      },
    });
  } catch (error) {
    console.error('Get member details error:', error);
    res.status(500).json({ message: 'Server error while fetching member details' });
  }
});

// Update a member's details
router.put('/members/:userId', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phoneNumber, isActive, isAdmin: makeAdmin } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (isActive !== undefined) user.isActive = isActive;
    if (makeAdmin !== undefined) user.role = makeAdmin ? 'admin' : 'user';
    
    await user.save();
    
    res.json({
      message: 'Member updated successfully',
      member: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ message: 'Server error while updating member' });
  }
});

// Add a new member
router.post('/members', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { firstName, lastName, joinDate, accountBalance, phoneNumber, email } = req.body;

    const newUser = new User({
      firstName,
      lastName,
      accountNumber: generateAccountNumber(),
      joinDate,
      accountBalance,
      phoneNumber: phoneNumber || '00000000000',
      email: email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@coop.com`,
      password: 'password123',
    });

    await newUser.save();

    res.status(201).json({ message: 'Member added successfully', member: newUser });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error while adding member' });
  }
});

// Delete a member
router.delete('/members/:userId', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Member not found' });
    }

    await user.deleteOne();

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ message: 'Server error while deleting member' });
  }
});

// Generate monthly report
router.get('/reports/monthly', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
    
    // Get all transactions in the month
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate },
    }).populate('user', 'firstName lastName accountNumber');
    
    // Get all loans in the month
    const loans = await Loan.find({
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { approvalDate: { $gte: startDate, $lte: endDate } },
      ],
    }).populate('user', 'firstName lastName accountNumber');
    
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
    
    // Get member statistics
    const totalActiveMembers = await User.countDocuments({ isActive: true });
    const newMembers = await User.countDocuments({
      joinDate: { $gte: startDate, $lte: endDate },
    });
    
    // Total cooperative balance
    const totalCooperativeBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$accountBalance' } } },
    ]);
    
    // Total outstanding loans
    const totalOutstandingLoans = await Loan.aggregate([
      { $match: { status: { $in: ['approved', 'active'] } } },
      { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
    ]);
    
    res.json({
      month: parseInt(month as string),
      year: parseInt(year as string),
      transactionSummary: {
        totalDeposits,
        totalWithdrawals,
        totalLoanDisbursements,
        totalLoanRepayments,
        netCashFlow: totalDeposits - totalWithdrawals + totalLoanRepayments - totalLoanDisbursements,
        transactionCount: transactions.length,
      },
      memberSummary: {
        totalActiveMembers,
        newMembers,
      },
      financialSummary: {
        totalCooperativeBalance: totalCooperativeBalance.length ? totalCooperativeBalance[0].total : 0,
        totalOutstandingLoans: totalOutstandingLoans.length ? totalOutstandingLoans[0].total : 0,
      },
      recentTransactions: transactions.slice(0, 10),
      recentLoans: loans.slice(0, 10),
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    res.status(500).json({ message: 'Server error while generating monthly report' });
  }
});

// Generate annual report
router.get('/reports/annual', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ message: 'Year is required' });
    }
    
    const startDate = new Date(parseInt(year as string), 0, 1);
    const endDate = new Date(parseInt(year as string), 11, 31, 23, 59, 59);
    
    // Get all transactions in the year
    const transactions = await Transaction.find({
      date: { $gte: startDate, $lte: endDate },
    });
    
    // Get all loans in the year
    const loans = await Loan.find({
      $or: [
        { createdAt: { $gte: startDate, $lte: endDate } },
        { approvalDate: { $gte: startDate, $lte: endDate } },
      ],
    });
    
    // Calculate monthly breakdown
    const monthlyData = Array(12).fill(0).map((_, index) => {
      const monthStart = new Date(parseInt(year as string), index, 1);
      const monthEnd = new Date(parseInt(year as string), index + 1, 0, 23, 59, 59);
      
      const monthTransactions = transactions.filter(t => 
        t.date >= monthStart && t.date <= monthEnd
      );
      
      const deposits = monthTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const withdrawals = monthTransactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const loanDisbursements = monthTransactions
        .filter(t => t.type === 'loan_disbursement')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const loanRepayments = monthTransactions
        .filter(t => t.type === 'loan_repayment')
        .reduce((sum, t) => sum + t.amount, 0);
      
      return {
        month: index + 1,
        monthName: new Date(parseInt(year as string), index, 1).toLocaleString('default', { month: 'long' }),
        deposits,
        withdrawals,
        loanDisbursements,
        loanRepayments,
        netCashFlow: deposits - withdrawals + loanRepayments - loanDisbursements,
        transactionCount: monthTransactions.length,
      };
    });
    
    // Annual totals
    const annualTotals = {
      deposits: monthlyData.reduce((sum, month) => sum + month.deposits, 0),
      withdrawals: monthlyData.reduce((sum, month) => sum + month.withdrawals, 0),
      loanDisbursements: monthlyData.reduce((sum, month) => sum + month.loanDisbursements, 0),
      loanRepayments: monthlyData.reduce((sum, month) => sum + month.loanRepayments, 0),
      netCashFlow: monthlyData.reduce((sum, month) => sum + month.netCashFlow, 0),
      transactionCount: monthlyData.reduce((sum, month) => sum + month.transactionCount, 0),
    };
    
    // Loan statistics
    const loanStats = {
      totalLoansIssued: loans.filter(l => l.status !== 'pending' && l.status !== 'rejected').length,
      totalLoanAmount: loans
        .filter(l => l.status !== 'pending' && l.status !== 'rejected')
        .reduce((sum, l) => sum + l.amount, 0),
      completedLoans: loans.filter(l => l.status === 'completed').length,
      activeLoans: loans.filter(l => ['approved', 'active'].includes(l.status)).length,
      defaultedLoans: loans.filter(l => l.status === 'defaulted').length,
      totalInterestEarned: loans
        .filter(l => l.status === 'completed')
        .reduce((sum, l) => sum + (l.totalInterest || 0), 0),
    };
    
    // Member growth
    const memberGrowth = await User.aggregate([
      {
        $match: {
          joinDate: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: { $month: '$joinDate' },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    
    // Format member growth by month
    const memberGrowthByMonth = Array(12).fill(0).map((_, index) => {
      const monthData = memberGrowth.find(m => m._id === index + 1);
      return {
        month: index + 1,
        monthName: new Date(parseInt(year as string), index, 1).toLocaleString('default', { month: 'long' }),
        newMembers: monthData ? monthData.count : 0,
      };
    });
    
    res.json({
      year: parseInt(year as string),
      monthlyData,
      annualTotals,
      loanStats,
      memberGrowthByMonth,
      totalActiveMembers: await User.countDocuments({ isActive: true }),
      totalInactiveMembers: await User.countDocuments({ isActive: false }),
    });
  } catch (error) {
    console.error('Annual report error:', error);
    res.status(500).json({ message: 'Server error while generating annual report' });
  }
});

// Get admin stats
router.get('/stats', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    // Fetch all stats concurrently
    const [
      totalMembers,
      activeMembers,
      totalBalanceResult,
      totalDepositsResult,
      totalWithdrawalsResult,
      activeLoans,
      totalLoanAmountResult,
      pendingLoans
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$accountBalance' } } }]),
      Transaction.aggregate([{ $match: { type: 'deposit' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Transaction.aggregate([{ $match: { type: 'withdrawal' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Loan.countDocuments({ status: { $in: ['active', 'approved'] } }),
      Loan.aggregate([{ $match: { status: { $in: ['active', 'approved'] } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
      Loan.countDocuments({ status: 'pending' })
    ]);

    // Extract values from aggregation results
    const totalBalance = totalBalanceResult.length > 0 ? totalBalanceResult[0].total : 0;
    const totalDeposits = totalDepositsResult.length > 0 ? totalDepositsResult[0].total : 0;
    const totalWithdrawals = totalWithdrawalsResult.length > 0 ? totalWithdrawalsResult[0].total : 0;
    const totalLoanAmount = totalLoanAmountResult.length > 0 ? totalLoanAmountResult[0].total : 0;

    res.json({
      totalMembers,
      activeMembers,
      totalBalance,
      totalDeposits,
      totalWithdrawals,
      activeLoans,
      totalLoanAmount,
      pendingLoans
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

// Upload profile image
router.post('/profile/image', authenticateToken, isRoleAdmin, upload.single('profileImage'), async (req, res) => {
  try {
    console.log('Admin profile image upload: Authenticated and Admin check passed.');
    console.log('Request user ID:', req.user?.id);

    const user = await User.findById(req.user?.id);
    if (!user) {
      console.error('Admin profile image upload: User not found for ID', req.user?.id);
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('Admin profile image upload: User found.', user.email);

    if (!req.file) {
      console.error('Admin profile image upload: No file uploaded.');
      return res.status(400).json({ message: 'Please upload a file' });
    }
    console.log('Admin profile image upload: File received.', req.file);

    // Update user's profile image path
    const oldProfileImage = user.profileImage;
    user.profileImage = req.file.path;
    console.log('Admin profile image upload: Attempting to save user with new profile image path:', user.profileImage);

    await user.save();
    console.log('Admin profile image upload: User saved successfully.');

    res.json({
      message: 'Profile image uploaded successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
    console.log('Admin profile image upload: Success response sent.');

  } catch (error: any) {
    console.error('Error uploading profile image:', error.message || error);
    if (error.name === 'MulterError') {
      console.error('Multer Error Code:', error.code);
    }
    res.status(500).json({ message: error.message || 'Server error while uploading profile image' });
  }
});


// Admin: Get all pending payments (receipt uploads)
router.get('/pending-payments', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const pendingPayments = await Transaction.find({ status: 'pending', type: 'deposit', description: { $exists: true } })
      .populate('user', 'firstName lastName email')
      .sort({ date: 1 });
    res.json({ pendingPayments });
  } catch (error) {
    console.error('Get pending payments error:', error);
    res.status(500).json({ message: 'Server error while fetching pending payments' });
  }
});

// Admin: Approve a pending payment
router.put('/payments/:transactionId/approve', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction is not pending' });
    }

    transaction.status = 'completed';
    await transaction.save();

    res.json({ message: 'Payment approved successfully' });
  } catch (error) {
    console.error('Approve payment error:', error);
    res.status(500).json({ message: 'Server error while approving payment' });
  }
});

// Admin: Reject a pending payment
router.put('/payments/:transactionId/reject', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction is not pending' });
    }

    transaction.status = 'rejected';
    await transaction.save();

    res.json({ message: 'Payment rejected successfully' });
  } catch (error) {
    console.error('Reject payment error:', error);
    res.status(500).json({ message: 'Server error while rejecting payment' });
  }
});

// Get all pending registrations
router.get('/registrations/pending', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const pendingRegistrations = await User.find({ status: 'pending' }).select('-password');
    res.json(pendingRegistrations);
  } catch (error) {
    console.error('Get pending registrations error:', error);
    res.status(500).json({ message: 'Server error while fetching pending registrations' });
  }
});

// Approve a registration
router.put('/registrations/:userId/approve', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'User is not pending approval' });
    }

    user.status = 'active';
    user.accountNumber = generateAccountNumber();
    await user.save();

    res.json({ message: 'User registration approved successfully' });
  } catch (error) {
    console.error('Approve registration error:', error);
    res.status(500).json({ message: 'Server error while approving registration' });
  }
});

// Reject a registration
router.put('/registrations/:userId/reject', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({ message: 'User is not pending approval' });
    }

    await user.deleteOne();

    res.json({ message: 'User registration rejected successfully' });
  } catch (error) {
    console.error('Reject registration error:', error);
    res.status(500).json({ message: 'Server error while rejecting registration' });
  }
});



export default router;