const axios = require('axios');

// API configuration
const API_KEY = 'b2369b1aa7347ec284e849bf9fd06bde';
const BASE_URL = 'https://api.themoviedb.org/3';

console.log('Testing TMDB API with the following configuration:');
console.log(`API Key: ${API_KEY.substring(0, 4)}...`);
console.log(`Base URL: ${BASE_URL}`);

// Function to test the API
async function testApi() {
  try {
    console.log('Making API request to popular movies endpoint...');
    
    const response = await axios.get(`${BASE_URL}/movie/popular`, {
      params: {
        api_key: API_KEY,
        language: 'en-US',
        page: 1
      }
    });
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', response.headers);
    
    // Check if we have results
    if (response.data && response.data.results && response.data.results.length > 0) {
      console.log('API Response Success!');
      console.log(`Found ${response.data.results.length} movies.`);
      console.log('First movie:', response.data.results[0].title);
    } else {
      console.log('API Response Success, but no movies found.');
    }
    
    return true;
  } catch (error) {
    console.error('Error testing API:');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Status Text:', error.response.statusText);
      console.error('Error Response Data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Error Request:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error Message:', error.message);
    }
    
    return false;
  }
}

// Run the test
testApi()
  .then(success => {
    if (success) {
      console.log('API test completed successfully!');
    } else {
      console.log('API test failed. Please check the error messages above.');
    }
  })
  .catch(err => {
    console.error('Unexpected error during API test:', err);
  }); 