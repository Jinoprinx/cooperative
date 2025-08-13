import express from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User.js';
import { authenticateToken, isRoleAdmin } from '../middleware/auth.js';
import { handleError } from '../utils/error.js';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';
import upload from '../middleware/upload.js';

const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber, superAdminKey } = req.body;
    console.log('Register attempt for email:', email);
    console.log('Register attempt with password:', password);

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Determine if the user should be an admin
    const adminSecretKey = process.env.ADMIN_KEY || 'defaultAdminSecret';
    const userRole = superAdminKey === adminSecretKey ? 'admin' : 'user';

    // Create new user
    const user = new User({
      firstName,
      lastName,
      email,
      password, // Save the plain text password
      phoneNumber,
      role: userRole,
      status: 'pending', // Set status to pending
    });

    await user.save();

    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
    });
  } catch (error) {
    handleError(res, error, 'Server error during registration');
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { credential, password } = req.body;
    console.log('Login attempt for:', credential);

    // Find user by email or phone number
    const user = await User.findOne({
      $or: [{ email: credential }, { phoneNumber: credential }],
    });

    if (!user) {
      console.log('User not found for:', credential);
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    console.log('User found. Stored hashed password:', user.password);

    // Check if user is active
    if (!user.isActive) {
      return res.status(400).json({ message: 'Account has been deactivated' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    console.log('Password comparison result (isMatch):', isMatch);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // Construct the full URL for the profile image if it exists
    const profileImageUrl = user.profileImage ? `${req.protocol}://${req.get('host')}/${user.profileImage.replace(/\\/g, "/")}` : null;

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accountNumber: user.accountNumber,
        profileImage: profileImageUrl,
      },
    });
  } catch (error) {
    handleError(res, error, 'Server error during login');
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Construct the full URL for the profile image if it exists
    const profileImageUrl = user.profileImage ? `${req.protocol}://${req.get('host')}/${user.profileImage.replace(/\\/g, "/")}` : null;

    res.json({
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        accountNumber: user.accountNumber,
        accountBalance: user.accountBalance,
        profileImage: profileImageUrl,
        joinDate: user.joinDate,
        lastLogin: user.lastLogin,
        isActive: user.isActive,
        bankAccount: user.bankAccount,
    });
  } catch (error) {
    handleError(res, error, 'Server error while fetching profile');
  }
});

// Update user profile
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (req.body.profileImage) user.profileImage = req.body.profileImage;
    
    await user.save();
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    handleError(res, error, 'Server error while updating profile');
  }
});

// Connect bank account for auto-deduction
router.post('/connect-bank', authenticateToken, async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, autoDeductionAmount, autoDeductionDay } = req.body;
    
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.bankAccount = {
      bankName,
      accountNumber,
      accountName,
      autoDeductionAmount: autoDeductionAmount || 0,
      autoDeductionDay: autoDeductionDay || 1,
      isActive: true,
    };
    
    await user.save();
    
    res.json({
      message: 'Bank account connected successfully',
      bankAccount: user.bankAccount,
    });
  } catch (error) {
    handleError(res, error, 'Server error while connecting bank account');
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour

    await user.save();

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click on this link to reset your password: \n\n ${resetUrl}`;
    await sendEmail(user.email, 'Password reset token', message);

    res.status(200).json({ message: 'Email sent' });
  } catch (error) {
    handleError(res, error, 'Error sending email');
  }
});

router.put('/reset-password/:token', async (req, res) => {
  try {
    // Get hashed token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token is invalid or has expired' });
    }

    // Set new password
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    handleError(res, error, 'Error resetting password');
  }
});

// Deactivate user account
router.put('/deactivate', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.isActive = false;
    
    // If user has bank connected, deactivate auto-deduction
    if (user.bankAccount) {
      user.bankAccount.isActive = false;
    }
    
    await user.save();
    
    res.json({ message: 'Account deactivated successfully' });
  } catch (error) {
    handleError(res, error, 'Server error while deactivating account');
  }
});

// Upload profile image
router.post('/profile/image', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Update user's profile image path, ensuring forward slashes for URL compatibility
    const imagePath = req.file.path.replace(/\\/g, "/");
    user.profileImage = imagePath;
    await user.save();

    // Construct the full URL for the response
    const fullImageUrl = `${req.protocol}://${req.get('host')}/${imagePath}`;

    res.json({
      message: 'Profile image uploaded successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profileImage: fullImageUrl,
      },
    });
  } catch (error) {
    handleError(res, error, 'Server error while uploading profile image');
  }
});


export default router;