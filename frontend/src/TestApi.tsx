import React, { useState, useEffect } from 'react';
import { TMDB_API_KEY, TMDB_BASE_URL } from './config';

const TestApi: React.FC = () => {
  const [status, setStatus] = useState<string>('idle');
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('TestApi component mounted');
    console.log('API Key present:', !!TMDB_API_KEY);
    console.log('Base URL present:', !!TMDB_BASE_URL);
  }, []);

  const testApi = async () => {
    setStatus('loading');
    setError(null);
    setResponse(null);

    try {
      const url = `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`;
      console.log('Testing API with URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.status_message || 'API request failed');
      }
      
      setResponse(data);
      setStatus('success');
    } catch (err) {
      console.error('API test failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setStatus('error');
    }
  };

  return (
    <div className="test-api-container">
      <h2>API Connection Test</h2>
      
      <div className="api-config">
        <p>API Key: {TMDB_API_KEY ? '✓ Present' : '✗ Missing'}</p>
        <p>Base URL: {TMDB_BASE_URL ? '✓ Present' : '✗ Missing'}</p>
      </div>

      <button 
        className="test-button"
        onClick={testApi}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Testing...' : 'Test API Connection'}
      </button>

      <div className="test-results">
        {status === 'error' && error && (
          <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {status === 'success' && response && (
          <div className="response-data">
            <h3>Success!</h3>
            <h4>Response Summary:</h4>
            <p>Total Results: {response.total_results}</p>
            <p>Page: {response.page}</p>
            <p>Total Pages: {response.total_pages}</p>
            <p>First Movie: {response.results[0]?.title}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestApi; 