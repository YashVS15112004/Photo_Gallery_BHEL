const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Album = require('../models/Album');
const Image = require('../models/Image');
const ActivityLog = require('../models/ActivityLog');
const { adminAuth } = require('../middleware/auth');
const { logUserActivity, logAlbumActivity } = require('../middleware/activityLogger');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Helper to generate a random password
function generateRandomPassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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

// @route   GET /api/admin/me
// @desc    Get current admin user
// @access  Admin
router.get('/me', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Get admin user error:', error);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});

// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { username, password } = req.body;

    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Check if user is authorized
    if (!user.isAuthorized) {
      return res.status(403).json({ error: 'Account not authorized' });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// @route   POST /api/admin/users
// @desc    Create new user
// @access  Admin
router.post('/users', [
  adminAuth,
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['user', 'admin']).withMessage('Role must be either user or admin')
], logUserActivity('create', 'Created new user'), async (req, res) => {
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
    const userPassword = password && password.trim() ? password : generateRandomPassword(12);

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
      password: userPassword,
      role,
      isAuthorized: true // Admin-created users are automatically authorized
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: user.toPublicJSON(),
      generatedPassword: !password ? userPassword : undefined
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
], logUserActivity('update', 'Updated user details'), async (req, res) => {
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
router.delete('/users/:id', adminAuth, logUserActivity('delete', 'Deleted user and all associated content'), async (req, res) => {
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
router.post('/users/:id/reset-password', adminAuth, logUserActivity('update', 'Reset user password'), async (req, res) => {
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

// @route   PUT /api/admin/albums/:id
// @desc    Update album (e.g., toggle visibility)
// @access  Admin
router.put('/albums/:id', adminAuth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    let logDetails = 'Updated album details';
    let logAction = 'update';
    if (req.body.isHidden !== undefined) {
      album.isHidden = req.body.isHidden;
      logAction = 'toggle_visibility';
      logDetails = req.body.isHidden ? 'Album hidden' : 'Album made visible';
    }
    await album.save();
    // Log the activity directly
    await ActivityLog.logActivity({
      user: req.user._id,
      action: logAction,
      resource: 'album',
      resourceId: req.params.id,
      details: logDetails,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
    res.json({ message: 'Album updated successfully', album });
  } catch (error) {
    console.error('Update album error:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// @route   DELETE /api/admin/albums/:id
// @desc    Delete album and all associated images
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

    await Album.findByIdAndDelete(album._id);
    // Log the activity after deletion
    await require('../middleware/activityLogger').logAlbumActivity('delete_album', 'Deleted album and all associated images')(
      req, res, () => {}
    );
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

// @route   GET /api/admin/logs
// @desc    Get activity logs with filters
// @access  Admin
router.get('/logs', adminAuth, async (req, res) => {
  try {
    let userFilter = req.query.user;
    let userIds = undefined;

    if (userFilter === 'user' || userFilter === 'admin') {
      // Find all users with the given role
      const users = await User.find({ role: userFilter }).select('_id');
      userIds = users.map(u => u._id.toString());
      userFilter = undefined;
    }

    const filters = {
      search: req.query.search,
      user: userIds ? userIds : userFilter,
      action: req.query.action,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      limit: parseInt(req.query.limit) || 100
    };

    const logs = await ActivityLog.getLogs(filters);
    res.json({ logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// @route   DELETE /api/admin/logs
// @desc    Clear all activity logs
// @access  Admin
router.delete('/logs', adminAuth, async (req, res) => {
  try {
    await require('../models/ActivityLog').deleteMany({});
    res.json({ message: 'All activity logs cleared' });
  } catch (error) {
    console.error('Clear logs error:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// @route   GET /api/admin/reports
// @desc    Get system reports and analytics
// @access  Admin
router.get('/reports', adminAuth, async (req, res) => {
  try {
    const { from, to } = req.query;
    const dateFilter = {};
    
    if (from || to) {
      dateFilter.createdAt = {};
      if (from) dateFilter.createdAt.$gte = new Date(from);
      if (to) dateFilter.createdAt.$lte = new Date(to + 'T23:59:59.999Z');
    }

    // Get summary statistics
    const summary = {
      newUsers: await User.countDocuments(dateFilter),
      newAlbums: await Album.countDocuments(dateFilter),
      newImages: await Image.countDocuments(dateFilter),
      activeUsers: await User.countDocuments({ lastLogin: { $exists: true, $ne: null } })
    };

    // Get user activity
    const userActivity = await User.aggregate([
      { $match: dateFilter },
      { $sort: { lastLogin: -1 } },
      { $limit: 10 },
      { $project: { username: 1, email: 1, lastLogin: 1 } }
    ]);

    // Get album usage
    const albumUsage = await Album.aggregate([
      { $match: dateFilter },
      { $lookup: { from: 'users', localField: 'createdBy', foreignField: '_id', as: 'creator' } },
      { $unwind: '$creator' },
      { $project: { name: 1, imageCount: { $size: '$images' }, createdBy: '$creator.username' } },
      { $sort: { imageCount: -1 } },
      { $limit: 10 }
    ]);

    // Get system performance metrics
    const performance = {
      storageUsed: '0 MB', // This would be calculated based on actual file sizes
      totalStorage: '1 GB',
      avgResponseTime: '150ms',
      uptime: '99.9%'
    };

    res.json({
      summary,
      userActivity,
      albumUsage,
      performance
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router; 