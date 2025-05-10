import axios from 'axios';
import { TMDB_API_KEY, TMDB_BASE_URL, TMDB_IMAGE_BASE_URL } from './config';

// Debug log to check if configuration is loaded
console.log('Using configuration from config.ts');
console.log('API Key:', TMDB_API_KEY ? 'Present' : 'Missing');
console.log('Base URL:', TMDB_BASE_URL);
console.log('Image Base URL:', TMDB_IMAGE_BASE_URL);

// Define types for our data
export interface Movie {
  id: number;
  title: string;
  genre: string[];
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average?: number;
  runtime?: number;
  tagline?: string;
  backdrop_path?: string;
  isInBookingWindow?: boolean;
}

// Helper function to transform movie data
const transformMovieData = (movie: any): Movie => {
  return {
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    vote_average: movie.vote_average,
    runtime: movie.runtime,
    genre: movie.genre_ids ? movie.genre_ids.map((id: number) => {
      const genre = genreMap[id];
      return genre || 'Unknown';
    }) : []
  };
};

// Genre mapping
const genreMap: { [key: number]: string } = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

// Helper function to make API requests with better error handling
const makeApiRequest = async (endpoint: string, params: any = {}) => {
  try {
    // Add API key to params if not already present
    if (!params.api_key) {
      params.api_key = TMDB_API_KEY;
    }
    
    // Add language to params if not already present
    if (!params.language) {
      params.language = 'en-US';
    }
    
    console.log(`Making API request to: ${TMDB_BASE_URL}/${endpoint}`);
    console.log('Request params:', { ...params, api_key: params.api_key ? 'Present' : 'Missing' });
    
    const response = await axios.get(`${TMDB_BASE_URL}/${endpoint}`, { params });
    
    console.log(`API Response from ${endpoint}:`, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Check for specific error codes
      if (error.response?.status === 401) {
        throw new Error('API key is invalid or expired. Please check your API key.');
      } else if (error.response?.status === 404) {
        throw new Error(`Endpoint ${endpoint} not found. Please check the API documentation.`);
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }
    
    throw error;
  }
};

// API functions
export const getMovies = async (language: string = 'en-US'): Promise<Movie[]> => {
  try {
    console.log('Fetching popular movies...');
    const data = await makeApiRequest('movie/popular', { page: 1, language });
    
    // Transform all movies without limiting
    return data.results.map((movie: any) => transformMovieData(movie));
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
};

export const getNewReleases = async (language: string = 'en-US'): Promise<Movie[]> => {
  try {
    console.log('Fetching newly released movies in theaters...');
    
    // Get current date and date 1 month ago
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Fetch international new releases
    const internationalMovies = await makeApiRequest('discover/movie', {
      'primary_release_date.gte': formatDate(oneMonthAgo),
      'primary_release_date.lte': formatDate(today),
      'vote_count.gte': 10,
      sort_by: 'release_date.desc',
      page: 1,
      region: 'US',
      language
    });

    // Fetch Indian new releases
    const indianMovies = await makeApiRequest('discover/movie', {
      'primary_release_date.gte': formatDate(oneMonthAgo),
      'primary_release_date.lte': formatDate(today),
      'vote_count.gte': 10,
      sort_by: 'release_date.desc',
      page: 1,
      region: 'IN',
      language: 'hi-IN',
      with_original_language: 'hi'
    });
    
    console.log('International new releases:', internationalMovies);
    console.log('Indian new releases:', indianMovies);
    
    // Combine and deduplicate movies
    const allMovies = [...(internationalMovies.results || []), ...(indianMovies.results || [])];
    const uniqueMovies = Array.from(new Map(allMovies.map(movie => [movie.id, movie])).values());
    
    if (uniqueMovies.length === 0) {
      console.error('No newly released movies found');
      return [];
    }
    
    // Sort by release date (newest first)
    const sortedMovies = uniqueMovies.sort((a: any, b: any) => 
      new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
    );
    
    return sortedMovies.map((movie: any) => transformMovieData(movie));
  } catch (error) {
    console.error('Error fetching newly released movies:', error);
    return [];
  }
};

export const getTopRatedMovies = async (language: string = 'en-US'): Promise<Movie[]> => {
  try {
    console.log('Fetching top rated movies...');
    const data = await makeApiRequest('movie/top_rated', {
      page: 1,
      region: 'US',
      language,
      sort_by: 'vote_average.desc',
      'vote_count.gte': 100 // Only include movies with at least 100 votes
    });
    
    console.log('Top rated movies response:', data);
    
    if (!data.results || data.results.length === 0) {
      console.error('No top rated movies found in the response');
      return [];
    }
    
    // Sort by vote average and filter out movies with low vote counts
    const topRatedMovies = data.results
      .filter((movie: any) => movie.vote_count >= 100)
      .sort((a: any, b: any) => b.vote_average - a.vote_average);
    
    return topRatedMovies.map((movie: any) => transformMovieData(movie));
  } catch (error) {
    console.error('Error fetching top rated movies:', error);
    return [];
  }
};

export const getIndianMovies = async (language: string = 'en-US'): Promise<Movie[]> => {
  try {
    console.log('Fetching Indian movies...');
    const today = new Date();
    const oneMonthAgo = new Date();
    const oneMonthLater = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    oneMonthLater.setMonth(today.getMonth() + 1);
    
    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    // First fetch new releases
    const newReleases = await makeApiRequest('movie/now_playing', {
      page: 1,
      region: 'IN',
      language,
      with_original_language: 'hi'
    });

    // Then fetch upcoming movies
    const upcomingMovies = await makeApiRequest('movie/upcoming', {
      page: 1,
      region: 'IN',
      language,
      with_original_language: 'hi'
    });
    
    console.log('New releases response:', newReleases);
    console.log('Upcoming movies response:', upcomingMovies);
    
    // Combine results, prioritizing new releases
    const allMovies = [
      ...(newReleases.results || []),
      ...(upcomingMovies.results || [])
    ];
    
    // Remove duplicates based on movie ID
    const uniqueMovies = Array.from(new Map(allMovies.map(movie => [movie.id, movie])).values());
    
    // Filter for Indian languages and add isInBookingWindow property
    const indianMovies = uniqueMovies.filter((movie: any) => {
      const isIndian = movie.original_language === 'hi' || 
        movie.original_language === 'ta' || 
        movie.original_language === 'te' || 
        movie.original_language === 'ml' || 
        movie.original_language === 'kn' || 
        movie.original_language === 'bn';
      
      if (isIndian) {
        const releaseDate = new Date(movie.release_date);
        movie.isInBookingWindow = releaseDate >= oneMonthAgo && releaseDate <= oneMonthLater;
      }
      
      return isIndian;
    });
    
    console.log('Combined Indian movies:', indianMovies);
    
    if (indianMovies.length === 0) {
      console.error('No Indian movies found');
      return [];
    }
    
    return indianMovies.map((movie: any) => transformMovieData(movie));
  } catch (error) {
    console.error('Error fetching Indian movies:', error);
    return [];
  }
};

export const getUpcomingMovies = async (language: string = 'en-US'): Promise<Movie[]> => {
  try {
    console.log('Fetching upcoming movies...');
    
    // Get current date and format it for the API
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    const data = await makeApiRequest('movie/upcoming', {
      page: 1,
      region: 'US',
      language,
      'primary_release_date.gte': formattedDate,
      sort_by: 'primary_release_date.asc'
    });
    
    console.log('Upcoming movies response:', data);
    
    if (!data.results || data.results.length === 0) {
      console.error('No upcoming movies found in the response');
      return [];
    }
    
    // Filter out any movies that might have release dates before today
    const futureMovies = data.results.filter((movie: any) => {
      const releaseDate = new Date(movie.release_date);
      return releaseDate >= today;
    });
    
    return futureMovies.map((movie: any) => transformMovieData(movie));
  } catch (error) {
    console.error('Error fetching upcoming movies:', error);
    return [];
  }
};

export const getMovieById = async (id: number): Promise<Movie | null> => {
  try {
    console.log(`Fetching movie with ID ${id}...`);
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${id}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      }
    });
    
    console.log(`Movie with ID ${id} response:`, response.data);
    
    return transformMovieData(response.data);
  } catch (error) {
    console.error(`Error fetching movie with ID ${id}:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    return null;
  }
};

export const getMoviesByGenre = async (genre: string): Promise<Movie[]> => {
  try {
    console.log(`Fetching movies by genre: ${genre}...`);
    // First, get the genre ID from the genre name
    const genresResponse = await axios.get(`${TMDB_BASE_URL}/genre/movie/list`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      }
    });
    
    console.log('Genres response:', genresResponse.data);
    
    const genreObj = genresResponse.data.genres.find((g: any) => 
      g.name.toLowerCase() === genre.toLowerCase()
    );
    
    console.log(`Genre object for ${genre}:`, genreObj);
    
    if (!genreObj) {
      console.log(`No genre found for ${genre}`);
      return [];
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
    
    console.log(`Movies by genre ${genre} response:`, response.data);
    
    return response.data.results.map((movie: any) => transformMovieData(movie));
  } catch (error) {
    console.error(`Error fetching movies by genre ${genre}:`, error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    return [];
  }
};

export const searchMovies = async (query: string, language: string = 'en-US'): Promise<Movie[]> => {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: query,
        language: language,
        include_adult: false
      }
    });
    
    if (!response.data.results || response.data.results.length === 0) {
      return [];
    }

    return response.data.results.map((movie: any) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      poster_path: movie.poster_path,
      release_date: movie.release_date,
      vote_average: movie.vote_average,
      genre: movie.genre_ids ? movie.genre_ids.map((id: number) => {
        const genre = genreMap[id];
        return genre || 'Unknown';
      }) : []
    }));
  } catch (error) {
    console.error('Error searching movies:', error);
    throw error;
  }
};

// Theater API calls
export const getTheaters = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/theaters');
    return response.data;
  } catch (error) {
    console.error('Error fetching theaters:', error);
    throw error;
  }
};

export const getTheatersByCity = async (city: string) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/theaters/city/${city}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching theaters for city ${city}:`, error);
    throw error;
  }
};

export const getTheaterById = async (id: string) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/theaters/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching theater with id ${id}:`, error);
    throw error;
  }
}; 