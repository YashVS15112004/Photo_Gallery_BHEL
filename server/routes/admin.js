const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Album = require('../models/Album');
const Image = require('../models/Image');
const { adminAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Admin
router.post('/users', [
  adminAuth,
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, email, password, role } = req.body;

    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = new User({
      username,
      email,
      password,
      role,
      isAuthorized: true // Admin-created users are automatically authorized
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Update user
// @access  Admin
router.put('/users/:id', [
  adminAuth,
  body('username').optional().trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be either user or admin'),
  body('isAuthorized').optional().isBoolean().withMessage('isAuthorized must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { username, email, role, isAuthorized } = req.body;
    const updates = {};

    if (username !== undefined && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      updates.username = username;
    }

    if (email !== undefined && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
      updates.email = email;
    }

    if (role !== undefined) {
      updates.role = role;
    }

    if (isAuthorized !== undefined) {
      updates.isAuthorized = isAuthorized;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Delete user's albums and images
    const albums = await Album.find({ createdBy: user._id });
    for (const album of albums) {
      // Delete images in album
      if (album.images.length > 0) {
        await Image.deleteMany({ _id: { $in: album.images } });
      }
      // Delete album
      await Album.findByIdAndDelete(album._id);
    }

    // Delete user
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// @route   POST /api/admin/users/:id/reset-password
// @desc    Reset user password
// @access  Admin
router.post('/users/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate random password
    const newPassword = Math.random().toString(36).substring(2, 15);
    
    // Hash and update password
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      message: 'Password reset successfully',
      newPassword // In production, this should be sent via email
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// @route   GET /api/admin/albums
// @desc    Get all albums (admin view)
// @access  Admin
router.get('/albums', adminAuth, async (req, res) => {
  try {
    const albums = await Album.find()
      .populate('thumbnail', 'path filename')
      .populate('createdBy', 'username')
      .populate('images', 'path filename')
      .sort({ createdAt: -1 });

    res.json({ albums });
  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// @route   DELETE /api/admin/albums/:id
// @desc    Delete album (admin)
// @access  Admin
router.delete('/albums/:id', adminAuth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Delete associated images
    if (album.images.length > 0) {
      await Image.deleteMany({ _id: { $in: album.images } });
    }

    await Album.findByIdAndDelete(req.params.id);

    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get system statistics
// @access  Admin
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const albumCount = await Album.countDocuments();
    const imageCount = await Image.countDocuments();
    const authorizedUserCount = await User.countDocuments({ isAuthorized: true });
    const hiddenAlbumCount = await Album.countDocuments({ isHidden: true });

    // Get recent activity
    const recentUsers = await User.find()
      .sort({ lastLogin: -1 })
      .limit(5)
      .select('username lastLogin');

    const recentAlbums = await Album.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'username')
      .select('name createdBy createdAt');

    const recentImages = await Image.find()
      .sort({ uploadedAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'username')
      .select('originalName uploadedBy uploadedAt');

    res.json({
      stats: {
        userCount,
        albumCount,
        imageCount,
        authorizedUserCount,
        hiddenAlbumCount
      },
      recentActivity: {
        users: recentUsers,
        albums: recentAlbums,
        images: recentImages
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router; 