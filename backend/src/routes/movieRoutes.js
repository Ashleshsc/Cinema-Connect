import express from 'express';
import fetch from 'node-fetch';
const router = express.Router();

const TMDB_API_KEY = 'b2369b1aa7347ec284e849bf9fd06bde';  // Your API key
console.log('Using TMDB API Key:', TMDB_API_KEY);
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Get movies based on section
router.get('/', async (req, res) => {
  try {
    const { section, search } = req.query;
    let url;

    if (search) {
      url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${search}&language=en-US&page=1`;
    } else {
      switch (section) {
        case 'top-rated':
          url = `${TMDB_BASE_URL}/movie/top_rated?api_key=${TMDB_API_KEY}&language=en-US&page=1`;
          break;
        case 'upcoming':
          const today = new Date().toISOString().split('T')[0];
          url = `${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&region=IN&page=1&primary_release_date.gte=${today}`;
          break;
        case 'indian':
          url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=hi&sort_by=popularity.desc&page=1`;
          break;
        case 'rent':
          url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&primary_release_date.lte=${getOneMonthAgo()}&page=1`;
          break;
        default: // featured/new releases
          url = `${TMDB_BASE_URL}/movie/now_playing?api_key=${TMDB_API_KEY}&language=en-US&region=IN&page=1`;
      }
    }

    console.log('Making request to TMDB with URL:', url);
    
    try {
      const response = await fetch(url);
      console.log('TMDB Response Status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('TMDB Error Response:', errorText);
        return res.status(500).json({ 
          error: 'Failed to fetch from TMDB',
          status: response.status,
          tmdbError: errorText
        });
      }

      const data = await response.json();
      console.log('TMDB Response Data (first movie):', data.results?.[0]);

      if (!data.results) {
        return res.status(500).json({ error: 'Invalid response format from TMDB' });
      }

      const movies = data.results.map(movie => ({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null,
        overview: movie.overview,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        genre_ids: movie.genre_ids
      }));

      console.log('Successfully processed movies, sending response');
      res.json(movies);
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      res.status(500).json({ error: 'Network error while fetching from TMDB', details: fetchError.message });
    }
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get movie details by ID
router.get('/:id', async (req, res) => {
  try {
    const url = `${TMDB_BASE_URL}/movie/${req.params.id}?api_key=${TMDB_API_KEY}&language=en-US`;
    console.log('Fetching movie details from URL:', url);

    const response = await fetch(url);
    
    console.log('TMDB Response Status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('TMDB Error Response:', errorData);
      throw new Error('Movie not found');
    }

    const movie = await response.json();
    movie.poster_path = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
    movie.backdrop_path = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : null;
    
    res.json(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(404).json({ message: error.message });
  }
});

// Helper function to get date one month ago
function getOneMonthAgo() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
}

export default router;