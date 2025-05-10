import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Booking {
  id: string;
  movieTitle: string;
  date: string;
  time: string;
  theater: string;
  seats: string[];
  totalPrice: number;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings'>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<User | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
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
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        setUser(userData.user || userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!user) {
    return <div className="error">User not found</div>;
  }

  // Handle edit form changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  // Handle save
  const handleSave = async () => {
    if (!editForm) return;
    setSaveLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      const updatedUser = await response.json();
      setUser(updatedUser.user || updatedUser);
      setEditForm(null);
      setEditing(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setEditForm(null);
    setEditing(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-icon">👤</span>
        </div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p>{user.phone}</p>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          My Bookings
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' ? (
          <div className="profile-details">
            {editing && editForm ? (
              <>
                <div className="detail-item">
                  <label>Full Name</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleEditChange} />
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <input type="email" name="email" value={editForm.email} readOnly />
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <input type="tel" name="phone" value={editForm.phone} onChange={handleEditChange} />
                </div>
                <div className="detail-item">
                  <label>Address</label>
                  <input type="text" name="address" value={editForm.address} onChange={handleEditChange} />
                </div>
                <div className="detail-item">
                  <label>City</label>
                  <input type="text" name="city" value={editForm.city} onChange={handleEditChange} />
                </div>
                <div className="detail-item">
                  <label>State</label>
                  <input type="text" name="state" value={editForm.state} onChange={handleEditChange} />
                </div>
                <div className="detail-item">
                  <label>ZIP Code</label>
                  <input type="text" name="zipCode" value={editForm.zipCode} onChange={handleEditChange} />
                </div>
                <div className="edit-actions">
                  <button className="save-button" onClick={handleSave} disabled={saveLoading}>{saveLoading ? 'Saving...' : 'Save'}</button>
                  <button className="cancel-button" onClick={handleCancel} disabled={saveLoading}>Cancel</button>
                </div>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
              </>
            ) : (
              <>
                <div className="detail-item">
                  <label>Full Name</label>
                  <input type="text" value={user.name} readOnly />
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <input type="email" value={user.email} readOnly />
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <input type="tel" value={user.phone} readOnly />
                </div>
                <div className="detail-item">
                  <label>Address</label>
                  <input type="text" value={user.address} readOnly />
                </div>
                <div className="detail-item">
                  <label>City</label>
                  <input type="text" value={user.city} readOnly />
                </div>
                <div className="detail-item">
                  <label>State</label>
                  <input type="text" value={user.state} readOnly />
                </div>
                <div className="detail-item">
                  <label>ZIP Code</label>
                  <input type="text" value={user.zipCode} readOnly />
                </div>
                <button className="edit-button" onClick={() => { setEditForm(user); setEditing(true); }}>Edit Profile</button>
                {error && <div className="error">{error}</div>}
                {success && <div className="success">{success}</div>}
              </>
            )}
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.length > 0 ? (
              bookings.map(booking => (
                <div key={booking.id} className="booking-card">
                  <div className="booking-movie">
                    <h3>{booking.movieTitle}</h3>
                    <div className="booking-details">
                      <p><span>Date:</span> {booking.date}</p>
                      <p><span>Time:</span> {booking.time}</p>
                      <p><span>Theater:</span> {booking.theater}</p>
                      <p><span>Seats:</span> {booking.seats.join(', ')}</p>
                      <p><span>Total:</span> ₹{booking.totalPrice}</p>
                    </div>
                  </div>
                  <div className="booking-actions">
                    <button className="cancel-button">Cancel Booking</button>
                    <button className="download-button">Download Ticket</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-bookings">No bookings found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage; 