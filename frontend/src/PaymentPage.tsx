import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentPage.css';

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

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { movie, theater, screen, showtime, seats, date } = location.state || {};

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    type: ''
  });
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [walletBalance, setWalletBalance] = useState(2000); // Initial wallet balance of Rs 2000

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const data = await response.json();
        setUserProfile(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch (err) {
        setError('Failed to load user profile. Please try logging in again.');
        console.error('Error fetching user profile:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserProfile(JSON.parse(storedUser));
    } else {
      fetchUserProfile();
    }
  }, [navigate]);

  const handlePaymentMethodSelect = (method: string, subOption?: string) => {
    setSelectedPaymentMethod(method);
    if (subOption) {
      switch (method) {
        case 'credit':
          setCardDetails(prev => ({ ...prev, type: subOption }));
          break;
        case 'upi':
          setUpiId(subOption);
          break;
        case 'netbanking':
          setSelectedBank(subOption);
          break;
        case 'wallet':
          setSelectedWallet(subOption);
          break;
      }
    }
  };

  const handleCardInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpiId(e.target.value);
  };

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBank(e.target.value);
  };

  const handleWalletSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedWallet(e.target.value);
  };

  const validateForm = () => {
    if (!userProfile) {
      setError('User profile not loaded');
      return false;
    }
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return false;
    }

    // Validate based on selected payment method
    switch (selectedPaymentMethod) {
      case 'credit':
        if (!cardDetails.number || !cardDetails.name || !cardDetails.expiry || !cardDetails.cvv) {
          setError('Please fill in all card details');
          return false;
        }
        if (cardDetails.number.length !== 16) {
          setError('Please enter a valid 16-digit card number');
          return false;
        }
        if (cardDetails.cvv.length !== 3) {
          setError('Please enter a valid 3-digit CVV');
          return false;
        }
        break;
      case 'upi':
        if (!upiId) {
          setError('Please enter your UPI ID');
          return false;
        }
        if (!upiId.includes('@')) {
          setError('Please enter a valid UPI ID');
          return false;
        }
        break;
      case 'netbanking':
        if (!selectedBank) {
          setError('Please select a bank');
          return false;
        }
        break;
      case 'wallet':
        if (walletBalance < calculateTotal()) {
          setError('Insufficient wallet balance');
          return false;
        }
        break;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        setError('Please login to continue with the payment');
        navigate('/login');
        return;
      }

      // Verify token is valid
      try {
        const response = await fetch('http://localhost:5000/api/auth/verify-token', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Invalid token');
        }
      } catch (err) {
        console.error('Token verification failed:', err);
        setError('Your session has expired. Please login again');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      console.log('Creating order with amount:', calculateTotal() * 100);
      // Create order on backend
      const orderData = {
        amount: calculateTotal() * 100, // Convert to paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          movie: movie.title,
          theater: theater.name,
          screen: screen.name,
          showtime: showtime.time,
          date: date.toISOString(),
          seats: seats.map((s: Seat) => s.id).join(', '),
          paymentMethod: selectedPaymentMethod
        }
      };

      console.log('Sending order data:', orderData);

      const orderResponse = await fetch('http://localhost:5000/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error('Order creation failed:', errorData);
        if (errorData.error === 'No authentication token found') {
          setError('Your session has expired. Please login again');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        throw new Error(errorData.error || 'Failed to create order. Please try again.');
      }

      const order = await orderResponse.json();
      console.log('Order created successfully:', order);

      // For wallet payments, handle directly without Razorpay
      if (selectedPaymentMethod === 'wallet') {
        try {
          // Check if wallet has sufficient balance
          if (walletBalance < calculateTotal()) {
            throw new Error('Insufficient wallet balance');
          }

          // Deduct amount from wallet
          const newBalance = walletBalance - calculateTotal();
          setWalletBalance(newBalance);

          // Verify payment on backend
          const verifyResponse = await fetch('http://localhost:5000/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              paymentMethod: 'wallet',
              amount: calculateTotal() * 100,
              walletBalance: newBalance,
              bookingDetails: {
                user: userProfile ? userProfile._id : localStorage.getItem('userId'),
                movie: {
                  id: movie.id,
                  title: movie.title,
                  poster_path: movie.poster_path
                },
                theater: {
                  id: theater.id,
                  name: theater.name
                },
                screen: {
                  id: screen.id,
                  name: screen.name
                },
                showtime: {
                  id: showtime.id,
                  time: showtime.time,
                  price: showtime.price
                },
                seats: seats.map((seat: Seat) => ({
                  id: seat.id,
                  row: seat.row,
                  number: seat.number
                })),
                date: date instanceof Date ? date.toISOString() : date,
                payment: {
                  method: 'wallet',
                  amount: calculateTotal(),
                  paymentId: `wallet_${Date.now()}`,
                  status: 'success'
                }
              }
            })
          });

          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            console.error('Wallet payment verification failed:', errorData);
            throw new Error(errorData.error || 'Payment verification failed');
          }

          const verificationResult = await verifyResponse.json();
          console.log('Wallet payment verified successfully:', verificationResult);

          // Navigate to confirmation page
          navigate('/confirmation', {
            state: {
              movie,
              theater,
              screen,
              showtime,
              seats,
              date,
              paymentMethod: selectedPaymentMethod,
              amount: calculateTotal(),
              paymentId: `wallet_${Date.now()}`
            }
          });
          return;
        } catch (err) {
          console.error('Wallet payment error:', err);
          setError(err instanceof Error ? err.message : 'Wallet payment failed. Please try again.');
          return;
        }
      }

      // Initialize Razorpay for other payment methods
      const options = {
        key: 'rzp_test_pZ7rJCEC6C1nZd', // Hardcoded test key from backend .env
        amount: order.amount,
        currency: order.currency,
        name: 'CinemaConnect',
        description: `Booking for ${movie.title}`,
        order_id: order.id,
        handler: async function (response: any) {
          console.log('Payment successful, verifying...', response);
          try {
            // Verify payment on backend
            const verifyResponse = await fetch('http://localhost:5000/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                bookingDetails: {
                  user: userProfile ? userProfile._id : localStorage.getItem('userId'),
                  movie: {
                    id: movie.id,
                    title: movie.title,
                    poster_path: movie.poster_path
                  },
                  theater: {
                    id: theater.id,
                    name: theater.name
                  },
                  screen: {
                    id: screen.id,
                    name: screen.name
                  },
                  showtime: {
                    id: showtime.id,
                    time: showtime.time,
                    price: showtime.price
                  },
                  seats: seats.map((seat: Seat) => ({
                    id: seat.id,
                    row: seat.row,
                    number: seat.number
                  })),
                  date: date instanceof Date ? date.toISOString() : date,
                  payment: {
                    method: selectedPaymentMethod,
                    amount: calculateTotal(),
                    paymentId: response.razorpay_payment_id,
                    status: 'success'
                  }
                }
              })
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              console.error('Payment verification failed:', errorData);
              throw new Error(errorData.error || 'Payment verification failed');
            }

            const verificationResult = await verifyResponse.json();
            console.log('Payment verified successfully:', verificationResult);

            // Navigate to confirmation page
            navigate('/confirmation', {
              state: {
                movie,
                theater,
                screen,
                showtime,
                seats,
                date,
                paymentMethod: selectedPaymentMethod,
                amount: calculateTotal(),
                paymentId: response.razorpay_payment_id
              }
            });
          } catch (err) {
            console.error('Payment verification error:', err);
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: userProfile?.name,
          email: userProfile?.email,
          contact: userProfile?.phone
        },
        theme: {
          color: '#ff4d4d'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed by user');
            setError('Payment cancelled by user');
            setLoading(false);
          }
        }
      };

      console.log('Initializing Razorpay with options:', { ...options, key_id: '[REDACTED]' });
      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        console.error('Payment failed:', response.error);
        setError(`Payment failed: ${response.error.description}`);
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!showtime) return 0;
    return seats.length * showtime.price;
  };

  const renderPaymentForm = () => {
    switch (selectedPaymentMethod) {
      case 'credit':
        return (
          <div className="payment-form">
            <h3>Enter Card Details</h3>
            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                name="number"
                value={cardDetails.number}
                onChange={handleCardInputChange}
                placeholder="1234 5678 9012 3456"
                maxLength={16}
              />
            </div>
            <div className="form-group">
              <label>Cardholder Name</label>
              <input
                type="text"
                name="name"
                value={cardDetails.name}
                onChange={handleCardInputChange}
                placeholder="John Doe"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  name="expiry"
                  value={cardDetails.expiry}
                  onChange={handleCardInputChange}
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="text"
                  name="cvv"
                  value={cardDetails.cvv}
                  onChange={handleCardInputChange}
                  placeholder="123"
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        );
      case 'upi':
        return (
          <div className="payment-form">
            <h3>Enter UPI Details</h3>
            <div className="form-group">
              <label>UPI ID</label>
              <input
                type="text"
                value={upiId}
                onChange={handleUpiChange}
                placeholder="username@upi"
              />
            </div>
            <div className="upi-apps">
              <p>Open your UPI app to complete the payment</p>
              <div className="upi-buttons">
                <button onClick={(e) => {
                  e.stopPropagation();
                  handlePaymentMethodSelect('upi', 'googlepay');
                }}>Google Pay</button>
                <button onClick={(e) => {
                  e.stopPropagation();
                  handlePaymentMethodSelect('upi', 'phonepe');
                }}>PhonePe</button>
                <button onClick={(e) => {
                  e.stopPropagation();
                  handlePaymentMethodSelect('upi', 'paytm');
                }}>Paytm</button>
                <button onClick={(e) => {
                  e.stopPropagation();
                  handlePaymentMethodSelect('upi', 'bhim');
                }}>BHIM</button>
              </div>
            </div>
          </div>
        );
      case 'wallet':
        return (
          <div className="payment-form">
            <h3>CinemaConnect Wallet</h3>
            <div className="wallet-balance">
              <h4>Wallet Balance</h4>
              <p>₹{walletBalance}</p>
              {walletBalance < calculateTotal() && (
                <p className="insufficient-balance">Insufficient balance. Please add money to your wallet.</p>
              )}
            </div>
            <div className="wallet-info">
              <p>Use your CinemaConnect wallet balance to pay for tickets</p>
              <p>Current balance: ₹{walletBalance}</p>
              <p>Amount to pay: ₹{calculateTotal()}</p>
            </div>
          </div>
        );
      case 'netbanking':
        return (
          <div className="payment-form">
            <h3>Select Bank</h3>
            <div className="form-group">
              <label>Choose your bank</label>
              <select value={selectedBank} onChange={handleBankSelect}>
                <option value="">Select Bank</option>
                <option value="sbi">State Bank of India</option>
                <option value="hdfc">HDFC Bank</option>
                <option value="icici">ICICI Bank</option>
                <option value="axis">Axis Bank</option>
              </select>
            </div>
            {selectedBank && (
              <div className="bank-redirect">
                <p>You will be redirected to your bank's secure payment page</p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="payment-header">
          <h1>Payment Details</h1>
          <div className="booking-summary">
            <h2>{movie?.title}</h2>
            <p>{theater?.name} • {screen?.name}</p>
            <p>{date?.toLocaleDateString()} • {showtime?.time}</p>
            <p>Selected Seats: {seats?.map((seat: Seat) => `${seat.row}${seat.number}`).join(', ')}</p>
            <p className="total-amount">Total Amount: ₹{calculateTotal()}</p>
            <p className="wallet-balance">Wallet Balance: ₹{walletBalance}</p>
          </div>
        </div>

        <div className="payment-content">
          <div className="booking-summary">
            <h2>Booking Summary</h2>
            <div className="summary-details">
              <div className="movie-info">
                <h3>{movie?.title}</h3>
                <p>{theater?.name} • {screen?.name}</p>
                <p>{date?.toLocaleDateString()} • {showtime?.time}</p>
              </div>
              <div className="seats-info">
                <p>Selected Seats: {seats?.map((s: Seat) => s.id).join(', ')}</p>
                <p>Total Seats: {seats?.length}</p>
                <p>Price per Seat: ₹{showtime?.price}</p>
                <p className="total">Total Amount: ₹{calculateTotal()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="billing-section">
          <h2>Billing Information</h2>
          {userProfile ? (
            <div className="billing-info">
              <p><strong>Name:</strong> {userProfile.name}</p>
              <p><strong>Email:</strong> {userProfile.email}</p>
              <p><strong>Phone:</strong> {userProfile.phone}</p>
              <p><strong>Address:</strong> {userProfile.address}</p>
              <p><strong>City:</strong> {userProfile.city}</p>
              <p><strong>State:</strong> {userProfile.state}</p>
              <p><strong>ZIP Code:</strong> {userProfile.zipCode}</p>
            </div>
          ) : (
            <p>Loading billing information...</p>
          )}
        </div>

        <div className="payment-methods">
          <h2>Select Payment Method</h2>
          <div className="wallet-section">
            <h3>Cinema Wallet</h3>
            <div className="wallet-info">
              <p>Available Balance: ₹{walletBalance}</p>
              {calculateTotal() > walletBalance && (
                <p className="insufficient-balance">Insufficient balance for this transaction</p>
              )}
            </div>
            <button 
              className={`wallet-pay-button ${selectedPaymentMethod === 'wallet' ? 'selected' : ''} ${calculateTotal() > walletBalance ? 'disabled' : ''}`}
              onClick={() => handlePaymentMethodSelect('wallet')}
              disabled={calculateTotal() > walletBalance}
            >
              Pay with Wallet
            </button>
          </div>
          <div className="payment-options">
            <div
              className={`payment-option ${selectedPaymentMethod === 'credit' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('credit')}
            >
              <div className="payment-icon">💳</div>
              <div className="payment-details">
                <h3>Credit/Debit Card</h3>
                <p>Pay using Visa, Mastercard, Rupay, or other cards</p>
                <div className="card-icons">
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('credit', 'visa');
                  }}>Visa</span>
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('credit', 'mastercard');
                  }}>Mastercard</span>
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('credit', 'rupay');
                  }}>Rupay</span>
                </div>
              </div>
            </div>
            <div
              className={`payment-option ${selectedPaymentMethod === 'upi' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('upi')}
            >
              <div className="payment-icon">📱</div>
              <div className="payment-details">
                <h3>UPI</h3>
                <p>Pay using UPI apps</p>
                <div className="upi-icons">
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('upi', 'googlepay');
                  }}>Google Pay</span>
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('upi', 'phonepe');
                  }}>PhonePe</span>
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('upi', 'paytm');
                  }}>Paytm</span>
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('upi', 'bhim');
                  }}>BHIM</span>
                </div>
              </div>
            </div>
            <div
              className={`payment-option ${selectedPaymentMethod === 'wallet' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('wallet')}
            >
              <div className="payment-icon">💰</div>
              <div className="payment-details">
                <h3>CinemaConnect Wallet</h3>
                <p>Pay using your CinemaConnect wallet balance</p>
                <div className="wallet-info">
                  <p>Balance: ₹{walletBalance}</p>
                </div>
              </div>
            </div>
            <div
              className={`payment-option ${selectedPaymentMethod === 'netbanking' ? 'selected' : ''}`}
              onClick={() => handlePaymentMethodSelect('netbanking')}
            >
              <div className="payment-icon">🏦</div>
              <div className="payment-details">
                <h3>Net Banking</h3>
                <p>Pay using your bank account</p>
                <div className="bank-icons">
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('netbanking', 'sbi');
                  }}>SBI</span>
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('netbanking', 'hdfc');
                  }}>HDFC</span>
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('netbanking', 'icici');
                  }}>ICICI</span>
                  <span onClick={(e) => {
                    e.stopPropagation();
                    handlePaymentMethodSelect('netbanking', 'axis');
                  }}>Axis</span>
                </div>
              </div>
            </div>
          </div>
          
          {selectedPaymentMethod && (
            <div className="selected-payment-form">
              {renderPaymentForm()}
            </div>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        <button
          className={`pay-button ${loading ? 'loading' : ''}`}
          onClick={() => {
            if (!userProfile) {
              setError('User profile not loaded');
              return;
            }
            if (!selectedPaymentMethod) {
              setError('Please select a payment method');
              return;
            }
            handlePayment();
          }}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Processing...
            </>
          ) : (
            `Pay ₹${calculateTotal()}`
          )}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;