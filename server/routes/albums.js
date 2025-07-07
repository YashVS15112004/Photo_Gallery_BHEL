const express = require('express');
const { body, validationResult } = require('express-validator');
const Album = require('../models/Album');
const Image = require('../models/Image');
const { auth, optionalAuth } = require('../middleware/auth');
const { logAlbumActivity } = require('../middleware/activityLogger');

const router = express.Router();

// @route   GET /api/albums
// @desc    Get all albums (visible only for public, all for authenticated users)
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    let albums;
    if (req.user && req.user.isAuthorized) {
      // Show all albums to authorized users
      albums = await Album.find({})
        .populate('images', 'path filename caption uploadedAt')
        .populate('thumbnail', 'path filename')
        .populate('createdBy', 'username')
        .sort({ createdAt: -1 });
    } else {
      // Only show visible albums to public
      albums = await Album.getVisibleAlbums();
    }
    res.json({ albums });
  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({ error: 'Failed to fetch albums' });
  }
});

// @route   GET /api/albums/:id
// @desc    Get album by ID, with paginated images
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;

    const album = await Album.findById(req.params.id)
      .populate('thumbnail', 'path filename')
      .populate('createdBy', 'username');

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if album is hidden and user is not authenticated
    if (album.isHidden && !req.user) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Paginate images
    const totalImages = album.images.length;
    const imageIds = album.images.slice(offset, offset + limit);
    // Fetch image objects for the current batch
    const images = await Image.find({ _id: { $in: imageIds } })
      .select('path filename caption uploadedAt')
      .sort({ uploadedAt: 1 });
    // Maintain the order as in album.images
    const imagesOrdered = imageIds.map(id => images.find(img => img._id.toString() === id.toString())).filter(Boolean);

    res.json({
      album: {
        _id: album._id,
        name: album.name,
        description: album.description,
        createdBy: album.createdBy,
        thumbnail: album.thumbnail,
        isHidden: album.isHidden,
        createdAt: album.createdAt,
        totalImages,
        images: imagesOrdered,
      },
      offset,
      limit,
      hasMore: offset + limit < totalImages
    });
  } catch (error) {
    console.error('Get album error:', error);
    res.status(500).json({ error: 'Failed to fetch album' });
  }
});

// @route   POST /api/albums
// @desc    Create new album
// @access  Private
router.post('/', [
  auth,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Album name is required and must be less than 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
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

    const { name, description } = req.body;

    // Check if album name already exists for this user
    const existingAlbum = await Album.findOne({ 
      name, 
      createdBy: req.user._id 
    });
    
    if (existingAlbum) {
      return res.status(400).json({ error: 'Album with this name already exists' });
    }

    const album = new Album({
      name,
      description,
      createdBy: req.user._id
    });

    await album.save();

    // Populate the created album
    await album.populate('createdBy', 'username');

    // Log album creation activity directly
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'create',
      resource: 'album',
      resourceId: album._id,
      details: `Created album '${album.name}'`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      message: 'Album created successfully',
      album
    });
  } catch (error) {
    console.error('Create album error:', error);
    res.status(500).json({ error: 'Failed to create album' });
  }
});

// @route   PUT /api/albums/:id
// @desc    Update album
// @access  Private
router.put('/:id', [
  auth,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Album name must be less than 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters')
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

    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user owns the album or is admin
    if (!req.user.isAuthorized) {
      return res.status(403).json({ error: 'Access denied: not authorized' });
    }

    const { name, description } = req.body;
    const updates = {};

    if (name !== undefined) {
      // Check if album name already exists for this user
      const existingAlbum = await Album.findOne({ 
        name, 
        createdBy: req.user._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingAlbum) {
        return res.status(400).json({ error: 'Album with this name already exists' });
      }
      updates.name = name;
    }

    if (description !== undefined) {
      updates.description = description;
    }

    const updatedAlbum = await Album.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('thumbnail', 'path filename')
    .populate('createdBy', 'username');

    res.json({
      message: 'Album updated successfully',
      album: updatedAlbum
    });
    // Log album update
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'update',
      resource: 'album',
      resourceId: album._id,
      details: `Updated album '${album.name}'`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Update album error:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// @route   PATCH /api/albums/:id
// @desc    Update album properties (visibility, etc.)
// @access  Private
router.patch('/:id', auth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user owns the album or is admin
    if (!req.user.isAuthorized) {
      return res.status(403).json({ error: 'Access denied: not authorized' });
    }

    const updates = {};
    
    if (req.body.isHidden !== undefined) {
      updates.isHidden = req.body.isHidden;
    }

    const updatedAlbum = await Album.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
    .populate('thumbnail', 'path filename')
    .populate('createdBy', 'username');

    res.json({
      message: 'Album updated successfully',
      album: updatedAlbum
    });
  } catch (error) {
    console.error('Patch album error:', error);
    res.status(500).json({ error: 'Failed to update album' });
  }
});

// @route   DELETE /api/albums/:id
// @desc    Delete album
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user owns the album or is admin
    if (!req.user.isAuthorized) {
      return res.status(403).json({ error: 'Access denied: not authorized' });
    }

    // Delete associated images
    if (album.images.length > 0) {
      await Image.deleteMany({ _id: { $in: album.images } });
    }

    await Album.findByIdAndDelete(req.params.id);

    // Log the activity after deletion directly
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'delete_album',
      resource: 'album',
      resourceId: album._id,
      details: 'Deleted album and all associated images',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    res.json({ message: 'Album deleted successfully' });
  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({ error: 'Failed to delete album' });
  }
});

// @route   PUT /api/albums/:id/visibility
// @desc    Toggle album visibility
// @access  Private
router.put('/:id/visibility', auth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user owns the album or is admin
    if (!req.user.isAuthorized) {
      return res.status(403).json({ error: 'Access denied: not authorized' });
    }

    await album.toggleVisibility();

    res.json({
      message: 'Album visibility updated successfully',
      album
    });
    // Log album visibility toggle
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'toggle_visibility',
      resource: 'album',
      resourceId: album._id,
      details: `Toggled visibility for album '${album.name}'`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Toggle visibility error:', error);
    res.status(500).json({ error: 'Failed to update album visibility' });
  }
});

// @route   PUT /api/albums/:id/thumbnail
// @desc    Set album thumbnail
router.put('/:id/thumbnail', [
  auth,
  body('imageId').isMongoId().withMessage('Valid image ID is required')
], async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }
    // Check if user owns the album or is admin
    if (!req.user.isAuthorized) {
      return res.status(403).json({ error: 'Access denied: not authorized' });
    }
    await album.setThumbnail(req.body.imageId);
    await album.populate('thumbnail', 'path filename');
    res.json({
      message: 'Album thumbnail updated successfully',
      album
    });
    // Log album thumbnail modification
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'modify_thumbnail',
      resource: 'album',
      resourceId: album._id,
      details: `Modified thumbnail for album '${album.name}'`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Set thumbnail error:', error);
    res.status(500).json({ error: error.message || 'Failed to set album thumbnail' });
  }
});

// @route   PATCH /api/albums/:id/images/:imageId
// @desc    Update image caption
// @access  Private
router.patch('/:id/images/:imageId', [
  auth,
  body('caption').optional().trim().isLength({ max: 500 }).withMessage('Caption must be less than 500 characters')
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

    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user owns the album or is admin
    if (!req.user.isAuthorized) {
      return res.status(403).json({ error: 'Access denied: not authorized' });
    }

    // Check if image exists in the album
    if (!album.images.includes(req.params.imageId)) {
      return res.status(404).json({ error: 'Image not found in album' });
    }

    // Update the image caption
    const updatedImage = await Image.findByIdAndUpdate(
      req.params.imageId,
      { caption: req.body.caption },
      { new: true, runValidators: true }
    );

    if (!updatedImage) {
      return res.status(404).json({ error: 'Image not found' });
    }

    res.json({
      message: 'Image caption updated successfully',
      image: updatedImage
    });
    // Log image caption modification
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'modify_caption',
      resource: 'image',
      resourceId: req.params.imageId,
      details: `Modified caption for image in album '${album.name}'`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Update image caption error:', error);
    res.status(500).json({ error: 'Failed to update image caption' });
  }
});

// @route   DELETE /api/albums/:id/images/:imageId
// @desc    Delete image from album
// @access  Private
router.delete('/:id/images/:imageId', auth, async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);

    if (!album) {
      return res.status(404).json({ error: 'Album not found' });
    }

    // Check if user owns the album or is admin
    if (!req.user.isAuthorized) {
      return res.status(403).json({ error: 'Access denied: not authorized' });
    }

    // Check if image exists in the album
    if (!album.images.includes(req.params.imageId)) {
      return res.status(404).json({ error: 'Image not found in album' });
    }

    // Remove image from album
    album.images = album.images.filter(imgId => imgId.toString() !== req.params.imageId);
    
    // If this was the thumbnail, clear it
    if (album.thumbnail && album.thumbnail.toString() === req.params.imageId) {
      album.thumbnail = null;
    }

    await album.save();

    // Delete the image file and record
    const image = await Image.findById(req.params.imageId);
    if (image) {
      // Delete the image file
      const fs = require('fs');
      const path = require('path');
      
      try {
        if (fs.existsSync(image.path)) {
          fs.unlinkSync(image.path);
        }
      } catch (fileError) {
        console.error('Error deleting image file:', fileError);
      }

      await Image.findByIdAndDelete(req.params.imageId);
    }

    res.json({ message: 'Image deleted successfully' });
    // Log image deletion
    await require('../models/ActivityLog').logActivity({
      user: req.user._id,
      action: 'delete_image',
      resource: 'image',
      resourceId: req.params.imageId,
      details: `Deleted image from album '${album.name}'`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router; 