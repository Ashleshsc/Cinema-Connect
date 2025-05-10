import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BookingPage.css';

// Helper functions for date formatting
const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  runtime: number;
  release_date: string;
  genre: string[];
}

interface Theater {
  id: string;
  name: string;
  location: string;
  screens: Screen[];
}

interface Screen {
  id: string;
  name: string;
  showtimes: Showtime[];
}

interface Showtime {
  id: string;
  time: string;
  price: number;
  seats: Seat[];
}

interface Seat {
  id: string;
  row: string;
  number: number;
  isBooked: boolean;
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie } = location.state || {};

  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCity, setSelectedCity] = useState<string>('Mumbai');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];

  useEffect(() => {
    if (!movie) {
      navigate('/');
      return;
    }
    fetchTheaters();
  }, [movie, navigate, selectedCity]);

  const getPosterUrl = (posterPath: string | undefined): string => {
    if (!posterPath) return 'https://via.placeholder.com/300x450?text=No+Poster';
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const fetchTheaters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/theaters/city/${selectedCity}`);
      if (!response.ok) {
        if (response.status === 404) {
          setTheaters([]);
          setError(`No theaters found in ${selectedCity}`);
        } else {
          throw new Error('Failed to fetch theaters');
        }
      }
      const data = await response.json();
      setTheaters(data);
    } catch (err) {
      setError('Failed to load theaters. Please try again later.');
      setTheaters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTheaterSelect = (theater: Theater) => {
    setSelectedTheater(theater);
    setSelectedScreen(null);
  };

  const handleScreenSelect = (screen: Screen) => {
    if (!selectedDate) {
      setError('Please select a date');
      return;
    }
    if (!selectedCity) {
      setError('Please select a city');
      return;
    }
    if (!selectedTheater) {
      setError('Please select a theater');
      return;
    }
    
    setSelectedScreen(screen);
    navigate('/seats', {
      state: {
        movie,
        theater: selectedTheater,
        screen,
        date: selectedDate
      }
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCity(e.target.value);
  };

  if (!movie) {
    return null;
  }

  return (
    <div className="booking-page">
      <div className="booking-container">
        <div className="movie-info-section">
          <img 
            src={getPosterUrl(movie.poster_path)} 
            alt={movie.title} 
            className="movie-poster"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
            }}
          />
          <div className="movie-details">
            <h2>{movie.title}</h2>
            <div className="movie-meta">
              <span className="rating">⭐ {movie.vote_average}/10</span>
              <span className="runtime">⏱️ {movie.runtime} mins</span>
              <span className="release-date">📅 {movie.release_date}</span>
            </div>
            <div className="genres">
              {movie.genre && movie.genre.map((genre: string, index: number) => (
                <span key={`genre-${index}`} className="genre-tag">{genre}</span>
              ))}
            </div>
            <p className="overview">{movie.overview}</p>
          </div>
        </div>

        <div className="booking-sidebar">
          <div className="booking-steps">
            <div className="booking-step" key="city-select">
              <h3>Select City</h3>
              <select 
                className="city-select" 
                value={selectedCity} 
                onChange={handleCityChange}
              >
                {cities.map(city => (
                  <option key={`city-${city}`} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="booking-step" key="date-select">
              <h3>Select Date</h3>
              <div className="calendar">
                {[...Array(7)].map((_, index) => {
                  const date = addDays(new Date(), index);
                  return (
                    <div
                      key={`date-${index}`}
                      className={`date-option ${isSameDay(date, selectedDate) ? 'selected' : ''}`}
                      onClick={() => handleDateSelect(date)}
                    >
                      <div className="day">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="date">{date.getDate()}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {loading && (
              <div className="loading-container" key="loading">
                <div className="loading-spinner"></div>
                <p>Loading theaters...</p>
              </div>
            )}

            {error && (
              <div className="error-message" key="error">
                {error}
              </div>
            )}

            {!loading && theaters.length > 0 && (
              <div className="booking-step" key="theater-select">
                <h3>Select Theater</h3>
                <div className="theaters-list">
                  {theaters.map(theater => (
                    <div
                      key={`theater-${theater.id}`}
                      className={`theater-option ${selectedTheater?.id === theater.id ? 'selected' : ''}`}
                      onClick={() => handleTheaterSelect(theater)}
                    >
                      <h4>{theater.name}</h4>
                      <p>{theater.location}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedTheater && (
              <div className="booking-step" key="screen-select">
                <h3>Select Screen & Showtime</h3>
                <div className="screens-list">
                  {selectedTheater.screens.map(screen => (
                    <div
                      key={`screen-${screen.id}`}
                      className="screen-option"
                    >
                      <h4>{screen.name}</h4>
                      <div className="showtimes">
                        {screen.showtimes.map(showtime => (
                          <button
                            key={`showtime-${showtime.id}`}
                            className="showtime-btn"
                            onClick={() => handleScreenSelect(screen)}
                          >
                            {showtime.time}
                            <span className="price">₹{showtime.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
