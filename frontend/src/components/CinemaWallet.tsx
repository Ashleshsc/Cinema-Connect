import React, { useState, useEffect } from 'react';
import './CinemaWallet.css';

interface WalletProps {
  userId: string;
}

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  date: string;
}

const CinemaWallet: React.FC<WalletProps> = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please login to access wallet');
      return;
    }
    fetchWalletDetails();
  }, []);

  const fetchWalletDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get user ID from token
      const response = await fetch('http://localhost:5000/api/wallet/details', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setBalance(data.balance);
        setTransactions(data.transactions);
      } else {
        setError('Failed to fetch wallet details');
      }
    } catch (err) {
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const addMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/wallet/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Initialize Razorpay payment
        const options = {
          key: data.key,
          amount: data.amount,
          currency: data.currency,
          name: 'CinemaConnect',
          description: 'Wallet Top Up',
          order_id: data.id,
          handler: async function (response: any) {
            try {
              // Verify payment with backend
              const verifyResponse = await fetch('http://localhost:5000/api/wallet/verify', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  amount: parseFloat(amount)
                })
              });

              const verifyData = await verifyResponse.json();
              if (verifyResponse.ok) {
                setBalance(verifyData.newBalance);
                setAmount('');
                alert('Money added successfully!');
                fetchWalletDetails(); // Refresh transactions
              } else {
                setError(verifyData.message || 'Payment verification failed');
              }
            } catch (err) {
              setError('Error verifying payment');
              console.error('Verification error:', err);
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          },
          prefill: {
            name: localStorage.getItem('name') || 'User',
            email: localStorage.getItem('email') || '',
          },
          theme: {
            color: '#e50914'
          }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } else {
        setError(data.message || 'Failed to create payment order');
        setLoading(false);
      }
    } catch (err) {
      setError('Error connecting to server');
      setLoading(false);
      console.error('Add money error:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && transactions.length === 0) {
    return <div className="wallet-loading">Loading wallet...</div>;
  }

  return (
    <div className="cinema-wallet">
      <div className="wallet-header">
        <h2>CinemaConnect Wallet</h2>
        <div className="wallet-balance">
          <span className="balance-label">Available Balance</span>
          <span className="balance-amount">₹{balance.toFixed(2)}</span>
        </div>
      </div>

      <div className="wallet-actions">
        <div className="add-money">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="1"
            step="1"
          />
          <button 
            onClick={addMoney}
            disabled={loading || !amount}
            className="add-money-btn"
          >
            {loading ? 'Processing...' : 'Add Money'}
          </button>
        </div>
        {error && <div className="wallet-error">{error}</div>}
      </div>

      <div className="transactions">
        <h3>Recent Transactions</h3>
        {transactions.length === 0 ? (
          <div className="no-transactions">No transactions yet</div>
        ) : (
          <div className="transaction-list">
            {transactions.map((transaction) => (
              <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                <div className="transaction-info">
                  <span className="transaction-description">{transaction.description}</span>
                  <span className="transaction-date">{formatDate(transaction.date)}</span>
                </div>
                <span className="transaction-amount">
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CinemaWallet;
