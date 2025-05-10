import express from 'express';
import Theater from '../models/theater.js';

const router = express.Router();

// Get all theaters
router.get('/', async (req, res) => {
  try {
    const theaters = await Theater.find().populate('screens');
    res.json(theaters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get theaters by city
router.get('/city/:city', async (req, res) => {
  try {
    const theaters = await Theater.find({ city: req.params.city }).populate('screens');
    res.json(theaters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get theater by ID
router.get('/:id', async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id).populate('screens');
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    res.json(theater);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new theater
router.post('/', async (req, res) => {
  const theater = new Theater(req.body);
  try {
    const newTheater = await theater.save();
    res.status(201).json(newTheater);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update theater
router.put('/:id', async (req, res) => {
  try {
    const theater = await Theater.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    res.json(theater);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add screen to theater
router.post('/:id/screens', async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    theater.screens.push(req.body);
    const updatedTheater = await theater.save();
    res.json(updatedTheater);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete theater
router.delete('/:id', async (req, res) => {
  try {
    const theater = await Theater.findByIdAndDelete(req.params.id);
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }
    res.json({ message: 'Theater deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 