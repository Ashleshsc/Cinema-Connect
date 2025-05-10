import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onSectionChange: (section: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  activeSection,
  setActiveSection,
  onSectionChange
}) => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    onSectionChange(section);
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="brand-link">
          <h1><span>🎬 CinemaConnect</span></h1>
        </Link>
      </div>
      
      <div className="nav-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="🔍 Search all movies..."
            defaultValue={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <nav className="navbar">
          <button 
            className={`nav-button ${activeSection === 'featured' ? 'active' : ''}`}
            onClick={() => handleSectionChange('featured')}
          >
            New Releases
          </button>
          <button 
            className={`nav-button ${activeSection === 'top-rated' ? 'active' : ''}`}
            onClick={() => handleSectionChange('top-rated')}
          >
            Top Rated
          </button>
          <button 
            className={`nav-button ${activeSection === 'indian' ? 'active' : ''}`}
            onClick={() => handleSectionChange('indian')}
          >
            Indian Movies
          </button>
          <button 
            className={`nav-button ${activeSection === 'upcoming' ? 'active' : ''}`}
            onClick={() => handleSectionChange('upcoming')}
          >
            Upcoming
          </button>
          <button 
            className={`nav-button ${activeSection === 'rent' ? 'active' : ''}`}
            onClick={() => handleSectionChange('rent')}
          >
            Rent
          </button>
        </nav>
      </div>

      <div className="user-nav">
        {user ? (
          <>
            <button className="profile-button" onClick={toggleDropdown}>
              <div className="profile-circle">
                <span className="profile-icon">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
              </div>
            </button>
            {isDropdownOpen && (
              <div className="user-dropdown">
                <Link to="/profile" className="user-nav-button">
                  <i className="fas fa-user icon"></i>
                  Profile
                </Link>
                <Link to="/my-bookings" className="user-nav-button">
                  <i className="fas fa-ticket-alt icon"></i>
                  My Bookings
                </Link>
                <button onClick={handleLogout} className="user-nav-button">
                  <i className="fas fa-sign-out-alt icon"></i>
                  Logout
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="auth-buttons">
            <Link to="/login" className="auth-button">Login</Link>
            <Link to="/signup" className="auth-button">Sign Up</Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
