#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test the upload endpoint
async function testUpload() {
  try {
    // First, let's check if we can connect to the server
    const response = await fetch('http://localhost:5000/api/health');
    const health = await response.json();
    console.log('Server health:', health);
    
    // Check if we have any albums
    const albumsResponse = await fetch('http://localhost:5000/api/albums');
    const albums = await albumsResponse.json();
    console.log('Available albums:', albums);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testUpload(); 