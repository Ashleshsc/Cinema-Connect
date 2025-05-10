import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Return user data (excluding password) and token
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.json({
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const signup = async (req, res) => {
  try {
    // Log the received request body for debugging
    console.log('Signup request body:', req.body);

    const { name, email, password, phone, address, city, state, zipCode } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user && user.status !== 'pending') {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[DEBUG] Signup OTP for', email, ':', otp);

    // Hash password (to store temporarily)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Store signup data and OTP in a pending user record
    let pendingUser = await User.findOne({ email });
    if (!pendingUser) {
      pendingUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        address,
        city,
        state,
        zipCode,
        status: 'pending',
        resetPasswordToken: otp,
        resetPasswordExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
      });
      await pendingUser.save();
    } else {
      // If user exists but is pending, update OTP
      pendingUser.resetPasswordToken = otp;
      pendingUser.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
      await pendingUser.save();
    }

    // Send OTP email
    const subject = 'Your Signup OTP for CinemaConnect';
    const html = `<p>Your OTP for signup is: <b>${otp}</b></p><p>This OTP is valid for 10 minutes.</p>`;
    await sendTicketEmail(email, subject, html);
    res.status(200).json({ message: 'OTP sent to your email. Please verify to complete signup.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, status: 'pending' });
    if (!user) {
      return res.status(404).json({ message: 'No pending signup found for this email.' });
    }
    if (!user.resetPasswordToken || user.resetPasswordToken !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }
    if (user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'OTP expired.' });
    }
    // Mark user as active
    user.status = 'user';
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      state: user.state,
      zipCode: user.zipCode
    };
    res.status(200).json({ message: 'Signup verified successfully.', token, user: userData });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

import crypto from 'crypto';
import { sendTicketEmail } from '../utils/mailer.js';

// Forgot Password (send OTP)
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[DEBUG] Generated OTP for', email, ':', otp);
    const user = await User.findOneAndUpdate(
      { email },
      {
        resetPasswordToken: otp,
        resetPasswordExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
      },
      { new: true, runValidators: false }
    );
    if (!user) {
      return res.status(404).json({ message: 'No account with that email found.' });
    }
    // Send OTP email
    const subject = 'Your Password Reset OTP';
    const html = `<p>Your OTP for password reset is: <b>${otp}</b></p><p>This OTP is valid for 10 minutes.</p>`;
    console.log('[DEBUG] Sending OTP email with subject:', subject, 'and html:', html);
    await sendTicketEmail(user.email, subject, html);
    res.json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password with OTP
const resetPasswordWithOtp = async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.findOneAndUpdate(
      {
        email,
        resetPasswordToken: otp,
        resetPasswordExpires: { $gt: Date.now() }
      },
      {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      },
      { new: true, runValidators: false }
    );
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }
    res.json({ message: 'Password has been reset.' });
  } catch (error) {
    console.error('Reset password (OTP) error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.findOneAndUpdate(
      {
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
      },
      {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpires: undefined
      },
      { new: true, runValidators: false }
    );
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }
    res.json({ message: 'Password has been reset.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { login, signup, forgotPassword, resetPassword, resetPasswordWithOtp, verifySignupOtp };