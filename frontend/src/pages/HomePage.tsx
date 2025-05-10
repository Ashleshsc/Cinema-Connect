import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  release_date: string;
  overview: string;
  genre?: string[];
}

interface HomePageProps {
  searchQuery: string;
  activeSection: string;
}

const RENTAL_POLICY = "You can watch this movie unlimited times for 48 hours after payment. The rental is non-refundable.";
const RENTAL_PRICE = 199;

const HomePage: React.FC<HomePageProps> = ({ searchQuery, activeSection }) => {
  const navigate = useNavigate();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [rentalMovie, setRentalMovie] = useState<Movie | null>(null);
  const [rentalError, setRentalError] = useState<string | null>(null);
  const [rentalSuccess, setRentalSuccess] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  useEffect(() => {
    fetchMovies();
  }, [activeSection, searchQuery]);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError(null);
      let url = 'http://localhost:5000/api/movies';

      // Add query parameters based on section and search
      const params = new URLSearchParams();
      if (activeSection) params.append('section', activeSection);
      if (searchQuery) params.append('search', searchQuery);
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('Fetching movies from:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to fetch movies');
      }

      const data = await response.json();
      console.log('Received movies data:', data);
      setMovies(data);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  const handleBookTicket = (movie: Movie) => {
    navigate('/booking', { state: { movie } });
  };

  const handleRentClick = (movie: Movie) => {
    console.log('Rent button clicked for movie:', movie);
    setRentalMovie(movie);
    setShowRentalModal(true);
    setRentalError(null);
    setRentalSuccess(false);
    console.log('showRentalModal:', true, 'rentalMovie:', movie);
  };

  const handleRentMovie = async () => {
    if (!rentalMovie) return;
    setRentalError(null);
    try {
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      document.body.appendChild(script);
      await new Promise(resolve => { script.onload = resolve; });

      // Create order on backend
      const response = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ amount: RENTAL_PRICE * 100 })
      });
      const order = await response.json();

      const options = {
        key: 'rzp_test_pZ7rJCEC6C1nZd',
        amount: RENTAL_PRICE * 100,
        currency: 'INR',
        name: 'Cinema Connect',
        description: `Movie Rental: ${rentalMovie.title}`,
        order_id: order.id,
        handler: async function(response: any) {
          try {
            const userId = localStorage.getItem('userId');
            if (!userId) {
              throw new Error('User ID not found');
            }

            const rentalDetails = {
              movie: {
                id: rentalMovie.id,
                title: rentalMovie.title,
                poster_path: rentalMovie.poster_path,
                overview: rentalMovie.overview,
                release_date: rentalMovie.release_date,
                vote_average: rentalMovie.vote_average
              },
              rentalPrice: RENTAL_PRICE,
              rentalPeriod: '48 hours',
              user: userId
            };

            const requestBody = {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              rentalDetails
            };

            console.log('Sending rental verification request:', JSON.stringify(requestBody, null, 2));

            // Save rental to backend
            const verifyRes = await fetch('http://localhost:5000/api/payment/verify-rental', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify(requestBody)
            });

            if (!verifyRes.ok) {
              const errorData = await verifyRes.json();
              console.error('Rental verification failed:', errorData);
              throw new Error(errorData.error || 'Rental payment verification failed');
            }

            const data = await verifyRes.json();
            console.log('Rental verification response:', data);
            
            if (data.success) {
              setRentalSuccess(true);
              // Navigate to MyBookings page after successful rental
              setTimeout(() => {
                setShowRentalModal(false);
                navigate('/my-bookings');
              }, 2000);
            } else {
              setRentalError(data.error || 'Rental payment verification failed');
            }
          } catch (err) {
            console.error('Rental verification error:', err);
            setRentalError(err instanceof Error ? err.message : 'Rental payment verification failed');
          }
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        theme: { color: '#4CAF50' }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error('Rental payment error:', err);
      setRentalError('Failed to process rental payment');
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleViewDescription = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowDescriptionModal(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading movies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchMovies} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="movies-container">
        <h1 className="section-title">
          {searchQuery ? `Search Results for "${searchQuery}"` : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
        </h1>
        {movies.length === 0 ? (
          <div className="no-movies">
            <p>No movies found</p>
          </div>
        ) : (
          <div className="movie-grid">
            {movies.map((movie) => {
              const releaseDate = new Date(movie.release_date);
              const today = new Date();
              const oneMonthAgo = new Date();
              oneMonthAgo.setMonth(today.getMonth() - 1);
              const oneMonthLater = new Date();
              oneMonthLater.setMonth(today.getMonth() + 1);
              
              const isInBookingWindow = releaseDate >= oneMonthAgo && releaseDate <= oneMonthLater;
              const isOlderThanMonth = releaseDate < oneMonthAgo;
              const isUpcoming = releaseDate > today;
              const rentPrice = isOlderThanMonth ? Math.floor(Math.random() * (299 - 99 + 1)) + 99 : null;

              return (
                <div key={movie.id} className="movie-card">
                  <div 
                    className="movie-poster" 
                    style={{ 
                      backgroundImage: `url(${movie.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster'})`
                    }}
                  >
                    {activeSection !== 'upcoming' && isInBookingWindow && (
                      <div className="now-playing-badge">Now Playing</div>
                    )}
                  </div>
                  <div className="movie-info">
                    <h3>{movie.title}</h3>
                    <div className="movie-meta">
                      <div className="movie-rating">
                        <span className="rating-star">★</span>
                        {movie.vote_average?.toFixed(1)}
                      </div>
                      <div className="movie-release">
                        {formatDate(movie.release_date)}
                      </div>
                    </div>
                    {activeSection === 'upcoming' ? (
                      <button className="description-button" onClick={() => handleViewDescription(movie)}>
                        View Description
                      </button>
                    ) : isOlderThanMonth ? (
                      <button className="rent-button" onClick={() => handleRentClick(movie)}>
                        Rent for ₹{RENTAL_PRICE}
                      </button>
                    ) : (
                      <button className="book-button" onClick={() => handleBookTicket(movie)}>
                        {isInBookingWindow ? 'Book Now' : 'Coming Soon'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* Description Modal */}
      {showDescriptionModal && selectedMovie && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedMovie.title}</h2>
              <button className="close-button" onClick={() => setShowDescriptionModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <img 
                src={selectedMovie.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster'} 
                alt={selectedMovie.title} 
                className="modal-poster"
              />
              <div className="movie-details">
                <div className="movie-meta">
                  <div className="movie-rating">
                    <span className="rating-star">★</span>
                    {selectedMovie.vote_average?.toFixed(1)}
                  </div>
                  <div className="movie-release">
                    {formatDate(selectedMovie.release_date)}
                  </div>
                </div>
                <div className="movie-description">
                  <h3>Overview</h3>
                  <p>{selectedMovie.overview}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Rental Modal */}
      {showRentalModal && rentalMovie && (
        <div className="rental-modal-overlay">
          <div className="rental-modal">
            <h2>{rentalMovie.title}</h2>
            <img src={rentalMovie.poster_path || 'https://via.placeholder.com/500x750?text=No+Poster'} alt={rentalMovie.title} style={{ width: '200px', borderRadius: '8px', marginBottom: '1rem' }} />
            <p><strong>Description:</strong> {rentalMovie.overview}</p>
            <p><strong>Rental Policy:</strong> {RENTAL_POLICY}</p>
            <p><strong>Rental Price:</strong> ₹{RENTAL_PRICE}</p>
            {rentalError && <div className="error-message">{rentalError}</div>}
            {rentalSuccess ? (
              <div className="success-message">Rental successful! Movie will be available in My Bookings.</div>
            ) : (
              <>
                <button className="rent-confirm-button" onClick={handleRentMovie}>Rent Movie</button>
                <button className="cancel-button" onClick={() => setShowRentalModal(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
