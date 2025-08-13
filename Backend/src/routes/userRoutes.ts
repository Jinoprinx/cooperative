import express from 'express';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Search for a user by phone number
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { phone } = req.query;
    console.log('Searching for phone number:', phone);

    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const user = await User.findOne({ phoneNumber: phone as string });
    console.log('Found user:', user);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ name: `${user.firstName} ${user.lastName}` });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ message: 'Server error while searching for user' });
  }
});

export default router;
