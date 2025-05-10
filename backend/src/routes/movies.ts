import express, { Router } from 'express';
import axios from 'axios';

const router: Router = express.Router();

// TMDB API configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p';

// Get all movies (popular movies from TMDB)
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US',
        page: 1
      }
    });
    
    // Transform TMDB data to match our Movie interface
    const movies = response.data.results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      genre: movie.genre_ids || [],
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
router.get('/:id', async (req, res) => {
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
      genre: movie.genres.map((g: any) => g.name),
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

export default router; 