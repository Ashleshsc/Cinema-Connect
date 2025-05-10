import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CinemaWallet from '../components/CinemaWallet';
import './PaymentPage.css';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentState {
  movie: {
    title: string;
    id?: number;
    poster_path?: string;
  };
  theater: {
    name: string;
    id?: string;
  };
  screen: {
    name: string;
    id?: string;
  };
  showtime?: {
    id?: string;
    time?: string;
    price?: number;
  };
  date: Date;
  selectedSeats: {
    id?: string;
    row: string;
    number: number;
  }[];
  totalAmount: number;
}

interface BankOption {
  id: string;
  name: string;
  logo: string;
}

const RAZORPAY_KEY = 'rzp_test_pZ7rJCEC6C1nZd';

const PaymentPage: React.FC = () => {
  // Debug log to verify movie object
  const location = useLocation();
  const state = location.state as PaymentState;
  console.log('Movie received on PaymentPage:', state.movie);
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sample bank list - in production, fetch from your backend
  const bankOptions: BankOption[] = [
    { id: 'sbi', name: 'State Bank of India', logo: '🏦' },
    { id: 'hdfc', name: 'HDFC Bank', logo: '🏦' },
    { id: 'icici', name: 'ICICI Bank', logo: '🏦' },
    { id: 'axis', name: 'Axis Bank', logo: '🏦' },
    { id: 'kotak', name: 'Kotak Bank', logo: '🏦' },
  ];

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  if (!state || !state.movie) {
    return (
      <div className="payment-page">
        <div className="error-message">
          Invalid payment data. Please start over.
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleWalletPayment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call your backend API to process wallet payment
      const response = await fetch('http://localhost:5000/api/wallet/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: state.totalAmount,
          movieTitle: state.movie.title,
          seats: state.selectedSeats,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/confirmation', {
          state: {
            ...state,
            paymentMethod: 'wallet',
            paymentId: data.transactionId,
          }
        });
      } else {
        setError(data.message || 'Insufficient balance');
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!selectedMethod) {
      setError('Please select a payment method');
      setLoading(false);
      return;
    }

    if (selectedMethod === 'wallet') {
      await handleWalletPayment();
      return;
    }

    try {
      const res = await initializeRazorpay();
      if (!res) {
        setError('Razorpay SDK failed to load');
        setLoading(false);
        return;
      }

      // Create order on your backend
      const orderData = {
        amount: state.totalAmount * 100, // Razorpay expects amount in paise
        currency: 'INR',
        payment_method: selectedMethod,
        movie: state.movie.title,
        seats: state.selectedSeats,
      };

      const order = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      }).then(res => res.json());

      const options = {
        key: RAZORPAY_KEY,
        amount: state.totalAmount * 100,
        currency: 'INR',
        name: 'CinemaConnect',
        description: `Booking for ${state.movie.title}`,
        order_id: order.id,
        prefill: {
          email: 'user@example.com', // Get from user context
          contact: '+919999999999', // Get from user context
        },
        handler: async function(response: any) {
          try {
            // Get user ID from localStorage
            const userStr = localStorage.getItem('user');
            const userId = userStr ? JSON.parse(userStr)._id : null;
            
            if (!userId) {
              setError('User ID not found. Please log in again.');
              setLoading(false);
              return; // Stop if user ID is missing
            }

            // Debug log to verify movie object
            console.log('Movie received on PaymentPage:', state.movie);

            // Create a booking details object that EXACTLY matches the Mongoose schema
            const bookingDetails = {
              user: userId,
              movie: {
                id: state.movie.id || 0,
                title: state.movie.title || '',
                poster_path: state.movie.poster_path || ''
              },
              theater: {
                id: state.theater.id || state.theater.name || 'theater-id',
                name: state.theater.name || ''
              },
              screen: {
                id: state.screen.id || state.screen.name || 'screen-id',
                name: state.screen.name || ''
              },
              showtime: {
                id: state.showtime?.id || `showtime-${Date.now()}`,
                time: state.showtime?.time || new Date().toLocaleTimeString(),
                price: state.showtime?.price || (state.totalAmount / state.selectedSeats.length)
              },
              seats: state.selectedSeats.map(seat => ({
                id: seat.id || `seat-${seat.row}-${seat.number}`,
                row: seat.row,
                number: seat.number
              })),
              date: state.date,
              payment: {
                method: selectedMethod,
                amount: state.totalAmount,
                paymentId: response.razorpay_payment_id,
                status: 'success'
              },
              status: 'confirmed'
            };
            
            // Log the exact structure for debugging
            console.log('Booking details:', JSON.stringify(bookingDetails, null, 2));

            // The backend expects these exact fields
            const verificationPayload = {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              bookingDetails: bookingDetails,
              paymentMethod: selectedMethod
            };
            
            // Add Authorization header with token if available
            const token = localStorage.getItem('token');
            const headers = {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            console.log('Sending verification payload:', JSON.stringify(verificationPayload, null, 2));

            const verifyRes = await fetch('http://localhost:5000/api/payment/verify', {
              method: 'POST',
              headers: headers,
              body: JSON.stringify(verificationPayload),
            });
            
            console.log('Verification response status:', verifyRes.status);
            
            const responseText = await verifyRes.text();
            console.log('Raw verification response:', responseText);
            
            let verifyData;
            try {
              verifyData = JSON.parse(responseText);
              console.log('Parsed verification response:', verifyData);
            } catch (parseError) {
              console.error('Error parsing verification response:', parseError);
              setError('Failed to parse server response');
              setLoading(false);
              return;
            }
            
            if (verifyRes.ok && verifyData.success) {
              navigate('/confirmation', {
                state: {
                  ...state,
                  paymentMethod: selectedMethod,
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                },
              });
            } else {
              setError(verifyData.error || 'Payment verification failed');
              setLoading(false);
            }
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <h1>Payment Details</h1>
        
        <div className="booking-summary">
          <h2>Booking Summary</h2>
          <div className="summary-details">
            <div className="summary-row">
              <span>Movie</span>
              <span>{state.movie.title}</span>
            </div>
            <div className="summary-row">
              <span>Theater</span>
              <span>{state.theater.name}</span>
            </div>
            <div className="summary-row">
              <span>Screen</span>
              <span>{state.screen.name}</span>
            </div>
            <div className="summary-row">
              <span>Date & Time</span>
              <span>{formatDate(state.date)}</span>
            </div>
            <div className="summary-row">
              <span>Seats</span>
              <span>
                {state.selectedSeats.map(seat => `${seat.row}${seat.number}`).join(', ')}
              </span>
            </div>
            <div className="summary-row total">
              <span>Total Amount</span>
              <span>₹{state.totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="payment-methods">
          <h2>Select Payment Method</h2>
          <div className="payment-options">
            <div
              className={`payment-option ${selectedMethod === 'wallet' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('wallet')}
            >
              <div className="payment-icon">👛</div>
              <span>CinemaConnect Wallet</span>
            </div>
            <div
              className={`payment-option ${selectedMethod === 'card' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('card')}
            >
              <div className="payment-icon">💳</div>
              <span>Credit/Debit Card</span>
            </div>
            <div
              className={`payment-option ${selectedMethod === 'upi' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('upi')}
            >
              <div className="payment-icon">📱</div>
              <span>UPI Payment</span>
            </div>
            <div
              className={`payment-option ${selectedMethod === 'netbanking' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('netbanking')}
            >
              <div className="payment-icon">🏦</div>
              <span>Net Banking</span>
            </div>
          </div>
        </div>

        {selectedMethod === 'wallet' ? (
          <div className="wallet-section">
            <CinemaWallet userId="current-user-id" />
          </div>
        ) : (
          <form onSubmit={handlePayment} className="payment-form">
            {selectedMethod === 'card' && (
              <div className="card-details">
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      maxLength={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'upi' && (
              <div className="upi-details">
                <div className="form-group">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@bankname"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'netbanking' && (
              <div className="netbanking-details">
                <div className="bank-list">
                  {bankOptions.map(bank => (
                    <div
                      key={bank.id}
                      className={`bank-option ${selectedBank === bank.id ? 'selected' : ''}`}
                      onClick={() => setSelectedBank(bank.id)}
                    >
                      <span className="bank-logo">{bank.logo}</span>
                      <span className="bank-name">{bank.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className={`pay-button ${loading ? 'loading' : ''}`}
              disabled={!selectedMethod || loading}
            >
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Processing...
                </>
              ) : (
                `Pay ₹${state.totalAmount}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
