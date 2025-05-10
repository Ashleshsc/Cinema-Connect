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

interface TicketOption {
  id: string;
  type: string;
  price: number;
  details: string;
}

interface BookingPageProps {
  movie?: Movie;
}

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie } = location.state || {};

  const getPosterUrl = (posterPath: string | undefined): string => {
    if (!posterPath) return 'https://via.placeholder.com/300x450?text=No+Poster';
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  const [theaters, setTheaters] = useState<Theater[]>([]);
  const [selectedTheater, setSelectedTheater] = useState<Theater | null>(null);
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCity, setSelectedCity] = useState<string>('Mumbai');
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
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

  if (!movie) {
    return null;
  }

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
      console.log('Fetched Theaters Data:', data); // Log the fetched data
      
      // Ensure each theater has a unique ID
      const theatersWithIds = data.map((theater: Theater, index: number) => {
        if (!theater.id) {
          return {
            ...theater,
            id: `theater_${theater.name.replace(/\s+/g, '_').toLowerCase()}_${index}`
          };
        }
        return theater;
      });
      
      console.log('Theaters with IDs:', theatersWithIds);
      setTheaters(theatersWithIds);
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
    
    // Ensure the theater has an ID
    const theaterWithId = {
      ...selectedTheater,
      id: selectedTheater.id || `theater_${selectedTheater.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`
    };
    
    setSelectedScreen(screen);
    navigate('/seats', {
      state: {
        movie,
        theater: theaterWithId,
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

  const handleSeatClick = (seat: Seat) => {
    if (seat.isBooked) return;

    setSelectedSeats(prevSeats => {
      const isSelected = prevSeats.some(s => s.id === seat.id);
      if (isSelected) {
        return prevSeats.filter(s => s.id !== seat.id);
      } else {
        return [...prevSeats, seat];
      }
    });
  };

  const handleProceed = () => {
    if (selectedSeats.length === 0) return;

    // Ensure we have complete objects with all required properties
    const theaterForPayment = {
      id: selectedTheater?.id || selectedTheater?.name || 'theater-id',
      name: selectedTheater?.name || '',
      location: selectedTheater?.location || ''
    };

    const screenForPayment = {
      id: selectedScreen?.id || selectedScreen?.name || 'screen-id',
      name: selectedScreen?.name || '',
      showtimes: selectedScreen?.showtimes || []
    };

    const showtimeForPayment = selectedScreen?.showtimes?.[0] || {
      id: 'showtime-id',
      time: new Date().toLocaleTimeString(),
      price: 0
    };

    // Debug log to verify the data
    console.log('Sending to payment page:', {
      theater: theaterForPayment,
      screen: screenForPayment,
      showtime: showtimeForPayment
    });

    navigate('/payment', {
      state: {
        movie,
        theater: theaterForPayment,
        screen: screenForPayment,
        showtime: showtimeForPayment,
        seats: selectedSeats,
        date: selectedDate,
        totalAmount: selectedSeats.length * (showtimeForPayment.price || 0)
      }
    });
  };

  if (loading) return <div className="loading">Loading theaters...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="booking-container">
      <div className="booking-header">
        <h1>Book Your Tickets</h1>
        <button className="back-button" onClick={() => navigate(-1)}>← Back</button>
      </div>

      <div className="booking-content">
        <div className="movie-info">
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
                <span key={index} className="genre-tag">{genre}</span>
              ))}
            </div>
            <p className="overview">{movie.overview}</p>
          </div>
        </div>

        <div className="booking-sidebar">
          <div className="booking-steps">
            <div className="booking-step">
              <h3>Select City</h3>
              <select 
                className="city-select" 
                value={selectedCity} 
                onChange={handleCityChange}
              >
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="booking-step">
              <h3>Select Date</h3>
              <div className="calendar">
                {[...Array(7)].map((_, index) => {
                  const date = addDays(new Date(), index);
                  return (
                    <div
                      key={index}
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

            {theaters.length > 0 && (
              <div className="booking-step">
                <h3>Select Theater</h3>
                <div className="theaters-list">
                  {theaters.map((theater, index) => {
                    // Ensure each theater has a unique ID before rendering
                    if (!theater.id) {
                      theater.id = `theater_${theater.name.replace(/\s+/g, '_').toLowerCase()}_${index}`;
                    }
                    return (
                    <div
                      key={theater.id}
                      className={`theater-option ${selectedTheater?.id === theater.id ? 'selected' : ''}`}
                      onClick={() => handleTheaterSelect(theater)}
                    >
                      <h4>{theater.name}</h4>
                      <p>{theater.location}</p>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}

            {selectedTheater && (
              <div className="booking-step">
                <h3>Select Screen & Showtime</h3>
                <div className="screens-list">
                  {selectedTheater.screens.map(screen => (
                    <div
                      key={screen.id}
                      className="screen-option"
                      onClick={() => handleScreenSelect(screen)}
                    >
                      <h4>{screen.name}</h4>
                      <div className="showtimes">
                        {screen.showtimes.map(showtime => (
                          <button
                            key={showtime.id}
                            className="showtime-btn"
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