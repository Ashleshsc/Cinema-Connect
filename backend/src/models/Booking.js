import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  movie: {
    id: { type: Number, required: true },
    title: { type: String, required: true },
    poster_path: { type: String }
  },
  theater: {
    id: { type: String, required: true },
    name: { type: String, required: true }
  },
  screen: {
    id: { type: String, required: true },
    name: { type: String, required: true }
  },
  showtime: {
    id: { type: String, required: true },
    time: { type: String, required: true },
    price: { type: Number, required: true }
  },
  seats: [{
    id: { type: String, required: true },
    row: { type: String, required: true },
    number: { type: Number, required: true }
  }],
  date: {
    type: Date,
    required: true
  },
  payment: {
    method: { type: String, required: true },
    amount: { type: Number, required: true },
    paymentId: { type: String, required: true },
    status: { type: String, required: true, default: 'pending' }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  isRental: {
    type: Boolean,
    default: false
  },
  rentalPeriod: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

export default Booking; 