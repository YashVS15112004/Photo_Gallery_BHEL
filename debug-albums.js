#!/usr/bin/env node

const mongoose = require('mongoose');
const Album = require('./server/models/Album');
const User = require('./server/models/User');
const Image = require('./server/models/Image');
require('dotenv').config({ path: './server/.env' });

async function debugAlbums() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/photo-gallery-bhel';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('📚 Testing Album model directly...');
    
    // Test basic find
    try {
      const albums = await Album.find();
      console.log('✅ Album.find() works - Found', albums.length, 'albums');
    } catch (error) {
      console.error('❌ Album.find() failed:', error.message);
    }
    
    // Test getVisibleAlbums
    try {
      const visibleAlbums = await Album.getVisibleAlbums();
      console.log('✅ Album.getVisibleAlbums() works - Found', visibleAlbums.length, 'visible albums');
    } catch (error) {
      console.error('❌ Album.getVisibleAlbums() failed:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Test with populate
    try {
      const albumsWithPopulate = await Album.find()
        .populate('thumbnail', 'path filename')
        .populate('createdBy', 'username');
      console.log('✅ Album.find() with populate works - Found', albumsWithPopulate.length, 'albums');
      
      if (albumsWithPopulate.length > 0) {
        console.log('Sample album:', {
          id: albumsWithPopulate[0]._id,
          name: albumsWithPopulate[0].name,
          thumbnail: albumsWithPopulate[0].thumbnail,
          createdBy: albumsWithPopulate[0].createdBy
        });
      }
    } catch (error) {
      console.error('❌ Album.find() with populate failed:', error.message);
      console.error('Stack trace:', error.stack);
    }

    // Check if there are any albums
    const albumCount = await Album.countDocuments();
    console.log('📊 Total albums in database:', albumCount);
    
    if (albumCount === 0) {
      console.log('ℹ️  No albums found - this might be the issue');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

debugAlbums(); 