#!/usr/bin/env node

const axios = require('axios');

async function testServer() {
  try {
    console.log('🔍 Testing server connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:5000/api/health');
    console.log('✅ Health check passed:', healthResponse.data);
    
    // Test login
    console.log('🔐 Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.token;
    
    // Test albums endpoint
    console.log('📚 Testing albums endpoint...');
    const albumsResponse = await axios.get('http://localhost:5000/api/albums', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Albums endpoint working');
    console.log('Albums found:', albumsResponse.data.albums.length);
    
    if (albumsResponse.data.albums.length > 0) {
      console.log('First album:', albumsResponse.data.albums[0].name);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testServer(); 