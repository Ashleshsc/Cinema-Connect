console.log('authRoutes loaded');
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { login, signup, forgotPassword, resetPassword, resetPasswordWithOtp, verifySignupOtp } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'city', 'state', 'zipCode'];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ message: 'Error verifying token' });
  }
});

// Forgot Password
router.post('/forgot-password', forgotPassword);

// Reset Password with OTP
router.post('/reset-password-otp', resetPasswordWithOtp);

// Reset Password (legacy, with token)
router.post('/reset-password', resetPassword);

// Login route
router.post('/login', login);

// Signup route
router.post('/signup', signup);
router.post('/verify-signup-otp', verifySignupOtp);

export default router;