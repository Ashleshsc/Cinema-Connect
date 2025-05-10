import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ConfirmationPage.css';

interface Movie {
  id: number;
  title: string;
  poster_path: string;
}

interface Theater {
  id: string;
  name: string;
}

interface Screen {
  id: string;
  name: string;
}

interface Showtime {
  id: string;
  time: string;
  price: number;
}

interface Seat {
  id: string;
  row: string;
  number: number;
}

const ConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie, theater, screen, showtime, seats, date, paymentMethod, amount, paymentId } = location.state || {};

  if (!movie || !theater || !screen || !showtime || !seats || !date) {
    navigate('/');
    return null;
  }

  const handleDownloadTicket = () => {
    // TODO: Implement ticket download functionality
    alert('Ticket download feature coming soon!');
  };

  const handleBookMore = () => {
    navigate('/');
  };

  return (
    <div className="confirmation-container">
      <div className="confirmation-header">
        <h1>Booking Confirmed!</h1>
        <p className="confirmation-message">Your tickets have been booked successfully</p>
      </div>

      <div className="confirmation-content">
        <div className="booking-details">
          <h2>Booking Details</h2>
          <div className="details-section">
            <div className="movie-info">
              <h3>{movie.title}</h3>
              <p>{theater.name} • {screen.name}</p>
              <p>{date.toLocaleDateString()} • {showtime.time}</p>
            </div>

            <div className="seats-info">
              <h3>Seats</h3>
              <p>{seats.map((seat: Seat) => `${seat.row}${seat.number}`).join(', ')}</p>
            </div>

            <div className="payment-info">
              <h3>Payment Information</h3>
              <p>Payment Method: {paymentMethod}</p>
              <p>Transaction ID: {paymentId}</p>
              <p>Amount Paid: ₹{amount}</p>
            </div>
          </div>
        </div>

        <div className="ticket-qr">
          <div className="qr-code">
            {/* Placeholder for QR code */}
            <div className="qr-placeholder">
              <p>QR Code</p>
              <p>Scan at theater</p>
            </div>
          </div>
          <p className="qr-instructions">Show this QR code at the theater entrance</p>
        </div>
      </div>

      <div className="confirmation-actions">
        <button className="download-button" onClick={handleDownloadTicket}>
          Download Ticket
        </button>
        <button className="book-more-button" onClick={handleBookMore}>
          Book More Movies
        </button>
      </div>
    </div>
  );
};

export default ConfirmationPage; 