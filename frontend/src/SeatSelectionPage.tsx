import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SeatSelectionPage.css';

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
  availableSeats: number;
}

interface Seat {
  id: string;
  row: string;
  number: number;
  isAvailable: boolean;
  isSelected: boolean;
}

const SeatSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie, theater, screen, date } = location.state || {};

  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for showtimes
  const showtimes = [
    { id: '1', time: '10:00 AM', price: 250, availableSeats: 120 },
    { id: '2', time: '1:30 PM', price: 300, availableSeats: 100 },
    { id: '3', time: '4:45 PM', price: 350, availableSeats: 80 },
    { id: '4', time: '8:00 PM', price: 400, availableSeats: 60 },
  ];

  useEffect(() => {
    if (!movie || !theater || !screen) {
      navigate('/');
      return;
    }
    generateSeats();
  }, [movie, theater, screen, navigate]);

  const generateSeats = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const seatsPerRow = 15;
    const generatedSeats: Seat[] = [];

    rows.forEach((row, rowIndex) => {
      for (let i = 1; i <= seatsPerRow; i++) {
        // Randomly make some seats unavailable
        const isAvailable = Math.random() > 0.2;
        generatedSeats.push({
          id: `${row}${i}`,
          row,
          number: i,
          isAvailable,
          isSelected: false
        });
      }
    });

    setSeats(generatedSeats);
    setLoading(false);
  };

  const handleShowtimeSelect = (showtime: Showtime) => {
    setSelectedShowtime(showtime);
  };

  const handleSeatSelect = (seat: Seat) => {
    if (!seat.isAvailable) return;

    const updatedSeats = seats.map(s => {
      if (s.id === seat.id) {
        return { ...s, isSelected: !s.isSelected };
      }
      return s;
    });

    setSeats(updatedSeats);
    setSelectedSeats(updatedSeats.filter(s => s.isSelected));
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }
    if (!selectedShowtime) {
      setError('Please select a showtime');
      return;
    }

    navigate('/payment', {
      state: {
        movie,
        theater,
        screen,
        date,
        showtime: selectedShowtime,
        seats: selectedSeats
      }
    });
  };

  const calculateTotal = () => {
    if (!selectedShowtime) return 0;
    return selectedSeats.length * selectedShowtime.price;
  };

  if (loading) return <div className="loading">Loading seats...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="seat-selection-container">
      <div className="movie-info">
        <h2>{movie.title}</h2>
        <p>{theater.name} • {screen.name}</p>
        <p>{date.toLocaleDateString()}</p>
      </div>

      <div className="showtime-selection">
        <h3>Select Showtime</h3>
        <div className="showtime-grid">
          {showtimes.map((showtime) => (
            <div
              key={showtime.id}
              className={`showtime-option ${selectedShowtime?.id === showtime.id ? 'selected' : ''}`}
              onClick={() => handleShowtimeSelect(showtime)}
            >
              <span className="time">{showtime.time}</span>
              <span className="price">₹{showtime.price}</span>
              <span className="seats">{showtime.availableSeats} seats left</span>
            </div>
          ))}
        </div>
      </div>

      <div className="screen-container">
        <div className="screen">
          <div className="screen-curve"></div>
          SCREEN THIS WAY
        </div>
      </div>

      <div className="seats-container">
        <div className="seats-grid">
          {seats.reduce((rows, seat) => {
            const rowIndex = rows.findIndex(r => r[0]?.row === seat.row);
            if (rowIndex === -1) {
              rows.push([seat]);
            } else {
              rows[rowIndex].push(seat);
            }
            return rows;
          }, [] as Seat[][]).map((row, rowIndex) => (
            <div key={row[0].row} className="seat-row">
              <div className="row-label">{row[0].row}</div>
              {row.map((seat) => (
                <div
                  key={seat.id}
                  className={`seat ${seat.isAvailable ? 'available' : 'unavailable'} ${seat.isSelected ? 'selected' : ''}`}
                  onClick={() => handleSeatSelect(seat)}
                >
                  <div className="seat-back"></div>
                  <div className="seat-bottom">
                    <span className="seat-number">{seat.number}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="seat-legend">
          <div className="legend-item">
            <div className="seat available">
              <div className="seat-back"></div>
              <div className="seat-bottom"></div>
            </div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="seat selected">
              <div className="seat-back"></div>
              <div className="seat-bottom"></div>
            </div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="seat unavailable">
              <div className="seat-back"></div>
              <div className="seat-bottom"></div>
            </div>
            <span>Unavailable</span>
          </div>
        </div>
      </div>

      <div className="booking-summary">
        <h3>Booking Summary</h3>
        <div className="summary-details">
          <p>Selected Seats: {selectedSeats.map(s => s.id).join(', ')}</p>
          <p>Total Seats: {selectedSeats.length}</p>
          <p>Price per Seat: ₹{selectedShowtime?.price || 0}</p>
          <p className="total">Total: ₹{calculateTotal()}</p>
        </div>
        <button 
          className="proceed-button"
          onClick={handleProceedToPayment}
          disabled={!selectedShowtime || selectedSeats.length === 0}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

export default SeatSelectionPage; 