import express from 'express';
import { auth } from '../middleware/auth.js';
import { validateBookingData } from '../middleware/bookingValidator.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { sendTicketEmail } from '../utils/mailer.js';
import { generateTicketPdf } from '../utils/ticketPdf.js';
const router = express.Router();

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('movie')
      .populate('theater')
      .populate('user');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get bookings for the authenticated user
router.get('/my-bookings', auth, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id || req.user._id;
    if (!userId) {
      console.error('No userId found in token', req.user);
      return res.status(400).json({ message: 'Invalid user token' });
    }
    console.log('Fetching bookings for userId:', userId);
    const bookings = await Booking.find({ user: userId })
      .populate('movie')
      .populate('theater')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error in /my-bookings:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's bookings
router.get('/user/:userId', async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.params.userId })
      .populate('movie')
      .populate('theater')
      .sort({ bookingDate: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('movie')
      .populate('theater')
      .populate('user');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new booking
router.post('/', validateBookingData, async (req, res) => {
  console.log('Received booking payload:', req.body);
  const booking = new Booking(req.body);
  try {
    const newBooking = await booking.save();
    console.log('Booking saved to DB:', newBooking);

    // Fetch user email
    const user = await User.findById(newBooking.user);
    let emailStatus = 'not_sent';
    if (user && user.email) {
      // Compose ticket email
      console.log('Composing email for booking:', newBooking);
      console.log('User info for email:', user);
      const subject = 'Your CinemaConnect Booking Confirmation';
      const html = `
        <h2>Booking Confirmed!</h2>
        <p>Dear ${user.name},</p>
        <p>Your ticket has been booked successfully. Here are your ticket details:</p>
        <ul>
          <li><strong>Movie:</strong> ${newBooking.movie && newBooking.movie.title}</li>
          <li><strong>Theater:</strong> ${newBooking.theater && newBooking.theater.name}</li>
          <li><strong>Screen:</strong> ${newBooking.screen && newBooking.screen.name}</li>
          <li><strong>Showtime:</strong> ${newBooking.showtime && newBooking.showtime.time}</li>
          <li><strong>Date:</strong> ${newBooking.date ? new Date(newBooking.date).toLocaleDateString() : ''}</li>
          <li><strong>Seats:</strong> ${Array.isArray(newBooking.seats) ? newBooking.seats.map(seat => seat.row + seat.number).join(', ') : ''}</li>
        </ul>
        <p>Enjoy your movie!</p>
        <p>— CinemaConnect Team</p>
      `;
      try {
        // Generate PDF ticket
        let pdfBuffer;
        console.log('[DEBUG] Booking object for PDF:', JSON.stringify(newBooking));
        console.log('[DEBUG] User object for PDF:', JSON.stringify(user));
        try {
          pdfBuffer = await generateTicketPdf(newBooking, user);
          console.log('[DEBUG] PDF buffer length:', pdfBuffer && pdfBuffer.length);
        } catch (pdfErr) {
          console.error('[ERROR] Failed to generate PDF ticket:', pdfErr);
          if (pdfErr && pdfErr.stack) {
            console.error('[ERROR] PDF generation stack:', pdfErr.stack);
          }
        }
        const attachments = pdfBuffer ? [{
          filename: 'CinemaConnect-Ticket.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }] : [];
        console.log('[DEBUG] Attachments to be sent:', attachments.map(a => ({ filename: a.filename, size: a.content.length })));
        await sendTicketEmail(
          user.email,
          subject,
          html,
          attachments
        );
        emailStatus = 'sent';
        console.log(`[EMAIL STATUS]: Booking confirmation email SENT to ${user.email}`);
      } catch (mailErr) {
        emailStatus = 'failed';
        console.error(`[EMAIL STATUS]: FAILED to send ticket email to ${user.email}:`, mailErr);
      }
    } else {
      emailStatus = 'not_sent';
      console.warn(`[EMAIL STATUS]: NOT SENT - No email found for user ${user ? user._id : 'unknown'}`);
    }

    res.status(201).json({ booking: newBooking, emailStatus });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update booking
router.put('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Cancel booking
router.put('/:id/cancel', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 