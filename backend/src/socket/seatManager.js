import { Server } from 'socket.io';
import Booking from '../models/Booking.js';

// Store temporary seat locks with timestamps
const seatLocks = new Map();
const LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

export const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Clean up expired locks periodically
  setInterval(() => {
    const now = Date.now();
    for (const [seatId, lock] of seatLocks.entries()) {
      if (now - lock.timestamp > LOCK_TIMEOUT) {
        seatLocks.delete(seatId);
        io.to(lock.showtimeId).emit('seatReleased', { seatId });
      }
    }
  }, 60000); // Check every minute

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a showtime room
    socket.on('joinShowtime', async (showtimeId) => {
      socket.join(showtimeId);
      console.log(`Client ${socket.id} joined showtime ${showtimeId}`);
      
      // Send current booked seats to the client
      try {
        const bookedSeats = await Booking.find({
          'showtime.id': showtimeId,
          status: 'confirmed'
        }).select('seats');
        
        const bookedSeatIds = bookedSeats.flatMap(booking => 
          booking.seats.map(seat => seat.id)
        );
        
        socket.emit('bookedSeats', { seatIds: bookedSeatIds });
      } catch (error) {
        console.error('Error fetching booked seats:', error);
      }
    });

    // Handle seat selection
    socket.on('selectSeat', async ({ showtimeId, seatId, userId }) => {
      try {
        // Check if seat is already booked in the database
        const existingBooking = await Booking.findOne({
          'showtime.id': showtimeId,
          'seats.id': seatId,
          status: 'confirmed'
        });

        if (existingBooking) {
          socket.emit('seatSelectionError', {
            seatId,
            message: 'Seat is already booked'
          });
          return;
        }

        const now = Date.now();
        const existingLock = seatLocks.get(seatId);

        if (existingLock) {
          if (now - existingLock.timestamp < LOCK_TIMEOUT) {
            // Seat is already locked
            socket.emit('seatSelectionError', {
              seatId,
              message: 'Seat is already selected by another user'
            });
            return;
          }
        }

        // Lock the seat
        seatLocks.set(seatId, {
          userId,
          showtimeId,
          timestamp: now
        });

        // Notify all clients in the showtime room
        io.to(showtimeId).emit('seatSelected', { seatId });
      } catch (error) {
        console.error('Error in seat selection:', error);
        socket.emit('seatSelectionError', {
          seatId,
          message: 'Error processing seat selection'
        });
      }
    });

    // Handle seat release
    socket.on('releaseSeat', ({ showtimeId, seatId, userId }) => {
      const lock = seatLocks.get(seatId);
      if (lock && lock.userId === userId) {
        seatLocks.delete(seatId);
        io.to(showtimeId).emit('seatReleased', { seatId });
      }
    });

    // Handle booking confirmation
    socket.on('confirmBooking', async ({ showtimeId, seatIds, bookingDetails }) => {
      try {
        // Create booking in database
        const booking = new Booking({
          ...bookingDetails,
          status: 'confirmed'
        });
        await booking.save();

        // Release locks for booked seats
        seatIds.forEach(seatId => {
          seatLocks.delete(seatId);
        });

        // Notify all clients about the confirmed booking
        io.to(showtimeId).emit('bookingConfirmed', { seatIds });
      } catch (error) {
        console.error('Error confirming booking:', error);
        socket.emit('bookingError', {
          message: 'Error confirming booking'
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}; 