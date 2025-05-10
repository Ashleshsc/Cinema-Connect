import mongoose from 'mongoose';

const screenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  theater: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Theater',
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  showtimes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showtime'
  }],
  type: {
    type: String,
    enum: ['Standard', 'Premium', 'IMAX', '4DX'],
    default: 'Standard'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Screen = mongoose.model('Screen', screenSchema); 