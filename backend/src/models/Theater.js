import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  row: {
    type: String,
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  }
});

const showtimeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  seats: [seatSchema]
});

const screenSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  showtimes: [showtimeSchema]
});

const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  screens: [screenSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
theaterSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Theater = mongoose.models.Theater || mongoose.model('Theater', theaterSchema);

export default Theater;