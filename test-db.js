#!/usr/bin/env node

const mongoose = require('mongoose');
const Album = require('./server/models/Album');
const Image = require('./server/models/Image');
require('dotenv').config({ path: './server/.env' });

async function testDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photo-gallery-bhel';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('📚 Testing Album model...');
    
    // Try to find all albums
    const albums = await Album.find();
    console.log('✅ Album.find() works');
    console.log('Albums found:', albums.length);
    
    // Try to get visible albums
    const visibleAlbums = await Album.getVisibleAlbums();
    console.log('✅ Album.getVisibleAlbums() works');
    console.log('Visible albums found:', visibleAlbums.length);
    
    // Check if there are any albums
    if (albums.length === 0) {
      console.log('ℹ️  No albums found in database');
    } else {
      console.log('📋 Sample album:', {
        id: albums[0]._id,
        name: albums[0].name,
        description: albums[0].description,
        isHidden: albums[0].isHidden,
        images: albums[0].images.length
      });
    }

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testDatabase(); 