import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { auth } from '../middleware/auth.js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Get wallet details
router.get('/details', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      balance: user.walletBalance || 0,
      transactions
    });
  } catch (error) {
    console.error('Error fetching wallet details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add money to wallet (create Razorpay order)
router.post('/add', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paise
      currency: 'INR',
      receipt: `wallet_${Date.now()}_${req.user.id}`,
      notes: {
        userId: req.user.id
      }
    };

    console.log('Creating Razorpay order with options:', {
      ...options,
      key_id: process.env.RAZORPAY_KEY_ID
    });

    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created:', order);

    res.json({
      ...order,
      key: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating wallet order:', error);
    res.status(500).json({ 
      message: 'Failed to create order',
      error: error.message || 'Unknown error'
    });
  }
});

// Verify payment and update wallet
router.post('/verify', auth, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      amount 
    } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature !== expectedSign) {
      console.error('Invalid signature:', {
        received: razorpay_signature,
        expected: expectedSign
      });
      return res.status(400).json({ message: 'Invalid signature' });
    }

    // Verify payment status with Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== 'captured') {
      return res.status(400).json({ message: 'Payment not captured' });
    }

    // Find user and update wallet
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create transaction
    const transaction = new Transaction({
      userId: user._id,
      type: 'credit',
      amount: amount,
      description: 'Wallet top-up',
      status: 'success',
      metadata: {
        razorpay_order_id,
        razorpay_payment_id
      }
    });

    // Update wallet balance
    user.walletBalance = (user.walletBalance || 0) + amount;
    console.log('Updated wallet balance:', user.walletBalance);

    await Promise.all([
      transaction.save(),
      user.save()
    ]);

    res.json({
      success: true,
      message: 'Payment verified and wallet updated',
      transactionId: transaction._id,
      newBalance: user.walletBalance
    });
  } catch (error) {
    console.error('Error verifying wallet payment:', error);
    res.status(500).json({ message: 'Verification failed' });
  }
});

export default router;
