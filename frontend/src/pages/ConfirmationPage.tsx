import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import './ConfirmationPage.css';

interface Seat {
  row: string;
  number: number;
}

const ConfirmationPage: React.FC = () => {
  const location = useLocation();
  const { movie, theater, screen, date, selectedSeats, totalAmount, paymentMethod, paymentId, orderId } = location.state || {};
  const [bookingId] = useState(`BKG${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`);
  const [currentTime] = useState(new Date().toLocaleTimeString());
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }));

  return (
    <div className="confirmation-page">
      <div className="confirmation-container">
        <div className="confirmation-card">
          <h1>Booking Confirmed!</h1>
          
          {movie ? (
            <>
              <div className="ticket-container">
                <div className="ticket">
                  <div className="ticket-header">
                    <h2>CinemaConnect</h2>
                    <p>E-Ticket</p>
                  </div>
                  <div className="ticket-body">
                    <div className="movie-details">
                      <h3>{movie.title}</h3>
                      <div className="ticket-info">
                        <div>
                          <span className="info-label">Date:</span>
                          <span className="info-value">{new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div>
                          <span className="info-label">Theater:</span>
                          <span className="info-value">{theater?.name}</span>
                        </div>
                        <div>
                          <span className="info-label">Screen:</span>
                          <span className="info-value">{screen?.name}</span>
                        </div>
                        <div>
                          <span className="info-label">Seats:</span>
                          <span className="info-value">
                            {selectedSeats?.map((seat: Seat) => `${seat.row}${seat.number}`).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="ticket-qr">
                      <div className="qr-placeholder">QR</div>
                      <div className="booking-id">{bookingId}</div>
                    </div>
                  </div>
                  <div className="ticket-footer">
                    <p>Please show this ticket at the entrance</p>
                  </div>
                </div>
              </div>

              <div className="confirmation-details">
                <h2>Billing Information</h2>
                <div className="details-grid">
                  <div className="detail-row">
                    <span className="detail-label">Transaction Date:</span>
                    <span className="detail-value">{currentDate}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Transaction Time:</span>
                    <span className="detail-value">{currentTime}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Payment Method:</span>
                    <span className="detail-value">{paymentMethod === 'wallet' ? 'Cinema Wallet' : paymentMethod}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Transaction ID:</span>
                    <span className="detail-value">{paymentId || 'N/A'}</span>
                  </div>
                  {orderId && (
                    <div className="detail-row">
                      <span className="detail-label">Order ID:</span>
                      <span className="detail-value">{orderId}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Amount Paid:</span>
                    <span className="detail-value">₹{totalAmount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Booking ID:</span>
                    <span className="detail-value">{bookingId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">GST (18%):</span>
                    <span className="detail-value">₹{(totalAmount * 0.18).toFixed(2)}</span>
                  </div>
                  <div className="detail-row total-amount">
                    <span className="detail-label">Total Amount (incl. GST):</span>
                    <span className="detail-value">₹{(totalAmount * 1.18).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="error-message">
              <p>Booking information not available. Please check your bookings in your account.</p>
            </div>
          )}
          
          <div className="confirmation-actions">
            <button onClick={() => window.print()} className="print-btn">Print Ticket</button>
            <Link to="/my-bookings" className="view-bookings-btn">View My Bookings</Link>
            <Link to="/" className="home-btn">Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage;
