import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Loan, { ILoan } from '../models/Loan.js';
import User from '../models/User.js';
import Transaction, { ITransaction } from '../models/Transaction.js';
import { authenticateToken, isRoleAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get user's active loans
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const activeLoans = await Loan.find({
      user: req.user?.id,
      status: { $in: ['approved', 'active'] },
    }).sort({ createdAt: -1 });

    const loansWithNextPayment = activeLoans.map(loan => {
      // Calculate next payment date based on last repayment or approval date
      let lastPaymentDate = loan.approvalDate || loan.createdAt;
      if (loan.repaymentHistory && loan.repaymentHistory.length > 0) {
        lastPaymentDate = loan.repaymentHistory[loan.repaymentHistory.length - 1].date;
      }

      const nextPaymentDate = new Date(lastPaymentDate);
      nextPaymentDate.setDate(loan.paymentDueDay);

      // If the calculated next payment date is in the past, move it to the next month
      if (nextPaymentDate.getTime() < new Date().getTime()) {
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
      }

      return {
        ...loan.toObject(),
        nextPaymentDate: nextPaymentDate.toISOString(),
      };
    });

    res.json(loansWithNextPayment);
  } catch (error) {
    console.error('Get active loans error:', error);
    res.status(500).json({ message: 'Server error while fetching active loans' });
  }
});

// Get user's loan history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    // Fetch loan applications/approvals
    const loans = (await Loan.find({ user: req.user?.id })
      .sort({ createdAt: -1 })
      .lean()) as (ILoan & { createdAt: Date })[]; // Explicitly cast to include createdAt

    // Fetch loan-related transactions (disbursements and repayments)
    const transactions = (await Transaction.find({
      user: req.user?.id,
      type: { $in: ['loan_disbursement', 'loan_repayment'] },
    })
      .sort({ createdAt: -1 })
      .lean()) as (ITransaction & { date: Date })[]; // Explicitly cast to include date

    // Combine and sort by date
    const combinedHistory = [...loans, ...transactions].sort((a, b) => {
      const dateA = 'createdAt' in a ? a.createdAt : a.date;
      const dateB = 'createdAt' in b ? b.createdAt : b.date;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    // Paginate the combined history
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    const paginatedHistory = combinedHistory.slice(startIndex, endIndex);
    
    res.json({
      history: paginatedHistory,
      totalPages: Math.ceil(combinedHistory.length / limitNum),
      currentPage: pageNum,
      total: combinedHistory.length,
    });
  } catch (error) {
    console.error('Get loan history error:', error);
    res.status(500).json({ message: 'Server error while fetching loan history' });
  }
});

// Apply for a new loan
router.post('/apply', authenticateToken, async (req, res) => {
  try {
    const { amount, durationMonths, purpose, paymentDueDay, sureties } = req.body;

    if (!amount || amount <= 0 || !durationMonths || durationMonths <= 0 || !purpose) {
      return res.status(400).json({ message: 'Invalid loan application details' });
    }

    if (!sureties || !Array.isArray(sureties) || sureties.length < 1) {
      return res.status(400).json({ message: 'At least one surety is required' });
    }

    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const existingActiveLoan = await Loan.findOne({
      user: req.user?.id,
      status: { $in: ['approved', 'active'] },
    });

    if (existingActiveLoan) {
      return res.status(400).json({ message: 'You already have an active loan' });
    }

    const suretyUsers = await User.find({ phoneNumber: { $in: sureties } });
    if (suretyUsers.length !== sureties.length) {
      return res.status(400).json({ message: 'One or more surety members could not be found.' });
    }

    const interestRate = 5;

    const loan = new Loan({
      user: req.user?.id,
      amount,
      interestRate,
      durationMonths,
      purpose,
      paymentDueDay: paymentDueDay || 15,
      sureties: suretyUsers.map(u => ({ user: u._id, status: 'pending' })),
    });

    await loan.save();

    res.status(201).json({
      message: 'Loan application submitted successfully',
      loan,
    });
  } catch (error) {
    console.error('Loan application error:', error);
    res.status(500).json({ message: 'Server error while processing loan application' });
  }
});

// Get pending surety requests for the logged-in user
router.get('/surety-requests', authenticateToken, async (req, res) => {
  try {
    const suretyRequests = await Loan.find({
      sureties: {
        $elemMatch: {
          user: req.user?.id,
          status: 'pending'
        }
      }
    }).populate('user', 'firstName lastName');
    res.json(suretyRequests);
  } catch (error) {
    console.error('Get surety requests error:', error);
    res.status(500).json({ message: 'Server error while fetching surety requests' });
  }
});

// Respond to a surety request
router.put('/:loanId/surety-response', authenticateToken, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const surety = loan.sureties.find(s => s.user.toString() === req.user?.id);
    if (!surety) {
      return res.status(403).json({ message: 'You are not a surety for this loan' });
    }

    if (surety.status !== 'pending') {
      return res.status(400).json({ message: `You have already responded to this surety request.` });
    }

    surety.status = status;
    await loan.save();

    res.json({ message: `Surety request ${status} successfully` });
  } catch (error) {
    console.error('Surety response error:', error);
    res.status(500).json({ message: 'Server error while responding to surety request' });
  }
});


// Admin: Get all pending loan applications
router.get('/pending', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const pendingLoans = await Loan.find({ status: 'pending' })
      .populate('user', 'firstName lastName accountNumber')
      .sort({ createdAt: 1 });
    
    res.json(pendingLoans);
  } catch (error) {
    console.error('Get pending loans error:', error);
    res.status(500).json({ message: 'Server error while fetching pending loans' });
  }
});

// Admin: Approve or reject a loan
router.put('/:loanId/status', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { status, reason } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    
    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan is not in pending status' });
    }

    if (status === 'approved') {
      const approvedSureties = loan.sureties.filter(s => s.status === 'approved').length;
      if (approvedSureties < 1) {
        return res.status(400).json({ message: 'Loan cannot be approved until at least one surety has approved it.' });
      }
    }

    loan.status = status;
    //loan.approvedBy = req.user?.id; (Review Later)
    
    if (status === 'approved') {
      // Disburse loan amount to user's account
      const user = await User.findById(loan.user);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user balance
      const balanceBefore = user.accountBalance;
      user.accountBalance += loan.amount;
      await user.save();
      
      // Generate a unique reference
      const reference = `LOAN-${uuidv4().substring(0, 8)}-${Date.now()}`;
      
      // Create transaction record for loan disbursement
      const transaction = new Transaction({
        user: loan.user,
        type: 'loan_disbursement',
        amount: loan.amount,
        description: `Loan disbursement - ${loan.purpose}`,
        reference,
        balanceBefore,
        balanceAfter: user.accountBalance,
        status: 'completed',
      });
      
      await transaction.save();
      
      // Update loan status to active after disbursement
      loan.status = 'active';
    }
    
    await loan.save();
    
    res.json({
      message: `Loan ${status === 'approved' ? 'approved and disbursed' : 'rejected'} successfully`,
      loan,
    });
  } catch (error) {
    console.error('Update loan status error:', error);
    res.status(500).json({ message: 'Server error while updating loan status' });
  }
});

// Admin: Reject a loan
router.put('/:loanId/reject', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { loanId } = req.params;
    const loan = await Loan.findById(loanId);

    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (loan.status !== 'pending') {
      return res.status(400).json({ message: 'Loan is not pending' });
    }

    loan.status = 'rejected';
    await loan.save();

    res.json({ message: 'Loan rejected successfully' });
  } catch (error) {
    console.error('Reject loan error:', error);
    res.status(500).json({ message: 'Server error while rejecting loan' });
  }
});

// Make a loan repayment
router.post('/:loanId/repayment', authenticateToken, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid repayment amount' });
    }
    
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    
    if (loan.user.toString() !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to make repayment for this loan' });
    }
    
    if (!['approved', 'active'].includes(loan.status)) {
      return res.status(400).json({ message: 'Loan is not active' });
    }
    
    if (amount > loan.remainingAmount) {
      return res.status(400).json({ message: 'Repayment amount exceeds remaining loan amount' });
    }
    
    const user = await User.findById(loan.user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has sufficient balance
    if (user.accountBalance < amount) {
      return res.status(400).json({ message: 'Insufficient funds for loan repayment' });
    }
    
    // Generate a unique reference
    const reference = `REP-${uuidv4().substring(0, 8)}-${Date.now()}`;
    
    // Update user balance
    const balanceBefore = user.accountBalance;
    user.accountBalance -= amount;
    await user.save();
    
    // Update loan
    loan.amountPaid += amount;
    loan.remainingAmount -= amount;
    
    // Add to repayment history
    loan.repaymentHistory.push({
      amount,
      date: new Date(),
      reference,
    });
    
    // Check if loan is fully repaid
    if (loan.remainingAmount <= 0) {
      loan.status = 'completed';
      loan.nextPaymentDate = undefined; // No more payments needed
    } else {
      // Update next payment date
      const nextPayment = new Date();
      nextPayment.setDate(loan.paymentDueDay);
      if (nextPayment.getTime() < new Date().getTime()) {
        nextPayment.setMonth(nextPayment.getMonth() + 1);
      }
      loan.nextPaymentDate = nextPayment;
    }
    
    await loan.save();
    
    // Create transaction record for loan repayment
    const transaction = new Transaction({
      user: loan.user,
      type: 'loan_repayment',
      amount,
      description: 'Loan repayment',
      reference,
      balanceBefore,
      balanceAfter: user.accountBalance,
      status: 'completed',
    });
    
    await transaction.save();
    
    res.json({
      message: 'Loan repayment processed successfully',
      loan,
      newBalance: user.accountBalance,
    });
  } catch (error) {
    console.error('Loan repayment error:', error);
    res.status(500).json({ message: 'Server error while processing loan repayment' });
  }
});


// Get all loans (for admin)
router.get('/', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const loans = await Loan.find({})
      .populate('user', 'firstName lastName accountNumber')
      .sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    console.error('Get all loans error:', error);
    res.status(500).json({ message: 'Server error while fetching all loans' });
  }
});

// Admin: Generate loan report
router.get('/report', authenticateToken, isRoleAdmin, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    const query: any = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }
    
    if (status) {
      query.status = status;
    }
    
    const loans = await Loan.find(query)
      .populate('user', 'firstName lastName accountNumber')
      .sort({ createdAt: -1 });
    
    // Calculate summary statistics
    const totalLoansAmount = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const totalInterestAmount = loans.reduce((sum, loan) => sum + (loan.totalInterest || 0), 0);
    const totalRepaidAmount = loans.reduce((sum, loan) => sum + loan.amountPaid, 0);
    const totalOutstandingAmount = loans.reduce((sum, loan) => {
      if (['approved', 'active'].includes(loan.status)) {
        return sum + (loan.remainingAmount || 0);
      }
      return sum;
    }, 0);
    
    const statusCounts = {
      pending: loans.filter(loan => loan.status === 'pending').length,
      approved: loans.filter(loan => loan.status === 'approved').length,
      active: loans.filter(loan => loan.status === 'active').length,
      completed: loans.filter(loan => loan.status === 'completed').length,
      rejected: loans.filter(loan => loan.status === 'rejected').length,
      defaulted: loans.filter(loan => loan.status === 'defaulted').length,
    };
    
    res.json({
      loans,
      summary: {
        totalLoansCount: loans.length,
        totalLoansAmount,
        totalInterestAmount,
        totalRepaidAmount,
        totalOutstandingAmount,
        statusCounts,
      },
    });
  } catch (error) {
    console.error('Loan report error:', error);
    res.status(500).json({ message: 'Server error while generating loan report' });
  }
});

export default router;