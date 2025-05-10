import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MyBookingsPage.css';

interface Booking {
  _id: string;
  user: string;
  movie: {
    id: number;
    title: string;
    poster_path: string;
    overview: string;
  };
  theater: {
    id: string;
    name: string;
  };
  screen: {
    id: string;
    name: string;
  };
  showtime: {
    id: string;
    time: string;
    price: number;
  };
  seats: Array<{
    id: string;
    row: string;
    number: number;
  }>;
  date: string;
  payment: {
    method: string;
    amount: number;
    paymentId: string;
    status: string;
  };
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setError('Please log in to view your bookings');
        setLoading(false);
        return;
      }

      console.log('Fetching bookings with token:', token.substring(0, 10) + '...');

      const response = await fetch('http://localhost:5000/api/bookings/my-bookings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401 || response.status === 403) {
        console.error('Authentication failed:', response.status);
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch bookings:', response.status, errorData);
        throw new Error(errorData.message || `Failed to fetch bookings (${response.status})`);
      }

      const data = await response.json();
      console.log('Bookings fetched successfully:', data.length);
      setBookings(data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed';
      case 'cancelled':
        return 'status-cancelled';
      case 'pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="bookings-page loading">Loading your bookings...</div>;
  }

  if (error) {
    return <div className="bookings-page error">{error}</div>;
  }

  const handlePrint = (booking: Booking) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print tickets');
      return;
    }
    
    const bookingId = booking._id || `BKG${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    const ticketHTML = `
      <html>
        <head>
          <title>Cinema Connect - E-Ticket</title>
          <style>
            body { font-family: 'Roboto', Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background-color: #f5f5f5; }
            .confirmation-card { background-color: white; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); padding: 30px; text-align: center; }
            .confirmation-card h1 { color: #4CAF50; margin-bottom: 30px; font-size: 28px; }
            
            .ticket-container { margin: 20px 0; perspective: 1000px; }
            .ticket { background: linear-gradient(145deg, #ffffff, #f0f0f0); border-radius: 15px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); overflow: hidden; }
            
            .ticket-header { background-color: #4CAF50; color: white; padding: 15px; text-align: center; position: relative; }
            .ticket-header h2 { margin: 0; font-size: 22px; }
            .ticket-header p { margin: 5px 0 0; font-size: 14px; opacity: 0.9; }
            
            .ticket-body { padding: 20px; display: flex; justify-content: space-between; position: relative; }
            .ticket-body:after { content: ''; position: absolute; top: 0; bottom: 0; right: 120px; border-right: 2px dashed #ccc; }
            
            .movie-details { flex: 1; padding-right: 20px; text-align: left; }
            .movie-details h3 { margin-top: 0; margin-bottom: 15px; color: #333; font-size: 20px; }
            
            .ticket-info { display: grid; gap: 12px; }
            .ticket-info div { display: flex; align-items: baseline; }
            .info-label { font-weight: bold; color: #555; min-width: 80px; }
            .info-value { color: #333; }
            
            .ticket-qr { width: 100px; text-align: center; }
            .qr-placeholder { width: 80px; height: 80px; background-color: #f0f0f0; display: flex; justify-content: center; align-items: center; margin: 0 auto 10px; border: 1px solid #ddd; }
            .booking-id { font-size: 12px; color: #666; word-break: break-all; }
            
            .ticket-footer { background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
            
            .confirmation-details { margin: 30px 0; text-align: left; background-color: #f9f9f9; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); }
            .confirmation-details h2 { margin-bottom: 20px; color: #333; font-size: 1.5rem; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            .details-grid { display: grid; gap: 15px; }
            .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #e0e0e0; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { font-weight: bold; color: #555; }
            .detail-value { color: #333; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="confirmation-card">
            <h1>Booking Confirmed!</h1>
            
            <div class="ticket-container">
              <div class="ticket">
                <div class="ticket-header">
                  <h2>CinemaConnect</h2>
                  <p>E-Ticket</p>
                </div>
                <div class="ticket-body">
                  <div class="movie-details">
                    <h3>${booking.movie?.title || 'Movie Title'}</h3>
                    <div class="ticket-info">
                      <div>
                        <span class="info-label">Date:</span>
                        <span class="info-value">${new Date(booking.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div>
                        <span class="info-label">Theater:</span>
                        <span class="info-value">${booking.theater?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span class="info-label">Screen:</span>
                        <span class="info-value">${booking.screen?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span class="info-label">Time:</span>
                        <span class="info-value">${booking.showtime?.time || 'N/A'}</span>
                      </div>
                      <div>
                        <span class="info-label">Seats:</span>
                        <span class="info-value">${Array.isArray(booking.seats) ? booking.seats.map(seat => `${seat.row}${seat.number}`).join(', ') : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div class="ticket-qr">
                    <div class="qr-placeholder">QR</div>
                    <div class="booking-id">${bookingId}</div>
                  </div>
                </div>
                <div class="ticket-footer">
                  <p>Please show this ticket at the entrance</p>
                </div>
              </div>
            </div>
            
            <div class="confirmation-details">
              <h2>Billing Information</h2>
              <div class="details-grid">
                <div class="detail-row">
                  <span class="detail-label">Transaction Date:</span>
                  <span class="detail-value">${new Date(booking.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment Method:</span>
                  <span class="detail-value">${booking.payment.method === 'wallet' ? 'Cinema Wallet' : booking.payment.method}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Payment ID:</span>
                  <span class="detail-value">${booking.payment.paymentId || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Amount Paid:</span>
                  <span class="detail-value">₹${booking.payment.amount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Booking ID:</span>
                  <span class="detail-value">${bookingId}</span>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const rentedMovies = bookings.filter(b => (b as any).isRental);
  const ticketBookings = bookings.filter(b => !(b as any).isRental);

  return (
    <div className="bookings-page">
      <div className="bookings-container">
        <h1>My Bookings</h1>
        {rentedMovies.length > 0 && (
          <div className="rented-movies-section">
            <h2>Rented Movies</h2>
            <div className="bookings-list">
              {rentedMovies.map((booking) => (
                <div key={booking._id} className="booking-card">
                  <div className="booking-header">
                    {booking.movie.poster_path && (
                      <div className="movie-poster">
                        <img 
                          src={`https://image.tmdb.org/t/p/w200${booking.movie?.poster_path || ''}`} 
                          alt={booking.movie?.title || 'Movie Poster'} 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
                          }}
                        />
                      </div>
                    )}
                    <div className="booking-title-section">
                      <h2>{booking.movie?.title || 'Movie Title Not Available'}</h2>
                      <span className={`booking-status ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  <div className="booking-details">
                    <div className="details-column">
                      <div className="detail-row">
                        <span className="detail-label">Rental Period:</span>
                        <span className="detail-value">{(booking as any).rentalPeriod || '48 hours'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Amount Paid:</span>
                        <span className="detail-value">₹{booking.payment?.amount ?? 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Booking Date:</span>
                        <span className="detail-value">{formatDate(booking.createdAt)}</span>
                      </div>
                    </div>
                    <div className="details-column">
                      <div className="detail-row">
                        <span className="detail-label">Description:</span>
                        <span className="detail-value">{booking.movie?.overview || 'No description available.'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Rental Policy:</span>
                        <span className="detail-value">You can watch this movie unlimited times for 48 hours after payment. The rental is non-refundable.</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {ticketBookings.length > 0 && (
          <div className="ticket-bookings-section">
            <h2>Ticket Bookings</h2>
            <div className="bookings-list">
              {ticketBookings.map((booking) => (
                <div key={booking._id} className="booking-card">
                  <button
                    className="remove-booking-btn"
                    onClick={async () => {
                      if (!window.confirm('Are you sure you want to remove this booking?')) return;
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`http://localhost:5000/api/bookings/${booking._id}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                        });
                        if (!res.ok) throw new Error('Failed to remove booking');
                        setBookings(bookings.filter(b => b._id !== booking._id));
                        alert('Booking removed successfully!');
                      } catch (err) {
                        alert('Error removing booking.');
                      }
                    }}
                    aria-label="Remove Booking"
                    style={{ position: 'absolute', top: 10, right: 10, background: '#e74c3c', color: 'white', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                  <div className="booking-header">
                    {booking.movie.poster_path && (
                      <div className="movie-poster">
                        <img 
                          src={`https://image.tmdb.org/t/p/w200${booking.movie?.poster_path || ''}`} 
                          alt={booking.movie?.title || 'Movie Poster'} 
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/200x300?text=No+Poster';
                          }}
                        />
                      </div>
                    )}
                    <div className="booking-title-section">
                      <h2>{booking.movie?.title || 'Movie Title Not Available'}</h2>
                      <span className={`booking-status ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <button 
                      className="print-ticket-btn" 
                      onClick={() => handlePrint(booking)}
                      aria-label="Print Ticket"
                    >
                      <i className="fa fa-print"></i> Print Ticket
                    </button>
                  </div>
                  
                  <div className="booking-details">
                    <div className="details-column">
                      <div className="detail-row">
                        <span className="detail-label">Theater:</span>
                        <span className="detail-value">{booking.theater?.name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Screen:</span>
                        <span className="detail-value">{booking.screen?.name || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Show Time:</span>
                        <span className="detail-value">{booking.showtime?.time || 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Seats:</span>
                        <span className="detail-value">{Array.isArray(booking.seats) ? booking.seats.map(seat => `${seat.row}${seat.number}`).join(', ') : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="details-column">
                      <div className="detail-row">
                        <span className="detail-label">Booking Date:</span>
                        <span className="detail-value">{formatDate(booking.createdAt)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Amount Paid:</span>
                        <span className="detail-value">₹{booking.payment?.amount ?? 'N/A'}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Booking ID:</span>
                        <span className="detail-value">{booking._id}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Payment Method:</span>
                        <span className="detail-value">{booking.payment?.method || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookingsPage;
