import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container">
      <div className="circle-container">
        <div className="circle-content">
          <h1>Welcome to CinemaConnect</h1>
          <p>Book your movie tickets with ease</p>
          <div className="button-group">
            <button 
              className="login-button"
              onClick={() => navigate('/login')}
            >
              Login
            </button>
            <button 
              className="signup-button"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 