const express = require('express');
const router = express.Router();
const axios = require('axios');


router.post('/token', async (req, res) => {
  try {
    // Asgardeo OAuth endpoint
    const tokenEndpoint = 'https://api.asgardeo.io/t/vanshcodeworks/oauth2/token';
    
    // Credentials - store these in your server's environment variables
    const encodedCredentials = process.env.CHOREO_ENCODED_CREDENTIALS || 
      'SXBsYkVpNHJDdEVmTlV3RUppTTdQaFcwaGp3YTpqVHR5WjVyZUhUZDhxdENzRjd6WmxfYTY2WmRSTnF4N0Nhc3JmTWdGM3F3YQ==';
    
    // Make the token request
    const response = await axios({
      method: 'post',
      url: tokenEndpoint,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${encodedCredentials}`
      },
      data: 'grant_type=client_credentials'
    });
    
    // Return the token response to the client
    res.json(response.data);
    
  } catch (error) {
    console.error('Token proxy error:', error.response?.data || error.message);
    
    res.status(error.response?.status || 500).json({
      error: 'token_request_failed',
      error_description: error.response?.data?.error_description || 'Failed to obtain access token'
    });
  }
});

module.exports = router;
