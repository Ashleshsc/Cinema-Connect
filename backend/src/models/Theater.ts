import mongoose from 'mongoose';

const theaterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  screens: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Screen'
  }],
  amenities: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Theater = mongoose.model('Theater', theaterSchema);

export { Theater }; 