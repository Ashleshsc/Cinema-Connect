import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Booking from '../models/Booking.js';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
router.post('/create-order', async (req, res) => {
  console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID);
  console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);
  console.log('Order create request body:', req.body);

  try {
    const { amount, currency, receipt, notes, paymentMethod } = req.body;

    // For wallet payments, skip Razorpay order creation
    if (paymentMethod === 'wallet') {
      // Get user from token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Verify token and get user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if user has sufficient wallet balance
      if (user.walletBalance < amount) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }

      // Create a mock order for wallet payment
      const order = {
        id: `wallet_${Date.now()}`,
        amount: amount,
        currency: currency,
        receipt: receipt,
        notes: notes,
        status: 'created'
      };

      return res.json(order);
    }

    // For other payment methods, create Razorpay order
    const options = {
      amount: amount,
      currency: currency,
      receipt: receipt,
      notes: notes
    };

    try {
      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (rzpError) {
      console.error('Razorpay API error:', rzpError && rzpError.error ? rzpError.error : rzpError);
      res.status(500).json({ error: 'Failed to create order', details: rzpError && rzpError.error ? rzpError.error : rzpError });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order', details: error.message });
  }
});

// Verify payment
router.post('/verify', async (req, res) => {
  console.log('Payment verification request received');
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingDetails, paymentMethod } = req.body;
    
    if (!bookingDetails) {
      return res.status(400).json({ error: 'Booking details are required' });
    }
    
    console.log('Processing booking details:', JSON.stringify(bookingDetails, null, 2));
    
    // Ensure user is set
    if (!bookingDetails.user) {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          bookingDetails.user = decoded.userId || decoded.id || decoded._id;
          console.log('Set user from token:', bookingDetails.user);
        } catch (err) {
          console.error('Failed to extract user from token:', err);
        }
      }
      
      // If still no user, use a default guest user ID
      if (!bookingDetails.user) {
        bookingDetails.user = 'guest_user_' + Date.now();
        console.log('Using guest user ID:', bookingDetails.user);
      }
    }
    
    // Ensure all required objects have IDs
    if (bookingDetails.theater && !bookingDetails.theater.id) {
      bookingDetails.theater.id = `theater_${bookingDetails.theater.name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}_${Date.now()}`;
      console.log('Generated theater ID:', bookingDetails.theater.id);
    }
    
    if (bookingDetails.screen && !bookingDetails.screen.id) {
      bookingDetails.screen.id = `screen_${bookingDetails.screen.name?.replace(/\s+/g, '_').toLowerCase() || 'unknown'}_${Date.now()}`;
      console.log('Generated screen ID:', bookingDetails.screen.id);
    }
    
    // Ensure status is set
    if (!bookingDetails.status) {
      bookingDetails.status = 'confirmed';
    }

    // For wallet payments
    if (paymentMethod === 'wallet') {
      // Get user from token
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Verify token and get user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Deduct amount from wallet
      user.walletBalance -= bookingDetails.amount;
      await user.save();

      // Create booking
      const booking = new Booking({
        ...bookingDetails,
        paymentId: `wallet_${Date.now()}`,
        status: 'confirmed'
      });
      await booking.save();

      return res.json({ success: true, message: 'Payment verified successfully' });
    }

    // For Razorpay payments
    if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
  
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_SECRET)
        .update(body.toString())
        .digest('hex');
  
      const isAuthentic = expectedSignature === razorpay_signature;
  
      if (isAuthentic) {
        try {
          // Create a new booking
          console.log('Creating booking with details:', JSON.stringify(bookingDetails, null, 2));
          const booking = new Booking(bookingDetails);
          const savedBooking = await booking.save();
          console.log('Booking created successfully with ID:', savedBooking._id);
  
          return res.json({
            success: true,
            message: 'Payment verified successfully',
            booking: savedBooking
          });
        } catch (error) {
          console.error('Error saving booking:', error);
          return res.status(500).json({
            success: false,
            message: 'Payment verified but booking creation failed',
            error: error.message
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed - signature mismatch'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay parameters'
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Verify rental payment and save as rental booking
router.post('/verify-rental', async (req, res) => {
  try {
    console.log('Received rental verification request:', {
      headers: req.headers,
      body: JSON.stringify(req.body, null, 2)
    });

    const { paymentId, orderId, signature, rentalDetails } = req.body;
    
    if (!rentalDetails) {
      console.error('Missing rentalDetails in request body');
      return res.status(400).json({ error: 'Missing rental details' });
    }

    if (!rentalDetails.movie) {
      console.error('Missing movie in rentalDetails:', JSON.stringify(rentalDetails, null, 2));
      return res.status(400).json({ error: 'Missing movie details' });
    }

    if (!rentalDetails.user) {
      console.error('Missing user in rentalDetails:', JSON.stringify(rentalDetails, null, 2));
      return res.status(400).json({ error: 'Missing user details' });
    }

    // Get user ID from token if available
    const token = req.headers.authorization?.split(' ')[1];
    let userId = rentalDetails.user;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId || decoded.id || decoded._id;
        console.log('User ID from token:', userId);
      } catch (err) {
        console.error('Failed to extract user from token:', err);
      }
    }

    // Handle user ID conversion
    let userObjectId;
    try {
      if (typeof userId === 'string' && /^[0-9a-fA-F]{24}$/.test(userId)) {
        userObjectId = new ObjectId(userId);
        console.log('Successfully created ObjectId:', userObjectId);
      } else {
        console.log('Using user ID as is:', userId);
        userObjectId = userId;
      }
    } catch (err) {
      console.error('Error handling user ID:', err);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    console.log('[RENTAL] Saving rental for user:', userObjectId);

    // Ensure movie object has all required fields
    const movieData = {
      id: rentalDetails.movie.id,
      title: rentalDetails.movie.title,
      poster_path: rentalDetails.movie.poster_path,
      overview: rentalDetails.movie.overview || '',
      release_date: rentalDetails.movie.release_date || new Date().toISOString(),
      vote_average: rentalDetails.movie.vote_average || 0
    };

    console.log('[RENTAL] Movie data:', JSON.stringify(movieData, null, 2));

    try {
      // Save as a booking with isRental: true
      const rentalBooking = new Booking({
        user: userObjectId,
        movie: movieData,
        theater: { id: 'rental', name: 'Online Rental' },
        screen: { id: 'rental', name: 'Rental' },
        showtime: { id: 'rental', time: 'On Demand', price: rentalDetails.rentalPrice },
        seats: [],
        date: new Date(),
        payment: {
          method: 'razorpay',
          amount: rentalDetails.rentalPrice,
          paymentId: paymentId,
          status: 'success'
        },
        status: 'confirmed',
        isRental: true,
        rentalPeriod: rentalDetails.rentalPeriod || '48 hours',
        createdAt: new Date()
      });

      const savedBooking = await rentalBooking.save();
      console.log('[RENTAL] Rental booking saved:', savedBooking._id);
      
      res.json({ 
        success: true, 
        message: 'Rental saved successfully', 
        booking: savedBooking,
        bookingId: savedBooking._id
      });
    } catch (saveError) {
      console.error('Error saving rental booking:', saveError);
      if (saveError.name === 'ValidationError') {
        console.error('Validation errors:', saveError.errors);
        return res.status(400).json({ 
          error: 'Validation error',
          details: saveError.errors 
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Error in verify-rental endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to save rental booking',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router; 