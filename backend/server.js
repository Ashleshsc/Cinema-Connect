import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Theater } from './src/models/Theater.js';
import { Screen } from './src/models/Screen.js';
import { initializeSocket } from './src/socket/seatManager.js';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = initializeSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// --- Add correct auth routes ---
import authRoutes from './src/routes/authRoutes.js';
app.use('/api/auth', authRoutes);
console.log('Auth routes registered at /api/auth');

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Health Check
app.get('/api/health', (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    console.log('Current MongoDB connection state:', dbStatus);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      status: 'ok',
      mongodb: dbStatus === 1 ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.setHeader('Content-Type', 'application/json');
  return res.status(500).json({
    status: 'error',
    message: 'Something broke!',
    timestamp: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to CinemaConnect API' });
});

// Get all movies (popular movies from TMDB)
app.get('/movies', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    });
    
    // Transform TMDB data to match our Movie interface
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      genre: movie.genre_ids || [], // We'll need to fetch genre names separately
      poster_path: `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}`,
      overview: movie.overview,
      release_date: movie.release_date
    }));
    
    res.json(movies);
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ message: 'Error fetching movies' });
  }
});

// Get movie by ID
app.get('/movies/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      }
    });
    
    const movie = response.data;
    const formattedMovie = {
      id: movie.id,
      title: movie.title,
      genre: movie.genres.map(g => g.name),
      poster_path: `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}`,
      overview: movie.overview,
      release_date: movie.release_date
    };
    
    res.json(formattedMovie);
  } catch (error) {
    console.error(`Error fetching movie with ID ${req.params.id}:`, error);
    res.status(404).json({ message: 'Movie not found' });
  }
});

// Get movies by genre
app.get('/movies/genre/:genre', async (req, res) => {
  try {
    const genre = req.params.genre;
    
    // First, get the genre ID from the genre name
    const genresResponse = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      }
    });
    
    const genreObj = genresResponse.data.genres.find(g => 
      g.name.toLowerCase() === genre.toLowerCase()
    );
    
    if (!genreObj) {
      return res.json([]);
    }
    
    // Then get movies by genre ID
    const response = await axios.get(`${TMDB_BASE_URL}/discover/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        with_genres: genreObj.id,
        sort_by: 'popularity.desc'
      }
    });
    
    const movies = response.data.results.map(movie => ({
      id: movie.id,
      title: movie.title,
      genre: [genre], // We know this movie is in this genre
      poster_path: `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}`,
      overview: movie.overview,
      release_date: movie.release_date
    }));
    
    res.json(movies);
  } catch (error) {
    console.error(`Error fetching movies by genre ${req.params.genre}:`, error);
    res.status(500).json({ message: 'Error fetching movies by genre' });
  }
});

// Get all halls
app.get('/halls', async (req, res) => {
  try {
    const halls = await Hall.find().populate('theater');
    res.json(halls);
  } catch (error) {
    console.error('Error fetching halls:', error);
    res.status(500).json({ message: 'Error fetching halls' });
  }
});

// Get theaters by city
app.get('/api/theaters', async (req, res) => {
  try {
    const { city } = req.query;
    console.log('Fetching theaters for city:', city);

    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }

    const query = { city: { $regex: new RegExp(city, 'i') } };
    console.log('Query:', query);

    const theaters = await Theater.find(query);
    console.log('Found theaters:', theaters.length);

    if (theaters.length === 0) {
      return res.status(404).json({ error: 'No theaters found in this city' });
    }

    res.json(theaters);
  } catch (error) {
    console.error('Error fetching theaters:', error);
    res.status(500).json({ error: 'Failed to fetch theaters' });
  }
});

// Get movies by section (featured, upcoming, etc.)
app.get('/api/movies', async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;

  const fetchWithRetry = async () => {
    try {
      const { section = 'featured' } = req.query;
      let endpoint = '';

      // Log the request details
      console.log('Movie request details:', {
        section,
        TMDB_API_KEY: TMDB_API_KEY ? 'Present' : 'Missing',
        TMDB_BASE_URL,
        TMDB_IMAGE_BASE_URL,
        retryCount
      });

      if (!TMDB_API_KEY) {
        throw new Error('TMDB API key is not configured');
      }

      switch (section) {
        case 'featured':
          endpoint = '/movie/popular';
          break;
        case 'upcoming':
          endpoint = '/movie/upcoming';
          break;
        case 'top_rated':
          endpoint = '/movie/top_rated';
          break;
        default:
          endpoint = '/movie/popular';
      }

      const url = `${TMDB_BASE_URL}${endpoint}`;
      console.log(`Making request to TMDB API (attempt ${retryCount + 1}/${maxRetries}): ${url}`);

      const response = await axios.get(url, {
        params: {
          api_key: TMDB_API_KEY,
          language: 'en-US',
          page: 1
        },
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.data || !response.data.results) {
        throw new Error('Invalid response format from TMDB API');
      }

      // Transform TMDB data to match our Movie interface
      const movies = response.data.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        genre: movie.genre_ids || [],
        poster_path: movie.poster_path ? `${TMDB_IMAGE_BASE_URL}/w500${movie.poster_path}` : null,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        runtime: movie.runtime || 0
      }));

      console.log(`Successfully fetched ${movies.length} movies`);
      return movies;
    } catch (error) {
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        if (retryCount < maxRetries - 1) {
          retryCount++;
          console.log(`Retrying request (${retryCount}/${maxRetries})...`);
          // Wait for 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchWithRetry();
        }
      }
      throw error;
    }
  };

  try {
    const movies = await fetchWithRetry();
    res.json(movies);
  } catch (error) {
    console.error('Detailed error in /api/movies:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        params: error.config?.params
      }
    });

    // Send a more detailed error response
    res.status(500).json({ 
      error: 'Error fetching movies from TMDB',
      message: error.message,
      code: error.code,
      details: error.response?.data || 'No additional details available',
      status: error.response?.status || 500
    });
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 