#!/usr/bin/env node

const axios = require('axios');

async function testAlbumsEndpoint() {
  try {
    console.log('🔍 Testing albums endpoint directly...');
    
    // Test without authentication first
    console.log('📚 Testing albums endpoint without auth...');
    try {
      const response = await axios.get('http://localhost:5000/api/albums');
      console.log('✅ Albums endpoint works without auth');
      console.log('Albums found:', response.data.albums.length);
    } catch (error) {
      console.error('❌ Albums endpoint failed without auth:', error.response?.status, error.response?.data);
    }
    
    // Test with authentication
    console.log('🔐 Testing albums endpoint with auth...');
    try {
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'admin',
        password: 'admin123'
      });
      
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      
      const albumsResponse = await axios.get('http://localhost:5000/api/albums', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Albums endpoint works with auth');
      console.log('Albums found:', albumsResponse.data.albums.length);
      
    } catch (error) {
      console.error('❌ Albums endpoint failed with auth:', error.response?.status, error.response?.data);
      if (error.response?.data?.message) {
        console.error('Error message:', error.response.data.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAlbumsEndpoint(); 